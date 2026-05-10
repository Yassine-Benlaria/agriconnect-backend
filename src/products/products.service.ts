import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { FarmerProfile } from '../users/entities/farmer-profile.entity';
import { Commune } from '../geo/entities/commune.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto, ProductSortBy } from './dto/query-products.dto';
import {
  ImageUploadService,
  MAX_IMAGES_PER_PRODUCT,
} from './image-upload.service';

export interface PaginatedProducts {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(FarmerProfile)
    private readonly farmerProfileRepo: Repository<FarmerProfile>,
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async create(farmerId: string, dto: CreateProductDto): Promise<Product> {
    const profile = await this.farmerProfileRepo.findOne({
      where: { userId: farmerId },
    });
    if (!profile) {
      throw new BadRequestException('Complete your farmer profile first');
    }

    const commune = await this.communeRepo.findOneOrFail({
      where: { id: profile.communeId },
    });

    const product = await this.productRepo.save(
      this.productRepo.create({
        farmerId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        priceUnit: dto.priceUnit,
        categoryId: dto.categoryId,
        quantity: dto.quantity,
        communeId: profile.communeId,
        wilayaId: commune.wilayaId,
        isAvailable: true,
      }),
    );

    return this.productRepo.findOneOrFail({
      where: { id: product.id },
      relations: { images: true, category: true, commune: true },
    });
  }

  /**
   * BUYER — §6.1 visibility rule:
   * The buyer's stored `wilayaId` is the hard scope. The `wilaya_id` query
   * parameter from §5 is honoured to allow temporary cross-wilaya browsing,
   * but if it is absent the buyer's own wilaya is ALWAYS used — never all
   * wilayas. Only `is_available = true` products are returned.
   */
  async findAll(
    query: QueryProductsDto,
    buyerWilayaId: number,
  ): Promise<PaginatedProducts> {
    // §6.1: default (and fallback) to the buyer's stored wilayaId
    const scopedQuery: QueryProductsDto = {
      ...query,
      wilayaId: query.wilayaId ?? buyerWilayaId,
    };
    return this.buildPaginatedQuery(scopedQuery, { onlyAvailable: true, includeFarmer: true });
  }

  /** FARMER: their own products regardless of availability */
  async findMyProducts(
    farmerId: string,
    query: QueryProductsDto,
  ): Promise<PaginatedProducts> {
    return this.buildPaginatedQuery(query, { farmerId });
  }

  /** Full detail for FARMER or ADMIN — no availability filter */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { images: true, category: true, farmer: true, commune: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /**
   * Product detail for BUYER — enforces `is_available = true`.
   * A buyer should never be able to access a delisted product by direct ID.
   */
  async findOneForBuyer(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id, isAvailable: true },
      relations: { images: true, category: true, farmer: true, commune: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    farmerId: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.assertOwnership(id, farmerId);
    Object.assign(product, dto);
    await this.productRepo.save(product);
    return this.findOne(id);
  }

  async remove(id: string, farmerId: string): Promise<void> {
    const product = await this.assertOwnership(id, farmerId);
    // Cascade on entity removes image records; clean up disk files too
    product.images?.forEach((img) =>
      this.imageUploadService.deleteFile(img.url),
    );
    await this.productRepo.remove(product);
  }

  // ── Image management ──────────────────────────────────────────────────────

  async addImages(
    productId: string,
    farmerId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    await this.assertOwnership(productId, farmerId);

    const existingCount = await this.imageRepo.countBy({ productId });
    if (existingCount + files.length > MAX_IMAGES_PER_PRODUCT) {
      // Clean up already-written disk files before throwing
      this.imageUploadService.deleteFiles(files);
      throw new BadRequestException(
        `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images ` +
          `(currently ${existingCount})`,
      );
    }

    const images = files.map((file, i) =>
      this.imageRepo.create({
        productId,
        url: this.imageUploadService.buildUrl(file.filename),
        displayOrder: existingCount + i,
      }),
    );

    return this.imageRepo.save(images);
  }

  async removeImage(
    productId: string,
    imageId: string,
    farmerId: string,
  ): Promise<void> {
    await this.assertOwnership(productId, farmerId);

    const image = await this.imageRepo.findOne({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');

    this.imageUploadService.deleteFile(image.url);
    await this.imageRepo.remove(image);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async assertOwnership(
    productId: string,
    farmerId: string,
  ): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    if (product.farmerId !== farmerId) {
      throw new ForbiddenException('You do not own this product');
    }
    return product;
  }

  private async buildPaginatedQuery(
    query: QueryProductsDto,
    opts: {
      farmerId?: string;
      onlyAvailable?: boolean;
      /** When true, LEFT JOINs farmer info for buyer-facing responses (§9.2 farmer card) */
      includeFarmer?: boolean;
    },
  ): Promise<PaginatedProducts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      // Always include images, sorted by display_order
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.category', 'category');

    if (opts.includeFarmer) {
      // Only expose safe public farmer fields (id, fullname, rating, ratingCount)
      qb.leftJoin('p.farmer', 'farmer').addSelect([
        'farmer.id',
        'farmer.fullname',
        'farmer.rating',
        'farmer.ratingCount',
        'farmer.avatarUrl',
      ]);
    }

    // ── Filters ───────────────────────────────────────────────────────────
    if (opts.farmerId) {
      qb.andWhere('p.farmer_id = :farmerId', { farmerId: opts.farmerId });
    }
    if (opts.onlyAvailable) {
      qb.andWhere('p.is_available = true');
    }
    if (query.wilayaId) {
      qb.andWhere('p.wilaya_id = :wilayaId', { wilayaId: query.wilayaId });
    }
    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.dateFrom) {
      qb.andWhere('p.created_at >= :dateFrom', {
        dateFrom: new Date(query.dateFrom),
      });
    }
    if (query.dateTo) {
      // Make dateTo inclusive of the full day (end of day in UTC)
      const endOfDay = new Date(query.dateTo);
      endOfDay.setUTCHours(23, 59, 59, 999);
      qb.andWhere('p.created_at <= :dateTo', { dateTo: endOfDay });
    }
    if (query.search) {
      qb.andWhere(
        '(p.title ILIKE :search OR p.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // ── Sorting ───────────────────────────────────────────────────────────
    switch (query.sortBy) {
      case ProductSortBy.PRICE_ASC:
        qb.orderBy('p.price', 'ASC');
        break;
      case ProductSortBy.PRICE_DESC:
        qb.orderBy('p.price', 'DESC');
        break;
      case ProductSortBy.RATING_DESC:
        qb.orderBy('p.rating', 'DESC');
        break;
      case ProductSortBy.DATE_DESC:
      default:
        qb.orderBy('p.created_at', 'DESC');
    }
    // Secondary sort on images for consistent display_order
    qb.addOrderBy('images.display_order', 'ASC');

    // ── Pagination ────────────────────────────────────────────────────────
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

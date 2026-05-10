import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService, PaginatedProducts } from './products.service';
import {
  ImageUploadService,
  MAX_IMAGES_PER_PRODUCT,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOAD_DIR,
} from './image-upload.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  // ── FARMER endpoints ──────────────────────────────────────────────────────

  /** POST /api/products */
  @Post()
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser('id') farmerId: string,
  ): Promise<Product> {
    return this.productsService.create(farmerId, dto);
  }

  /**
   * GET /api/products/my
   * Must be declared BEFORE /:id to prevent "my" being matched as a UUID param.
   */
  @Get('my')
  @Roles(UserRole.FARMER)
  findMyProducts(
    @Query() query: QueryProductsDto,
    @CurrentUser('id') farmerId: string,
  ): Promise<PaginatedProducts> {
    return this.productsService.findMyProducts(farmerId, query);
  }

  /** PATCH /api/products/:id */
  @Patch(':id')
  @Roles(UserRole.FARMER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('id') farmerId: string,
  ): Promise<Product> {
    return this.productsService.update(id, farmerId, dto);
  }

  /** DELETE /api/products/:id */
  @Delete(':id')
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') farmerId: string,
  ): Promise<void> {
    return this.productsService.remove(id, farmerId);
  }

  /**
   * POST /api/products/:id/images
   * Accepts up to MAX_IMAGES_PER_PRODUCT files per request (field name: "images").
   * Type and size validation is enforced by the multer fileFilter and limits.
   */
  @Post(':id/images')
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES_PER_PRODUCT, {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) =>
        ALLOWED_MIME_TYPES.includes(file.mimetype)
          ? cb(null, true)
          : cb(new Error('Only JPEG, PNG, and WEBP images are allowed'), false),
    }),
  )
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') farmerId: string,
  ): Promise<ProductImage[]> {
    return this.productsService.addImages(id, farmerId, files ?? []);
  }

  /** DELETE /api/products/:id/images/:imgId */
  @Delete(':id/images/:imgId')
  @Roles(UserRole.FARMER)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imgId', ParseUUIDPipe) imgId: string,
    @CurrentUser('id') farmerId: string,
  ): Promise<void> {
    return this.productsService.removeImage(id, imgId, farmerId);
  }

  // ── BUYER endpoints ───────────────────────────────────────────────────────

  /** GET /api/products — defaults wilayaId to buyer's own wilaya */
  @Get()
  @Roles(UserRole.BUYER)
  findAll(
    @Query() query: QueryProductsDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedProducts> {
    return this.productsService.findAll(query, user.wilayaId);
  }

  /** GET /api/products/:id — buyer only sees available products */
  @Get(':id')
  @Roles(UserRole.BUYER)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.findOneForBuyer(id);
  }
}

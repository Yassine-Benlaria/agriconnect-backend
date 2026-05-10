import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * GET /cart — returns the buyer's cart (creates one lazily if missing).
   * Each item includes full product details with the first image.
   */
  async getCart(buyerId: string): Promise<Cart> {
    return this.getOrCreate(buyerId);
  }

  /**
   * POST /cart/items — adds a product to the cart.
   *
   * If the product is already present the quantities are summed (additive
   * behaviour feels more natural than throwing a duplicate error).
   * Returns the full updated cart.
   */
  async addItem(buyerId: string, dto: AddCartItemDto): Promise<Cart> {
    await this.assertProductAvailable(dto.productId);

    const cart = await this.getOrCreate(buyerId);

    const existing = await this.itemRepo.findOne({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(dto.quantity);
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        }),
      );
    }

    return this.loadCart(buyerId);
  }

  /**
   * PATCH /cart/items/:productId — replaces the quantity for an item.
   * Throws 404 if the product is not in the cart.
   */
  async updateItem(
    buyerId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const { item } = await this.assertItemInCart(buyerId, productId);
    item.quantity = dto.quantity;
    await this.itemRepo.save(item);
    return this.loadCart(buyerId);
  }

  /**
   * DELETE /cart/items/:productId — removes a single product from the cart.
   * Throws 404 if the product is not in the cart.
   */
  async removeItem(buyerId: string, productId: string): Promise<Cart> {
    const { item } = await this.assertItemInCart(buyerId, productId);
    await this.itemRepo.remove(item);
    return this.loadCart(buyerId);
  }

  /**
   * DELETE /cart — removes all items but keeps the cart shell.
   * The cart entity itself is retained so its ID remains stable for
   * future use (e.g. linking to an order later).
   */
  async clearCart(buyerId: string): Promise<Cart> {
    const cart = await this.getOrCreate(buyerId);
    await this.itemRepo.delete({ cartId: cart.id });
    return this.loadCart(buyerId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Fetches the cart with fully loaded items → product (+ first image).
   * Using a QueryBuilder gives us control over ordering and partial selects.
   */
  private async loadCart(buyerId: string): Promise<Cart> {
    const cart = await this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('product.images', 'image')
      .leftJoinAndSelect('product.category', 'category')
      .where('cart.buyer_id = :buyerId', { buyerId })
      .orderBy('image.display_order', 'ASC')
      .getOne();

    // Should never be null here — getOrCreate guarantees existence
    return cart!;
  }

  /**
   * Gets the buyer's cart if it exists, or creates an empty one.
   * This implements the "ephemeral / persisted" behaviour described in §4.11.
   */
  private async getOrCreate(buyerId: string): Promise<Cart> {
    const existing = await this.loadCart(buyerId);
    if (existing) return existing;

    await this.cartRepo.save(this.cartRepo.create({ buyerId }));
    return this.loadCart(buyerId);
  }

  /** Resolves the cart + a specific item, throwing if either is missing. */
  private async assertItemInCart(
    buyerId: string,
    productId: string,
  ): Promise<{ cart: Cart; item: CartItem }> {
    const cart = await this.getOrCreate(buyerId);
    const item = await this.itemRepo.findOne({
      where: { cartId: cart.id, productId },
    });
    if (!item) {
      throw new NotFoundException(
        'Product not found in cart',
      );
    }
    return { cart, item };
  }

  /** Ensures the product exists and is currently available for purchase. */
  private async assertProductAvailable(productId: string): Promise<void> {
    const product = await this.productRepo.findOne({
      where: { id: productId, isAvailable: true },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found or no longer available');
    }
  }
}

import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { Review } from './entities/review.entity';
import { User } from '../users/entities/user.entity';

/**
 * TypeORM EntitySubscriber — fires after every Review INSERT.
 *
 * Atomically recalculates the farmer's average rating and rating count
 * using the same EntityManager (and thus the same transaction) that
 * committed the review row. This guarantees the stats are never stale
 * relative to the reviews table.
 *
 * NestJS wiring: the constructor receives `DataSource` via DI and pushes
 * `this` into `dataSource.subscribers` so TypeORM picks it up. This is the
 * standard pattern for DI-aware subscribers in NestJS + TypeORM v0.3.
 */
@Injectable()
@EventSubscriber()
export class ReviewSubscriber implements EntitySubscriberInterface<Review> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): typeof Review {
    return Review;
  }

  /**
   * Recalculates avg(rating) and count(*) for the farmer from all their
   * reviews, then writes both values back to `user.rating` and
   * `user.rating_count` in the same transaction.
   *
   * Using `AVG()` from the DB (not incremental arithmetic) means:
   *  - The calculation is always correct even if rows are deleted later.
   *  - No floating-point drift from successive delta updates.
   */
  async afterInsert(event: InsertEvent<Review>): Promise<void> {
    const { farmerId } = event.entity;

    const result = await event.manager
      .createQueryBuilder(Review, 'r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.farmer_id = :farmerId', { farmerId })
      .getRawOne<{ avg: string; count: string }>();

    const newAvg =
      result ? Math.round(parseFloat(result.avg) * 100) / 100 : 0;
    const newCount = result ? parseInt(result.count, 10) : 0;

    await event.manager
      .createQueryBuilder()
      .update(User)
      .set({ rating: newAvg, ratingCount: newCount })
      .where('id = :farmerId', { farmerId })
      .execute();
  }
}

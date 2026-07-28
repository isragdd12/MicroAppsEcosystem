import { Repository, type SqliteDb } from '@microapps/data';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { feedingTable, type FeedingRow } from '../db/feedingTable';
import {
  createFeedingSchema,
  type CreateFeedingInput,
} from '../validation/feedingSchema';

export type Feeding = FeedingRow;

export class FeedingRepository extends Repository<
  typeof feedingTable,
  Feeding,
  CreateFeedingInput
> {
  constructor(db: SqliteDb, getOwnerId: () => string | null) {
    super({
      db,
      table: feedingTable,
      tableSchema: 'petcare',
      tableName: 'feedings',
      validateCreateInput: (input) => createFeedingSchema.parse(input),
      getOwnerId,
    });
  }

  listForPet(petId: string): Feeding[] {
    return this.db
      .select()
      .from(this.table as never)
      .where(
        and(
          eq(feedingTable.petId, petId),
          isNull(feedingTable.deletedAt),
        ) as never,
      )
      .orderBy(desc(feedingTable.fedAt) as never)
      .all() as unknown as Feeding[];
  }
}

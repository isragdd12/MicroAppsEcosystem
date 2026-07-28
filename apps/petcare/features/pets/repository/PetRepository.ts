import { Repository } from '@microapps/data';
import type { SqliteDb } from '@microapps/data';

import { petsTable, type PetRow } from '../db/petsTable';
import { createPetSchema, type CreatePetInput } from '../validation/petSchema';

export type Pet = PetRow;

export class PetRepository extends Repository<
  typeof petsTable,
  Pet,
  CreatePetInput
> {
  constructor(db: SqliteDb, getOwnerId: () => string | null) {
    super({
      db,
      table: petsTable,
      tableSchema: 'petcare',
      tableName: 'pets',
      validateCreateInput: (input) => createPetSchema.parse(input),
      getOwnerId,
    });
  }
}

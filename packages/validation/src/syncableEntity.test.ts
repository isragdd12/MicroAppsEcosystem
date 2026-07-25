import { z } from 'zod';

import { createInputSchema, syncableEntityBaseSchema } from './syncableEntity';

const widgetSchema = syncableEntityBaseSchema.extend({
  name: z.string().min(1),
  count: z.number().int().nonnegative(),
});

describe('syncableEntityBaseSchema', () => {
  const validEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
    deletedAt: null,
    ownerId: null,
    syncStatus: 'pending' as const,
    name: 'Widget',
    count: 3,
  };

  it('accepts a valid entity with all common columns', () => {
    expect(widgetSchema.safeParse(validEntity).success).toBe(true);
  });

  it('rejects a non-UUID id', () => {
    const result = widgetSchema.safeParse({ ...validEntity, id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid syncStatus value', () => {
    const result = widgetSchema.safeParse({
      ...validEntity,
      syncStatus: 'bogus',
    });
    expect(result.success).toBe(false);
  });

  it('allows ownerId and deletedAt to be null (anonymous, not-deleted record)', () => {
    const result = widgetSchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });
});

describe('createInputSchema', () => {
  const createWidgetSchema = createInputSchema({
    name: z.string().min(1),
    count: z.number().int().nonnegative(),
  });

  it('accepts input with only the domain-specific fields', () => {
    const result = createWidgetSchema.safeParse({ name: 'Widget', count: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects input that is missing a required domain field', () => {
    const result = createWidgetSchema.safeParse({ count: 1 });
    expect(result.success).toBe(false);
  });

  it('strips managed fields even if a caller mistakenly supplies them', () => {
    const parsed = createWidgetSchema.parse({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Widget',
      count: 1,
    });
    expect(parsed).toEqual({ name: 'Widget', count: 1 });
  });
});

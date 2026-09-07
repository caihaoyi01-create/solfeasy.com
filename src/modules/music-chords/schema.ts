import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const musicChordDiscovery = sqliteTable('music_chord_discovery', {
  id: text('id').primaryKey(),
  root: integer('root').notNull(),
  type: text('type').notNull(),
  inversion: integer('inversion').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

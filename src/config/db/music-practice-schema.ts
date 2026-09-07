import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const musicPracticeDay = sqliteTable(
  'music_practice_day',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    day: text('day').notNull(),
    attempts: integer('attempts').notNull().default(0),
    correct: integer('correct').notNull().default(0),
    streak: integer('streak').notNull().default(0),
    best: integer('best').notNull().default(0),
    private: integer('private', { mode: 'boolean' }).notNull().default(false),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('music_practice_day_activity').on(
      table.day,
      table.private,
      table.updatedAt
    ),
  ]
);
export const musicPracticeQuestion = sqliteTable(
  'music_practice_question',
  {
    id: text('id').primaryKey(),
    owner: text('owner').notNull(),
    clef: text('clef').notNull(),
    midi: integer('midi').notNull(),
    createdAt: integer('created_at').notNull(),
    gradedAt: integer('graded_at'),
    correct: integer('correct', { mode: 'boolean' }),
  },
  (table) => [
    index('music_practice_question_owner').on(table.owner, table.createdAt),
  ]
);

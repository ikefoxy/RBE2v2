import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const tournament = sqliteTable('tournament', {
 id: integer('id').primaryKey(), state: text('state').notNull(), revision: integer('revision').notNull().default(0),
});
export const adminLoginAttempts=sqliteTable('admin_login_attempts',{
 id:text('id').primaryKey(),attempts:integer('attempts').notNull(),resetAt:integer('reset_at').notNull(),
});

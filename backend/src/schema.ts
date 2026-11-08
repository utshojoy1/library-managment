import { sql } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  // super_admin | admin | member
  role: text('role').notNull().default('member'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable('sessions', {
  // sha256 of the opaque cookie token — the raw token is never stored.
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Single-use links for email verification and password reset. */
export const emailTokens = pgTable('email_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  purpose: text('purpose').notNull(), // verify_email | reset_password
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Outbox: every message is stored, whether or not SMTP delivered it. */
export const emails = pgTable('emails', {
  id: serial('id').primaryKey(),
  to: text('to').notNull(),
  subject: text('subject').notNull(),
  text: text('text').notNull(),
  status: text('status').notNull().default('queued'), // queued | sent | failed
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
})

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .unique()
    .references(() => users.id, { onDelete: 'set null' }),
  memberNo: text('member_no').notNull().unique(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  joinedAt: date('joined_at').notNull().default(sql`current_date`),
  isActive: boolean('is_active').notNull().default(true),
})

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn'),
  category: text('category'),
  publishedYear: integer('published_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const copies = pgTable('copies', {
  id: serial('id').primaryKey(),
  bookId: integer('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  barcode: text('barcode').notNull().unique(),
  status: text('status').notNull().default('available'),
})

export const loans = pgTable(
  'loans',
  {
    id: serial('id').primaryKey(),
    copyId: integer('copy_id')
      .notNull()
      .references(() => copies.id),
    memberId: integer('member_id')
      .notNull()
      .references(() => members.id),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    status: text('status').notNull().default('active'),
  },
  (t) => [
    // A physical copy can only ever have one active loan.
    uniqueIndex('loans_one_active_per_copy')
      .on(t.copyId)
      .where(sql`status = 'active'`),
    index('loans_active_member')
      .on(t.memberId)
      .where(sql`status = 'active'`),
  ],
)

export type User = typeof users.$inferSelect
export type Member = typeof members.$inferSelect
export type Book = typeof books.$inferSelect
export type Copy = typeof copies.$inferSelect
export type Loan = typeof loans.$inferSelect

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';

// Members table - Party membership applications and approvals
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  region: text('region').notNull(),
  cercle: text('cercle'),
  commune: text('commune'),
  membershipDate: timestamp('membership_date').notNull().defaultNow(),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
});

// Leadership table - Party leadership positions
export const leadership = pgTable('leadership', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  position: text('position').notNull(), // président, vice-président, secrétaire général, etc.
  phone: text('phone'),
  address: text('address'),
  location: text('location'),
  order: integer('order').notNull().default(0),
});

// Donations table - Party donations
export const donations = pgTable('donations', {
  id: uuid('id').primaryKey().defaultRandom(),
  donorName: text('donor_name').notNull(),
  donorEmail: text('donor_email').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  paymentMethod: text('payment_method'), // visa, mastercard, bank_transfer
  status: text('status').notNull().default('pending'), // pending, completed, failed
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Events table - Party events and gatherings
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  location: text('location').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// News table - Party news articles
export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  publishedAt: timestamp('published_at').notNull().defaultNow(),
});

// Messages table - Contact form submissions
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderName: text('sender_name').notNull(),
  senderEmail: text('sender_email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'), // unread, read, replied
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Public chat table - Public chat messages
export const publicChat = pgTable('public_chat', {
  id: uuid('id').primaryKey().defaultRandom(),
  userName: text('user_name').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Political program table - Party platform and policies
export const politicalProgram = pgTable('political_program', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull(), // education, santé, économie, etc.
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').default(0),
});

// Regions table - Mali regions with cercles and communes
export const regions = pgTable('regions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  cercles: jsonb('cercles').notNull(), // Array of cercle objects with communes
});

// Media table - Track uploaded media
export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(), // Storage key from file upload
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
});

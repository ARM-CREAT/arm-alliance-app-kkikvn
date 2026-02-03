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
  createdBy: text('created_by'),
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
  contributionType: text('contribution_type').default('one-time'), // one-time, monthly, annual
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
  createdBy: text('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// News table - Party news articles
export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  createdBy: text('created_by'),
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
  createdBy: text('created_by'),
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

// Video conferences table - Virtual meetings and conferences
export const videoConferences = pgTable('video_conferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  meetingUrl: text('meeting_url').notNull(),
  status: text('status').notNull().default('scheduled'), // scheduled, active, completed, cancelled
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Member Management - Comprehensive member table
export const memberProfiles = pgTable('member_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'), // Foreign key to users table (for authenticated members)
  fullName: text('full_name').notNull(),
  nina: text('nina'), // National ID number
  commune: text('commune').notNull(),
  profession: text('profession').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  membershipNumber: text('membership_number').notNull().unique(), // ARM-YYYY-XXXXX
  qrCode: text('qr_code').notNull(), // QR code data (no unique constraint - visual representation only)
  status: text('status').notNull().default('pending'), // pending, active, suspended
  role: text('role').notNull().default('militant'), // militant, collecteur, superviseur, administrateur
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Cotisations (Membership Fees)
export const cotisations = pgTable('cotisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => memberProfiles.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: text('type').notNull(), // monthly, annual, one-time
  paymentMethod: text('payment_method').notNull(), // sama_money, orange_money, moov_money, bank_transfer
  transactionId: text('transaction_id'),
  status: text('status').notNull().default('pending'), // pending, completed, failed
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Geographic Structure - Regions
export const regionsTable = pgTable('regions_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  memberCount: integer('member_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Geographic Structure - Cercles
export const cercles = pgTable('cercles', {
  id: uuid('id').primaryKey().defaultRandom(),
  regionId: uuid('region_id').notNull().references(() => regionsTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  memberCount: integer('member_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Geographic Structure - Communes
export const communes = pgTable('communes', {
  id: uuid('id').primaryKey().defaultRandom(),
  cercleId: uuid('cercle_id').notNull().references(() => cercles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  memberCount: integer('member_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Internal Messaging
export const internalMessages = pgTable('internal_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  senderId: text('sender_id').notNull(),
  targetRole: text('target_role'), // if null, send to all
  targetRegion: text('target_region'),
  targetCercle: text('target_cercle'),
  targetCommune: text('target_commune'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Election Results - Module Sentinelle
export const electionResults = pgTable('election_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: uuid('member_id').notNull().references(() => memberProfiles.id, { onDelete: 'cascade' }),
  electionType: text('election_type').notNull(),
  region: text('region').notNull(),
  cercle: text('cercle').notNull(),
  commune: text('commune').notNull(),
  bureauVote: text('bureau_vote').notNull(),
  resultsData: jsonb('results_data').notNull(),
  pvPhotoUrl: text('pv_photo_url'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  status: text('status').notNull().default('pending'), // pending, verified, rejected
});

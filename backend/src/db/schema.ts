import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';

// Members table - Member registry with sequential member numbers
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberNumber: text('member_number').notNull().unique(), // ARM-YYYY-NNNNN format (sequential)
  membershipNumber: text('membership_number').unique(), // Alias for memberNumber
  fullName: text('full_name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone').unique(),
  email: text('email').unique(),
  commune: text('commune'),
  region: text('region'),
  profession: text('profession'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  membershipType: text('membership_type').default('standard'), // standard, actif, sympathisant
  message: text('message'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Leadership table - Party leadership positions
export const leadership = pgTable('leadership', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  position: text('position').notNull(), // président, vice-président, secrétaire général, etc.
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  location: text('location'),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  order: integer('order').notNull().default(0),
  orderIndex: integer('order_index'),
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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
  title: text('title'),
  type: text('type'), // image, video, document, etc.
  category: text('category'),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url'),
  uploadedBy: text('uploaded_by'),
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
  firstName: text('first_name'),
  lastName: text('last_name'),
  nina: text('nina'), // National ID number
  commune: text('commune').notNull(),
  region: text('region'),
  cercle: text('cercle'),
  profession: text('profession').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  motivation: text('motivation'),
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

// Message Reads - Track which members have read messages
export const messageReads = pgTable('message_reads', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => internalMessages.id, { onDelete: 'cascade' }),
  memberProfileId: uuid('member_profile_id').notNull().references(() => memberProfiles.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
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

// Conferences table - Virtual meeting rooms with Jit.si integration
export const conferences = pgTable('conferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  duration: integer('duration').notNull().default(60),
  hostName: text('host_name').notNull(),
  roomCode: text('room_code').notNull().unique(),
  joinUrl: text('join_url').notNull(),
  status: text('status').notNull().default('scheduled'),
  participantCount: integer('participant_count').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Calls table - Voice and video call signaling
export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  initiatorId: text('initiator_id').notNull(),
  targetMemberId: text('target_member_id').notNull(),
  callType: text('call_type').notNull(), // audio or video
  roomCode: text('room_code').notNull().unique(),
  joinUrl: text('join_url').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

// App Content table - Ideology and content management
export const appContent = pgTable('app_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Contacts table - Organization contacts
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  type: text('type').notNull().default('general'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// App Settings table - Application configuration
export const appSettings = pgTable('app_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Conversations table - Private chat between members
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  participantIds: text('participant_ids').array().notNull(), // Array of user IDs
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Chat messages table - Private messages in conversations
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull(),
  senderName: text('sender_name').notNull(),
  content: text('content').notNull(),
  readBy: text('read_by').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Programs table - Extended political program with richer fields
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  icon: text('icon'),
  color: text('color'),
  order: integer('order').default(0),
  published: boolean('published').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// AI Conversations table - AI chat history
export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  messages: jsonb('messages').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Contact Messages table - Contact form submissions (distinct from contacts party contacts)
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('unread'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notifications table - Push notifications and announcements
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  body: text('body'), // Alias for content
  type: text('type').notNull(), // 'public', 'militants', 'all'
  category: text('category').notNull(), // 'actualite', 'evenement', 'annonce', 'urgent'
  imageUrl: text('image_url'),
  isPublished: boolean('is_published').notNull().default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Program Sections table - Party program sections with order and icon
export const programSections = pgTable('program_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// CMS News table - Publishable news content (separate from legacy news table)
export const cmsNews = pgTable('cms_news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Announcements table - Urgent and regular announcements
export const announcements = pgTable('announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  priority: text('priority').notNull().default('normal'), // normal, urgent
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Political Messages table - Official party messages and statements
export const politicalMessages = pgTable('political_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  author: text('author'),
  published: boolean('published').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// News Articles table - Full-featured news articles with categories
export const newsArticles = pgTable('news_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary').notNull().default(''),
  category: text('category').notNull(),
  imageUrl: text('image_url').notNull().default(''),
  published: boolean('published').notNull().default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Memberships table - Party memberships with status tracking
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  membershipNumber: text('membership_number').notNull().unique(),
  userId: text('user_id'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  country: text('country').notNull().default('France'),
  birthDate: text('birth_date'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Media Items table - Photos and videos for the party
export const mediaItems = pgTable('media_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'photo' or 'video'
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Direct Message Conversations table
export const dmConversations = pgTable('dm_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: text('member_id').notNull(), // member_number
  memberName: text('member_name').notNull(),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
  unreadCount: integer('unread_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Direct Messages table
export const dmMessages = pgTable('dm_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: text('sender_id').notNull(), // member_number or 'admin'
  senderName: text('sender_name').notNull(),
  recipientId: text('recipient_id').notNull(), // member_number or 'admin'
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Conference Videos table
export const conferenceVideos = pgTable('conference_videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  speaker: text('speaker'),
  duration: text('duration'),
  eventDate: text('event_date'), // Using text for date to match schema
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// API News table - News articles for public API
export const apiNews = pgTable('api_news', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ARM Messages table - Messages with Firebase Firestore sync
export const armMessages = pgTable('arm_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Inbox Messages table - Contact/inbox messages from users
export const inboxMessages = pgTable('inbox_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email'),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

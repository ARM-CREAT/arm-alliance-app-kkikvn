import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import * as admin from 'firebase-admin';

interface CreateArmMessageBody {
  title: string;
  content: string;
  image_url?: string;
}

interface UpdateArmMessageBody {
  title?: string;
  content?: string;
  image_url?: string;
}

// Firebase Admin SDK initialization
let firestoreDb: admin.firestore.Firestore | null = null;

function initializeFirestore() {
  if (!firestoreDb) {
    try {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

      if (serviceAccountKey) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
        });
        firestoreDb = admin.firestore();
      }
    } catch (error) {
      // Silently fail - Firestore is optional
    }
  }
  return firestoreDb;
}

async function syncToFirestore(
  collectionName: string,
  documentId: string,
  data: any,
  app: App
) {
  try {
    const db = initializeFirestore();
    if (!db) return; // Firestore not configured

    await db.collection(collectionName).doc(documentId).set(data, { merge: true });
  } catch (error) {
    // Log but don't throw - Firestore sync is non-critical
    app.logger.warn({ err: error, collectionName, documentId }, 'Failed to sync to Firestore');
  }
}

async function deleteFromFirestore(
  collectionName: string,
  documentId: string,
  app: App
) {
  try {
    const db = initializeFirestore();
    if (!db) return; // Firestore not configured

    await db.collection(collectionName).doc(documentId).delete();
  } catch (error) {
    // Log but don't throw - Firestore sync is non-critical
    app.logger.warn({ err: error, collectionName, documentId }, 'Failed to delete from Firestore');
  }
}

async function isUserAdmin(request: FastifyRequest, app: App): Promise<boolean> {
  try {
    // Try to get user from request object (Better Auth may decorate it)
    const user = (request as any).user;
    let userEmail: string | null = null;

    if (user?.email) {
      userEmail = user.email;
    } else {
      // Fallback: check for email in request context or headers
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return false;
      }
    }

    if (!userEmail) {
      return false;
    }

    const profile = await app.db
      .select()
      .from(schema.memberProfiles)
      .where(eq(schema.memberProfiles.email, userEmail));

    if (profile.length === 0) {
      return false;
    }

    return profile[0].role === 'administrateur' || profile[0].role === 'admin';
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to verify admin role');
    return false;
  }
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/arm-messages - Get all ARM messages (public)
  fastify.get(
    '/api/arm-messages',
    {
      schema: {
        description: 'Get all ARM messages',
        tags: ['arm-messages'],
        response: {
          200: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all ARM messages');

      try {
        const messages = await app.db
          .select()
          .from(schema.armMessages)
          .orderBy(desc(schema.armMessages.createdAt));

        app.logger.info({ count: messages.length }, 'ARM messages retrieved');

        return messages.map(m => ({
          id: m.id,
          title: m.title,
          content: m.content,
          image_url: m.imageUrl,
          created_at: m.createdAt.toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch ARM messages');
        throw error;
      }
    }
  );

  // POST /api/arm-messages - Create ARM message (admin only)
  fastify.post<{ Body: CreateArmMessageBody }>(
    '/api/arm-messages',
    {
      schema: {
        description: 'Create ARM message (admin only)',
        tags: ['arm-messages'],
        body: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateArmMessageBody }>, reply: FastifyReply) => {
      const isAdmin = await isUserAdmin(request, app);
      if (!isAdmin) {
        app.logger.warn('Unauthorized ARM message creation attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { title, content, image_url } = request.body;

      app.logger.info({ title }, 'Creating ARM message');

      try {
        const now = new Date();
        const result = await app.db
          .insert(schema.armMessages)
          .values({
            title,
            content,
            imageUrl: image_url || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const message = result[0];
        app.logger.info({ messageId: message.id }, 'ARM message created');

        // Sync to Firestore asynchronously (non-blocking)
        await syncToFirestore('armMessages', message.id, {
          id: message.id,
          title: message.title,
          content: message.content,
          imageUrl: message.imageUrl,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
        }, app);

        reply.status(201);
        return {
          id: message.id,
          title: message.title,
          content: message.content,
          image_url: message.imageUrl,
          created_at: message.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, title }, 'Failed to create ARM message');
        throw error;
      }
    }
  );

  // PUT /api/arm-messages/:id - Update ARM message (admin only)
  fastify.put<{ Params: { id: string }; Body: UpdateArmMessageBody }>(
    '/api/arm-messages/:id',
    {
      schema: {
        description: 'Update ARM message (admin only)',
        tags: ['arm-messages'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            image_url: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateArmMessageBody }>, reply: FastifyReply) => {
      const isAdmin = await isUserAdmin(request, app);
      if (!isAdmin) {
        app.logger.warn('Unauthorized ARM message update attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { id } = request.params;
      const { title, content, image_url } = request.body;

      app.logger.info({ messageId: id }, 'Updating ARM message');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (image_url !== undefined) updates.imageUrl = image_url;
        updates.updatedAt = new Date();

        const result = await app.db
          .update(schema.armMessages)
          .set(updates)
          .where(eq(schema.armMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'ARM message not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const message = result[0];
        app.logger.info({ messageId: id }, 'ARM message updated');

        // Sync to Firestore asynchronously (non-blocking)
        await syncToFirestore('armMessages', message.id, {
          id: message.id,
          title: message.title,
          content: message.content,
          imageUrl: message.imageUrl,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
        }, app);

        return {
          id: message.id,
          title: message.title,
          content: message.content,
          image_url: message.imageUrl,
          created_at: message.createdAt.toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to update ARM message');
        throw error;
      }
    }
  );

  // DELETE /api/arm-messages/:id - Delete ARM message (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/arm-messages/:id',
    {
      schema: {
        description: 'Delete ARM message (admin only)',
        tags: ['arm-messages'],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const isAdmin = await isUserAdmin(request, app);
      if (!isAdmin) {
        app.logger.warn('Unauthorized ARM message delete attempt');
        reply.status(401);
        return { error: 'Unauthorized' };
      }

      const { id } = request.params;

      app.logger.info({ messageId: id }, 'Deleting ARM message');

      try {
        const result = await app.db
          .delete(schema.armMessages)
          .where(eq(schema.armMessages.id, id))
          .returning();

        if (result.length === 0) {
          app.logger.info({ messageId: id }, 'ARM message not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        app.logger.info({ messageId: id }, 'ARM message deleted');

        // Delete from Firestore asynchronously (non-blocking)
        await deleteFromFirestore('armMessages', id, app);

        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, messageId: id }, 'Failed to delete ARM message');
        throw error;
      }
    }
  );
}

export async function seedArmMessages(app: App) {
  try {
    // Check if already seeded
    const existing = await app.db.select().from(schema.armMessages);

    if (existing.length === 0) {
      app.logger.info('Seeding arm_messages table');

      const now = new Date();
      const seedData = [
        {
          title: 'Bienvenue à l\'Alliance ARM',
          content: 'L\'Alliance pour la République du Mali (ARM) est un parti politique fondé sur les principes de démocratie, de justice et de développement durable.',
          imageUrl: 'https://picsum.photos/seed/arm1/800/400',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Notre engagement envers le Mali',
          content: 'Nous nous engageons à promouvoir un Mali fort, uni et prospère, où chaque citoyen peut contribuer au développement économique et social du pays.',
          imageUrl: 'https://picsum.photos/seed/arm2/800/400',
          createdAt: now,
          updatedAt: now,
        },
        {
          title: 'Rejoignez notre mouvement',
          content: 'Devenez membre de l\'Alliance ARM et participez à la construction d\'un avenir meilleur pour tous. Ensemble, nous pouvons faire une différence.',
          imageUrl: 'https://picsum.photos/seed/arm3/800/400',
          createdAt: now,
          updatedAt: now,
        },
      ];

      await app.db.insert(schema.armMessages).values(seedData);
      app.logger.info({ count: seedData.length }, 'ARM messages seeded');

      // Sync seeded messages to Firestore
      for (const message of seedData) {
        const inserted = await app.db
          .select()
          .from(schema.armMessages)
          .where(eq(schema.armMessages.title, message.title));

        if (inserted.length > 0) {
          await syncToFirestore('armMessages', inserted[0].id, {
            id: inserted[0].id,
            title: inserted[0].title,
            content: inserted[0].content,
            imageUrl: inserted[0].imageUrl,
            createdAt: inserted[0].createdAt.toISOString(),
            updatedAt: inserted[0].updatedAt.toISOString(),
          }, app);
        }
      }
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed arm_messages');
  }
}

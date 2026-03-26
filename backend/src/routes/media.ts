import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { randomUUID } from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

interface CreateMediaBody {
  title?: string;
  url: string;
  fileName: string;
  mimeType: string;
  type?: string;
  category?: string;
  size?: number;
  uploadedBy?: string;
}

interface UpdateMediaBody {
  title?: string;
  type?: string;
  category?: string;
}

function formatMediaItem(item: any) {
  let url = item.url;
  if (!url) {
    url = `/api/media/${item.id}/download`;
  }
  return {
    id: item.id,
    key: item.key,
    fileName: item.fileName,
    title: item.title || null,
    mimeType: item.mimeType,
    type: item.type || null,
    category: item.category || null,
    size: item.size,
    url,
    uploadedBy: item.uploadedBy || null,
    uploadedAt: item.uploadedAt instanceof Date ? item.uploadedAt.toISOString() : new Date(item.uploadedAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/media - Get all media files (public)
  fastify.get(
    '/api/media',
    {
      schema: {
        description: 'Get all uploaded media files',
        tags: ['media'],
        response: {
          200: {
            type: 'object',
            properties: {
              media: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info('Fetching all media files');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .orderBy(desc(schema.media.uploadedAt));

        app.logger.info(
          { count: result.length },
          'Media files fetched successfully'
        );

        return { media: result.map(formatMediaItem) };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch media');
        throw error;
      }
    }
  );

  // GET /api/media/:id - Get single media file (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/media/:id',
    {
      schema: {
        description: 'Get a single media file by ID',
        tags: ['media'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ mediaId: id }, 'Fetching media');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, id as any));

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Media not found' };
        }

        app.logger.info({ mediaId: id }, 'Media fetched');
        return {
          media: formatMediaItem(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to fetch media');
        throw error;
      }
    }
  );

  // POST /api/media - Register media with JSON (public)
  fastify.post<{ Body: CreateMediaBody }>(
    '/api/media',
    {
      schema: {
        description: 'Register a media file with JSON metadata',
        tags: ['media'],
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            url: { type: 'string' },
            fileName: { type: 'string' },
            mimeType: { type: 'string' },
            type: { type: 'string' },
            category: { type: 'string' },
            size: { type: 'number' },
            uploadedBy: { type: 'string' },
          },
          required: ['url', 'fileName', 'mimeType'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateMediaBody }>, reply: FastifyReply) => {
      const { title, url, fileName, mimeType, type, category, size, uploadedBy } = request.body;
      const key = `media_${randomUUID()}`;

      app.logger.info({ fileName, type }, 'Registering media');

      try {
        const result = await app.db
          .insert(schema.media)
          .values({
            key,
            fileName,
            title: title || null,
            mimeType,
            type: type || null,
            category: category || null,
            size: size || 0,
            url: url || null,
            uploadedBy: uploadedBy || null,
          })
          .returning();

        reply.status(201);
        app.logger.info({ mediaId: result[0].id }, 'Media registered');
        return {
          media: formatMediaItem(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, fileName }, 'Failed to register media');
        throw error;
      }
    }
  );

  // POST /api/upload - Upload media file (public)
  fastify.post(
    '/api/upload',
    {
      schema: {
        description: 'Upload a media file',
        tags: ['media'],
        consumes: ['multipart/form-data'],
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();
      if (!data) {
        reply.status(400);
        return { error: 'No file provided' };
      }

      const filename = data.filename;
      const mimetype = data.mimetype;
      const title = (request.body as any)?.title || filename;
      const type = (request.body as any)?.type || null;
      const category = (request.body as any)?.category || null;
      const uploadedBy = (request.body as any)?.uploadedBy || null;

      app.logger.info({ fileName: filename, mimeType: mimetype }, 'Uploading file');

      try {
        // In a real implementation, this would upload to storage
        // For now, we'll create a placeholder URL
        const buffer = await data.toBuffer();
        const size = buffer.length;
        const key = `media_${randomUUID()}`;
        const url = `https://storage.example.com/${key}/${filename}`;

        const result = await app.db
          .insert(schema.media)
          .values({
            key,
            fileName: filename,
            title: title || null,
            mimeType: mimetype,
            type: type || null,
            category: category || null,
            size,
            url,
            uploadedBy: uploadedBy || null,
          })
          .returning();

        reply.status(201);
        app.logger.info({ mediaId: result[0].id, fileName: filename }, 'File uploaded successfully');
        return {
          media: formatMediaItem(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, fileName: filename }, 'Failed to upload file');
        throw error;
      }
    }
  );

  // POST /api/admin/media/upload - Upload media file (admin only)
  fastify.post(
    '/api/admin/media/upload',
    {
      schema: {
        description: 'Upload a media file (admin only)',
        tags: ['admin', 'media'],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              fileName: { type: 'string' },
              mimeType: { type: 'string' },
              size: { type: 'number' },
              uploadedAt: { type: 'string' },
              url: { type: 'string' },
            },
          },
          401: { type: 'object' },
          400: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const adminPassword = request.headers['x-admin-password'];
      if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      app.logger.info(
        { filename: data.filename, mimeType: data.mimetype },
        'Processing file upload'
      );

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.error(
          { err, filename: data.filename },
          'File size limit exceeded'
        );
        return reply.status(413).send({ error: 'File too large' });
      }

      try {
        if (buffer.length === 0) {
          return reply.status(400).send({ error: 'Empty file' });
        }

        // Generate storage key
        const timestamp = Date.now();
        const key = `media/${timestamp}-${data.filename}`;

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, buffer);

        // Store metadata in database with url field
        const downloadUrl = `/api/media/{id}/download`; // Will be updated after insert
        const result = await app.db
          .insert(schema.media)
          .values({
            key: uploadedKey,
            fileName: data.filename,
            mimeType: data.mimetype,
            size: buffer.length,
            url: `/api/media/{id}/download`,
          })
          .returning();

        // Update the URL with actual ID
        const mediaId = result[0].id;
        const finalUrl = `/api/media/${mediaId}/download`;
        await app.db
          .update(schema.media)
          .set({ url: finalUrl })
          .where(eq(schema.media.id, mediaId));

        app.logger.info(
          { mediaId, filename: data.filename, size: buffer.length },
          'File uploaded successfully'
        );

        reply.status(201);
        return {
          id: mediaId,
          fileName: data.filename,
          mimeType: data.mimetype,
          size: buffer.length,
          uploadedAt: result[0].uploadedAt instanceof Date ? result[0].uploadedAt.toISOString() : new Date(result[0].uploadedAt).toISOString(),
          url: finalUrl,
        };
      } catch (error) {
        app.logger.error(
          { err: error, filename: data.filename },
          'Failed to upload file'
        );
        throw error;
      }
    }
  );

  // GET /api/media/:id/download - Download media file (public)
  fastify.get<{ Params: { id: string } }>(
    '/api/media/:id/download',
    {
      schema: {
        description: 'Download a specific media file',
        tags: ['media'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;
      app.logger.info({ mediaId: id }, 'Downloading media file');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, id));

        if (result.length === 0) {
          app.logger.warn({ mediaId: id }, 'Media not found');
          reply.status(404);
          return { error: 'Media not found' };
        }

        const media = result[0];

        // Retrieve file from storage
        try {
          const fileBuffer = await app.storage.download(media.key);

          // Set appropriate headers
          reply.header('Content-Type', media.mimeType);
          reply.header('Content-Disposition', `attachment; filename="${media.fileName}"`);

          app.logger.info({ mediaId: id, fileName: media.fileName }, 'Media file served');
          return reply.send(fileBuffer);
        } catch (storageError) {
          app.logger.error({ err: storageError, mediaId: id, key: media.key }, 'File not found in storage');
          reply.status(404);
          return { error: 'File not found' };
        }
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to download media');
        throw error;
      }
    }
  );

  // PUT /api/media/:id - Update media metadata (public)
  fastify.put<{ Params: { id: string }; Body: UpdateMediaBody }>(
    '/api/media/:id',
    {
      schema: {
        description: 'Update media metadata',
        tags: ['media'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: { type: 'string' },
            category: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateMediaBody }>, reply: FastifyReply) => {
      const { id } = request.params;
      const { title, type, category } = request.body;

      app.logger.info({ mediaId: id }, 'Updating media');

      try {
        const updates: any = {};
        if (title !== undefined) updates.title = title;
        if (type !== undefined) updates.type = type;
        if (category !== undefined) updates.category = category;

        const result = await app.db
          .update(schema.media)
          .set(updates)
          .where(eq(schema.media.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Media not found' };
        }

        app.logger.info({ mediaId: id }, 'Media updated');
        return {
          media: formatMediaItem(result[0]),
        };
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to update media');
        throw error;
      }
    }
  );

  // DELETE /api/admin/media/:id - Delete media file (admin only)
  fastify.delete<{ Params: { id: string } }>(
    '/api/admin/media/:id',
    {
      schema: {
        description: 'Delete a media file (admin only)',
        tags: ['admin', 'media'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const adminPassword = request.headers['x-admin-password'];
      if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }

      const { id } = request.params;
      app.logger.info({ mediaId: id }, 'Deleting media file');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, id));

        if (result.length === 0) {
          app.logger.warn({ mediaId: id }, 'Media not found');
          reply.status(404);
          return { error: 'Not found' };
        }

        const media = result[0];

        // Delete from storage
        try {
          await app.storage.delete(media.key);
        } catch (storageError) {
          app.logger.warn({ err: storageError, mediaId: id, key: media.key }, 'File already deleted from storage or missing');
        }

        // Delete from database
        await app.db.delete(schema.media).where(eq(schema.media.id, id));

        app.logger.info({ mediaId: id, fileName: media.fileName }, 'Media file deleted');
        return { success: true };
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to delete media');
        throw error;
      }
    }
  );
}

export async function seedMedia(app: App) {
  try {
    const existing = await app.db
      .select()
      .from(schema.media)
      .limit(1);

    if (existing.length === 0) {
      app.logger.info('Seeding media');
      const sampleMedia = [
        {
          key: 'media_001',
          fileName: 'rassemblement_bamako.jpg',
          title: 'Rassemblement Bamako 2024',
          mimeType: 'image/jpeg',
          type: 'image',
          category: 'evenements',
          size: 204800,
          url: 'https://picsum.photos/seed/rally1/800/600',
        },
        {
          key: 'media_002',
          fileName: 'discours_president.mp4',
          title: 'Discours du Président',
          mimeType: 'video/mp4',
          type: 'video',
          category: 'discours',
          size: 5242880,
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
        {
          key: 'media_003',
          fileName: 'programme_electoral.pdf',
          title: 'Programme Electoral 2024',
          mimeType: 'application/pdf',
          type: 'document',
          category: 'documents',
          size: 102400,
          url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf',
        },
        {
          key: 'media_004',
          fileName: 'conference_presse.jpg',
          title: 'Conférence de Presse',
          mimeType: 'image/jpeg',
          type: 'image',
          category: 'presse',
          size: 153600,
          url: 'https://picsum.photos/seed/press1/800/600',
        },
      ];

      await app.db.insert(schema.media).values(sampleMedia);
      app.logger.info({ count: sampleMedia.length }, 'Media seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed media');
  }
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';
import { verifyAdminAuth } from '../utils/adminAuth.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/media/upload - Upload media file
  fastify.post(
    '/api/media/upload',
    {
      schema: {
        description: 'Upload a media file (image, video, document)',
        tags: ['media'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
              id: { type: 'string' },
              downloadUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
        // Validate file
        if (buffer.length === 0) {
          return reply.status(400).send({ error: 'Empty file' });
        }

        // Generate storage key
        const timestamp = Date.now();
        const key = `media/${timestamp}-${data.filename}`;

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, buffer);

        // Generate signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Store metadata in database
        const result = await app.db
          .insert(schema.media)
          .values({
            key: uploadedKey,
            fileName: data.filename,
            mimeType: data.mimetype,
            size: buffer.length,
          })
          .returning();

        app.logger.info(
          { mediaId: result[0].id, filename: data.filename, size: buffer.length },
          'File uploaded successfully'
        );

        return {
          url,
          key: uploadedKey,
          id: result[0].id,
          downloadUrl: `/api/media/${result[0].id}/download`,
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

  // GET /api/media - Get all uploaded media
  fastify.get(
    '/api/media',
    {
      schema: {
        description: 'Get all uploaded media files',
        tags: ['media'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      app.logger.info({}, 'Fetching all media files');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .orderBy(schema.media.uploadedAt);

        app.logger.info(
          { count: result.length },
          'Media files fetched successfully'
        );

        return result.map(m => ({
          id: m.id,
          fileName: m.fileName,
          mimeType: m.mimeType,
          size: m.size,
          uploadedAt: m.uploadedAt,
          key: m.key,
        }));
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch media');
        throw error;
      }
    }
  );

  // GET /api/media/:id/download - Download specific media file
  fastify.get<{ Params: { id: string } }>(
    '/api/media/:id/download',
    {
      schema: {
        description: 'Download a specific media file',
        tags: ['media'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      app.logger.info({ mediaId: id }, 'Downloading media file');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .where(eq(schema.media.id, id));

        if (result.length === 0) {
          return reply.status(404).send({ error: 'Media not found' });
        }

        const media = result[0];
        const { url } = await app.storage.getSignedUrl(media.key);

        app.logger.info({ mediaId: id, fileName: media.fileName }, 'Media URL generated');

        // Return signed URL for download
        return {
          downloadUrl: url,
          fileName: media.fileName,
          mimeType: media.mimeType,
          size: media.size,
        };
      } catch (error) {
        app.logger.error({ err: error, mediaId: id }, 'Failed to download media');
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
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              id: { type: 'string' },
              filename: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const admin = await verifyAdminAuth(request, reply, app);
      if (!admin) return;

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file provided' });
      }

      app.logger.info(
        { filename: data.filename, adminId: admin.userId },
        'Admin processing file upload'
      );

      let buffer: Buffer;
      try {
        buffer = await data.toBuffer();
      } catch (err) {
        app.logger.error(
          { err, filename: data.filename, adminId: admin.userId },
          'File size limit exceeded'
        );
        return reply.status(413).send({ error: 'File too large' });
      }

      try {
        // Validate file
        if (buffer.length === 0) {
          return reply.status(400).send({ error: 'Empty file' });
        }

        // Generate storage key
        const timestamp = Date.now();
        const key = `media/${timestamp}-${data.filename}`;

        // Upload to storage
        const uploadedKey = await app.storage.upload(key, buffer);

        // Generate signed URL
        const { url } = await app.storage.getSignedUrl(uploadedKey);

        // Store metadata in database
        const result = await app.db
          .insert(schema.media)
          .values({
            key: uploadedKey,
            fileName: data.filename,
            mimeType: data.mimetype,
            size: buffer.length,
          })
          .returning();

        app.logger.info(
          { mediaId: result[0].id, filename: data.filename, adminId: admin.userId, size: buffer.length },
          'File uploaded successfully by admin'
        );

        return {
          url,
          id: result[0].id,
          filename: data.filename,
          type: data.mimetype,
          size: buffer.length,
        };
      } catch (error) {
        app.logger.error(
          { err: error, filename: data.filename, adminId: admin.userId },
          'Failed to upload file'
        );
        throw error;
      }
    }
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/media/upload - Upload media file
  fastify.post(
    '/api/media/upload',
    {
      schema: {
        description: 'Upload a media file (image or video)',
        tags: ['media'],
        consumes: ['multipart/form-data'],
        response: {
          200: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              key: { type: 'string' },
              id: { type: 'string' },
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
        { filename: data.filename },
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
          { mediaId: result[0].id, filename: data.filename },
          'File uploaded successfully'
        );

        return {
          url,
          key: uploadedKey,
          id: result[0].id,
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

  // GET /api/media - Get all uploaded media (admin only)
  fastify.get(
    '/api/media',
    {
      schema: {
        description: 'Get all uploaded media (admin only)',
        tags: ['media'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info('Fetching all media');

      try {
        const result = await app.db
          .select()
          .from(schema.media)
          .orderBy(schema.media.uploadedAt);

        app.logger.info(
          { count: result.length },
          'Media files fetched successfully'
        );
        return result;
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch media');
        throw error;
      }
    }
  );
}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { desc, sql } from 'drizzle-orm';
import { WebSocket } from 'ws';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ChatMessageBody {
  userName: string;
  message: string;
}

// Store connected WebSocket clients
const chatClients = new Set<WebSocket>();

export function register(app: App, fastify: FastifyInstance) {
  // GET /api/chat/public - Get recent public chat messages (last 100)
  fastify.get(
    '/api/chat/public',
    {
      schema: {
        description: 'Get recent public chat messages',
        tags: ['chat'],
        response: {
          200: { type: 'array' },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching public chat messages');

      try {
        const result = await app.db
          .select()
          .from(schema.publicChat)
          .orderBy(desc(schema.publicChat.createdAt))
          .limit(100);

        // Reverse to get chronological order
        app.logger.info(
          { count: result.length },
          'Public chat messages fetched'
        );
        return result.reverse();
      } catch (error) {
        app.logger.error(
          { err: error },
          'Failed to fetch public chat messages'
        );
        throw error;
      }
    }
  );

  // POST /api/chat/public - Create public chat message
  fastify.post<{ Body: ChatMessageBody }>(
    '/api/chat/public',
    {
      schema: {
        description: 'Send a public chat message',
        tags: ['chat'],
        body: {
          type: 'object',
          properties: {
            userName: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['userName', 'message'],
        },
        response: {
          200: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { userName, message } = request.body;
      app.logger.info(
        { userName },
        'Creating public chat message'
      );

      try {
        const result = await app.db
          .insert(schema.publicChat)
          .values({
            userName,
            message,
          })
          .returning();

        const chatMessage = result[0];

        // Broadcast to all connected WebSocket clients
        const broadcastMessage = JSON.stringify({
          type: 'new_message',
          id: chatMessage.id,
          userName: chatMessage.userName,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
        });

        for (const client of chatClients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMessage);
          }
        }

        app.logger.info(
          { messageId: chatMessage.id, userName },
          'Chat message created and broadcasted'
        );
        return chatMessage;
      } catch (error) {
        app.logger.error(
          { err: error, userName },
          'Failed to create chat message'
        );
        throw error;
      }
    }
  );

  // WebSocket /ws/chat - Real-time public chat
  fastify.route({
    method: 'GET',
    url: '/ws/chat',
    schema: {
      description: 'WebSocket endpoint for real-time public chat',
      tags: ['chat'],
    },
    wsHandler: (socket, request) => {
      chatClients.add(socket);
      app.logger.info(
        { clientCount: chatClients.size },
        'Chat client connected'
      );

      socket.on('message', async (raw) => {
        try {
          const data = JSON.parse(raw.toString());

          if (data.type === 'send_message') {
            const { userName, message } = data;
            app.logger.info(
              { userName },
              'Received chat message via WebSocket'
            );

            // Store in database
            const result = await app.db
              .insert(schema.publicChat)
              .values({
                userName,
                message,
              })
              .returning();

            const chatMessage = result[0];

            // Broadcast to all clients
            const broadcastMessage = JSON.stringify({
              type: 'new_message',
              id: chatMessage.id,
              userName: chatMessage.userName,
              message: chatMessage.message,
              createdAt: chatMessage.createdAt,
            });

            for (const client of chatClients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastMessage);
              }
            }

            app.logger.info(
              { messageId: chatMessage.id },
              'WebSocket message broadcasted'
            );
          }
        } catch (error) {
          app.logger.error({ err: error }, 'Error processing WebSocket message');
          socket.send(
            JSON.stringify({
              type: 'error',
              content: 'Invalid message format',
            })
          );
        }
      });

      socket.on('close', () => {
        chatClients.delete(socket);
        app.logger.info(
          { clientCount: chatClients.size },
          'Chat client disconnected'
        );
      });

      socket.on('error', (error) => {
        app.logger.error({ err: error }, 'WebSocket error');
      });
    },
    handler: async (request, reply) => {
      return { protocol: 'ws', path: '/ws/chat' };
    },
  });
}

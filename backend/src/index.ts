import { createApplication } from "@specific-dev/framework";
import { eq, sql } from 'drizzle-orm';
import * as schema from './db/schema.js';

// Import route registration functions
import * as membershipRoutes from './routes/membership.js';
import * as leadershipRoutes from './routes/leadership.js';
import * as donationRoutes from './routes/donations.js';
import * as eventRoutes from './routes/events.js';
import * as newsRoutes from './routes/news.js';
import * as messageRoutes from './routes/messages.js';
import * as chatRoutes from './routes/chat.js';
import * as programRoutes from './routes/program.js';
import * as regionRoutes from './routes/regions.js';
import * as mediaRoutes from './routes/media.js';
import * as aiRoutes from './routes/ai.js';
import * as analyticsRoutes from './routes/analytics.js';
import * as adminRoutes from './routes/admin.js';
import * as conferenceRoutes from './routes/conferences.js';
import * as adminAnalyticsRoutes from './routes/adminAnalytics.js';
import * as memberManagementRoutes from './routes/memberManagement.js';
import * as geographyRoutes from './routes/geography.js';
import * as electionsRoutes from './routes/elections.js';
import * as internalMessagingRoutes from './routes/internalMessaging.js';
import * as adminMembersRoutes from './routes/adminMembers.js';
import * as initGeographyRoutes from './routes/initGeography.js';
import * as healthRoutes from './routes/health.js';
import * as callRoutes from './routes/calls.js';
import * as ideologyRoutes from './routes/ideology.js';
import * as contactRoutes from './routes/contacts.js';
import * as settingsRoutes from './routes/settings.js';
import { initializeData } from './routes/init.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Enable storage for file uploads
app.withStorage();

// Initialize default data
await initializeData(app);

// Register all route modules
// IMPORTANT: Always use registration functions to avoid circular dependency issues
healthRoutes.register(app, app.fastify);
membershipRoutes.register(app, app.fastify);
leadershipRoutes.register(app, app.fastify);
donationRoutes.register(app, app.fastify);
eventRoutes.register(app, app.fastify);
newsRoutes.register(app, app.fastify);
messageRoutes.register(app, app.fastify);
chatRoutes.register(app, app.fastify);
programRoutes.register(app, app.fastify);
regionRoutes.register(app, app.fastify);
mediaRoutes.register(app, app.fastify);
aiRoutes.register(app, app.fastify);
analyticsRoutes.register(app, app.fastify);
adminRoutes.register(app, app.fastify);
conferenceRoutes.register(app, app.fastify);
adminAnalyticsRoutes.register(app, app.fastify);
memberManagementRoutes.register(app, app.fastify);
geographyRoutes.register(app, app.fastify);
electionsRoutes.register(app, app.fastify);
internalMessagingRoutes.register(app, app.fastify);
adminMembersRoutes.register(app, app.fastify);
initGeographyRoutes.register(app, app.fastify);
callRoutes.register(app, app.fastify);
ideologyRoutes.register(app, app.fastify);
contactRoutes.register(app, app.fastify);
settingsRoutes.register(app, app.fastify);

// Seed data
await conferenceRoutes.seedDefaultConference(app);
await settingsRoutes.seedSettings(app);
await eventRoutes.seedEvents(app);
await leadershipRoutes.seedLeadership(app);

// Setup WebSocket signaling for conferences
import {
  addParticipant,
  removeParticipant,
  broadcastToRoom,
  broadcastToRoomExcludeSender,
} from './utils/conferenceStore.js';
import { randomUUID } from 'crypto';

app.fastify.register(async (fastify) => {
  fastify.get<{ Params: { roomCode: string }; Querystring: { name?: string; isHost?: string } }>(
    '/ws/conference/:roomCode',
    { websocket: true },
    async (socket, request) => {
      const roomCode = request.params.roomCode;
      const name = (request.query.name as string) || 'Anonymous';
      const isHost = ((request.query.isHost as string) || 'false') === 'true';
      const participantId = randomUUID();

      app.logger.info(
        { roomCode, participantId, name, isHost },
        'WebSocket connection established'
      );

      // Add participant to room
      addParticipant(roomCode, participantId, name, socket, isHost);

      try {
        // Update participant count in database
        const conf = await app.db
          .update(schema.conferences)
          .set({
            participantCount: sql`${schema.conferences.participantCount} + 1`,
          })
          .where(eq(schema.conferences.roomCode, roomCode))
          .returning();

        // Broadcast participant joined
        broadcastToRoom(roomCode, {
          type: 'participant-joined',
          name,
          participantCount: conf[0]?.participantCount || 1,
        });

        // Handle incoming messages
        socket.on('message', async (data) => {
          try {
            const message = JSON.parse(data.toString());
            app.logger.debug(
              { roomCode, participantId, messageType: message.type },
              'WebSocket message received'
            );

            // Relay message to other participants
            broadcastToRoomExcludeSender(roomCode, message, participantId);
          } catch (error) {
            // Silently ignore malformed messages
            app.logger.warn(
              { roomCode, participantId, err: error },
              'Failed to parse WebSocket message'
            );
          }
        });

        // Handle disconnect
        socket.on('close', async () => {
          app.logger.info(
            { roomCode, participantId, name },
            'WebSocket connection closed'
          );

          removeParticipant(roomCode, participantId);

          try {
            // Update participant count in database
            const updatedConf = await app.db
              .update(schema.conferences)
              .set({
                participantCount: sql`GREATEST(${schema.conferences.participantCount} - 1, 0)`,
              })
              .where(eq(schema.conferences.roomCode, roomCode))
              .returning();

            // Broadcast participant left
            broadcastToRoom(roomCode, {
              type: 'participant-left',
              name,
              participantCount: updatedConf[0]?.participantCount || 0,
            });
          } catch (error) {
            app.logger.error(
              { err: error, roomCode, participantId },
              'Failed to update participant count on disconnect'
            );
          }
        });
      } catch (error) {
        app.logger.error(
          { err: error, roomCode, participantId },
          'WebSocket connection error'
        );
        socket.close();
      }
    }
  );
});

await app.run();
app.logger.info('A.R.M Political Party Platform running');

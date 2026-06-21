import { createApplication } from "@specific-dev/framework";
import { eq, sql } from 'drizzle-orm';
import * as schema from './db/schema.js';

// Import route registration functions
import * as membershipRoutes from './routes/membership.js';
import * as leadershipRoutes from './routes/leadership.js';
import * as donationRoutes from './routes/donations.js';
import * as eventRoutes from './routes/events.js';
import * as newsRoutes from './routes/news.js'; // API news using api_news table
// Disabled: import * as messageRoutes from './routes/messages.js';
// Disabled: import * as chatRoutes from './routes/chat.js';
import * as programRoutes from './routes/program.js';
import * as regionRoutes from './routes/regions.js';
// Disabled: import * as mediaRoutes from './routes/media.js';
// Disabled: import * as aiRoutes from './routes/ai.js';
import * as analyticsRoutes from './routes/analytics.js';
import * as adminRoutes from './routes/admin.js';
import * as conferenceRoutes from './routes/conferences.js';
import * as adminAnalyticsRoutes from './routes/adminAnalytics.js';
// Disabled: memberManagement.ts conflicts with membersApi.ts - using membersApi.ts as the single source of truth
// import * as memberManagementRoutes from './routes/memberManagement.js';
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
import * as conversationRoutes from './routes/conversations.js';
import * as extendedProgramRoutes from './routes/programs.js';
import * as membershipsRoutes from './routes/memberships.js';
import * as notificationsRoutes from './routes/notifications.js';
import * as membersApiRoutes from './routes/membersApi.js';
import * as directionRoutes from './routes/direction.js';
import * as cmsNewsRoutes from './routes/cms-news.js';
import * as announcementsRoutes from './routes/announcements.js';
import * as politicalMessagesRoutes from './routes/political-messages.js';
import * as newsArticlesRoutes from './routes/newsArticles.js';
import * as adminAuthRoutes from './routes/adminAuth.js';
import * as memberLoginRoutes from './routes/memberLogin.js';
import * as mediaItemsRoutes from './routes/mediaItems.js';
import * as directMessagesRoutes from './routes/directMessages.js';
import * as conferenceVideosRoutes from './routes/conferenceVideos.js';
import * as memberStatsRoutes from './routes/memberStats.js';
import * as armMessagesRoutes from './routes/armMessages.js';
import * as membersAndMessagesRoutes from './routes/membersAndMessages.js';
import * as cotisationsRoutes from './routes/cotisations.js';
import * as adhesionRoutes from './routes/adhesion.js';
import * as userNotificationsRoutes from './routes/userNotifications.js';
import * as pollsRoutes from './routes/polls.js';
import * as publicChatRoutes from './routes/publicChat.js';
import { initializeData } from './routes/init.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Enable authentication
app.withAuth();

// Enable storage for file uploads
app.withStorage();

// Add a hook to enforce role-based access control on Better Auth sign-in
app.fastify.addHook('onSend', async (request, reply, payload) => {
  // Only check /api/auth/sign-in/email responses
  if (request.method === 'POST' && request.url === '/api/auth/sign-in/email' && reply.statusCode === 200) {
    try {
      // Parse the response payload
      let data = typeof payload === 'string' ? JSON.parse(payload) : payload;

      // Check if user was authenticated
      if (data && data.user && data.user.email) {
        const email = data.user.email;
        app.logger.debug({ email }, 'Checking role for Better Auth sign-in');

        // Look up user's role in member_profiles
        const profile = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.email, email));

        if (profile.length > 0) {
          const userRole = profile[0].role;

          // If user is admin, return 403 and revoke session
          if (userRole === 'admin' || userRole === 'administrateur') {
            app.logger.warn({ email, userRole }, 'Better Auth sign-in blocked: User is admin');

            // Revoke the session that was just created
            if (data.session && (app as any).auth) {
              try {
                await (app as any).auth.api.revokeSession({
                  body: { sessionId: data.session.id },
                });
              } catch (revokeError) {
                app.logger.warn({ err: revokeError }, 'Failed to revoke admin session');
              }
            }

            // Return 403 response
            reply.statusCode = 403;
            return JSON.stringify({ error: 'Please use the admin login portal.' });
          }

          // Add role to response if user is non-admin
          data.user.role = userRole;
          return JSON.stringify(data);
        }
      }
    } catch (error) {
      app.logger.warn({ err: error }, 'Error checking role in sign-in hook');
      // Continue without blocking if there's an error
    }
  }

  return payload;
});

// Initialize default data
await initializeData(app);

// Register all route modules
// IMPORTANT: Always use registration functions to avoid circular dependency issues
adminAuthRoutes.register(app, app.fastify);
memberLoginRoutes.register(app, app.fastify);
healthRoutes.register(app, app.fastify);
membershipRoutes.register(app, app.fastify);
leadershipRoutes.register(app, app.fastify);
donationRoutes.register(app, app.fastify);
eventRoutes.register(app, app.fastify);
newsRoutes.register(app, app.fastify); // API news using api_news table
// messageRoutes.register(app, app.fastify); // Disabled
// chatRoutes.register(app, app.fastify); // Disabled
programRoutes.register(app, app.fastify);
regionRoutes.register(app, app.fastify);
// mediaRoutes.register(app, app.fastify); // Disabled
// aiRoutes.register(app, app.fastify); // Disabled
analyticsRoutes.register(app, app.fastify);
adminRoutes.register(app, app.fastify);
conferenceRoutes.register(app, app.fastify);
adminAnalyticsRoutes.register(app, app.fastify);
// memberManagementRoutes.register(app, app.fastify); // Disabled: conflicts with membersApi.ts
geographyRoutes.register(app, app.fastify);
electionsRoutes.register(app, app.fastify);
internalMessagingRoutes.register(app, app.fastify);
adminMembersRoutes.register(app, app.fastify);
initGeographyRoutes.register(app, app.fastify);
callRoutes.register(app, app.fastify);
ideologyRoutes.register(app, app.fastify);
contactRoutes.register(app, app.fastify);
settingsRoutes.register(app, app.fastify);
conversationRoutes.register(app, app.fastify);
extendedProgramRoutes.register(app, app.fastify);
membershipsRoutes.register(app, app.fastify);
notificationsRoutes.register(app, app.fastify);
membersApiRoutes.register(app, app.fastify);
// memberStatsRoutes.register(app, app.fastify); // Disabled: GET /api/stats/members already defined in membersApiRoutes
directionRoutes.register(app, app.fastify);
cmsNewsRoutes.register(app, app.fastify);
announcementsRoutes.register(app, app.fastify);
politicalMessagesRoutes.register(app, app.fastify);
// newsArticlesRoutes.register(app, app.fastify); // Disabled: conflicts with newsRoutes (api_news table)
mediaItemsRoutes.register(app, app.fastify);
directMessagesRoutes.register(app, app.fastify);
conferenceVideosRoutes.register(app, app.fastify);
armMessagesRoutes.register(app, app.fastify);
membersAndMessagesRoutes.register(app, app.fastify);
cotisationsRoutes.register(app, app.fastify);
adhesionRoutes.register(app, app.fastify);
userNotificationsRoutes.register(app, app.fastify);
pollsRoutes.register(app, app.fastify);
publicChatRoutes.register(app, app.fastify);

// Seed data
await adminAuthRoutes.seedAdminUser(app);
await conferenceRoutes.seedDefaultConference(app);
await settingsRoutes.seedSettings(app);
await eventRoutes.seedEvents(app);
await newsRoutes.seedApiNews(app); // Seed api_news table
await leadershipRoutes.seedLeadership(app);
await extendedProgramRoutes.seedPrograms(app);
await notificationsRoutes.seedNotifications(app);
await programRoutes.seedProgramSections(app);
await membersApiRoutes.seedMembers(app);
await directionRoutes.seedDirection(app);
// await mediaRoutes.seedMedia(app); // Disabled
await cmsNewsRoutes.seedCmsNews(app);
await announcementsRoutes.seedAnnouncements(app);
await politicalMessagesRoutes.seedPoliticalMessages(app);
// await newsArticlesRoutes.seedNewsArticles(app); // Disabled: using newsRoutes for api_news instead
await membershipsRoutes.seedMemberships(app);
await mediaItemsRoutes.seedMediaItems(app);
await conferenceVideosRoutes.seedConferenceVideos(app);
await armMessagesRoutes.seedArmMessages(app);
await membersAndMessagesRoutes.seedMembersAndMessages(app);
await adhesionRoutes.seedAdhesion(app);
await pollsRoutes.seedPolls(app);
await eventRoutes.seedEvents(app);

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

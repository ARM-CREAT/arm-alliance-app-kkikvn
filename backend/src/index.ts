import { createApplication } from "@specific-dev/framework";
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

await app.run();
app.logger.info('A.R.M Political Party Platform running');

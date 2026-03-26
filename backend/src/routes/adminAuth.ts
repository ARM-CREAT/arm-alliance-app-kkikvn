import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface LoginBody {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export function register(app: App, fastify: FastifyInstance) {
  // Routes are handled by admin.ts - this file only provides seed function
}

export async function seedAdminUser(app: App) {
  try {
    const email = 'admin@alliance-arm.fr';
    const password = 'Admin2025!';
    const name = 'Admin Alliance ARM';

    app.logger.info({ email }, 'Checking if admin user exists');

    // Check if admin user already exists
    const existingProfile = await app.db
      .select()
      .from(schema.memberProfiles)
      .where(eq(schema.memberProfiles.email, email));

    if (existingProfile.length === 0) {
      app.logger.info({ email }, 'Creating admin user via Better Auth');

      try {
        // Create user via Better Auth
        const signUpResult = await (app as any).auth.api.signUpEmail({
          body: { email, password, name },
        });

        if (signUpResult && signUpResult.user) {
          app.logger.info({ userId: signUpResult.user.id }, 'Admin user created via Better Auth');

          // Insert into member_profiles
          await app.db.insert(schema.memberProfiles).values({
            userId: signUpResult.user.id,
            fullName: name,
            email,
            role: 'admin',
            commune: 'Bamako',
            profession: 'Administrateur',
            phone: '+22300000000',
            membershipNumber: 'ADMIN-001',
            qrCode: 'ADMIN-001',
            status: 'active',
            firstName: 'Admin',
            lastName: 'Alliance ARM',
          });

          app.logger.info({ email }, 'Admin user seeded successfully');
        }
      } catch (error: any) {
        // If user creation fails, try to create member_profiles with null userId
        if (error.message && error.message.includes('already exists')) {
          app.logger.warn({ email }, 'User already exists in Better Auth, skipping creation');
        } else {
          app.logger.error({ err: error }, 'Failed to create admin user via Better Auth');
        }

        // Try to insert member profile anyway (in case user exists but profile doesn't)
        try {
          const existing = await app.db
            .select()
            .from(schema.memberProfiles)
            .where(eq(schema.memberProfiles.email, email));

          if (existing.length === 0) {
            await app.db.insert(schema.memberProfiles).values({
              fullName: name,
              email,
              role: 'admin',
              commune: 'Bamako',
              profession: 'Administrateur',
              phone: '+22300000000',
              membershipNumber: 'ADMIN-001',
              qrCode: 'ADMIN-001',
              status: 'active',
              firstName: 'Admin',
              lastName: 'Alliance ARM',
            });

            app.logger.info({ email }, 'Admin member profile created');
          }
        } catch (profileError) {
          app.logger.warn({ err: profileError, email }, 'Could not create/update admin member profile');
        }
      }
    } else {
      app.logger.info({ email }, 'Admin user already exists');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Failed to seed admin user');
  }
}

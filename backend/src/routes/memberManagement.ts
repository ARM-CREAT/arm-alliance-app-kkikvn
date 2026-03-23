import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, desc, and, sql, count as countFn, gte, or, ilike } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface RegisterMemberBody {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  city?: string;
  region?: string;
  cercle?: string;
  commune?: string;
  nina?: string;
  profession?: string;
  motivation?: string;
}

interface InitiateCotisationBody {
  amount: number;
  type: 'monthly' | 'annual' | 'one-time';
  paymentMethod: 'sama_money' | 'orange_money' | 'moov_money' | 'bank_transfer';
}

interface ConfirmCotisationBody {
  cotisationId: string;
  transactionId: string;
}

interface UpdateMemberStatusBody {
  status: 'active' | 'pending' | 'suspended' | 'rejected';
}

interface UpdateMemberBody {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  commune?: string;
  region?: string;
  cercle?: string;
  profession?: string;
  nina?: string;
  motivation?: string;
}

const FRENCH_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// Helper to check if user is admin
async function checkAdminRole(app: App, userId: string): Promise<boolean> {
  const member = await app.db
    .select()
    .from(schema.memberProfiles)
    .where(and(eq(schema.memberProfiles.userId, userId)));
  return member.length > 0 && ['admin', 'superadmin'].includes(member[0].role);
}

// Format member card response
function formatMemberCard(member: any) {
  return {
    id: member.id,
    fullName: member.fullName,
    membershipNumber: member.membershipNumber,
    commune: member.commune,
    region: member.region,
    cercle: member.cercle || null,
    profession: member.profession,
    phone: member.phone,
    email: member.email || null,
    status: member.status,
    role: member.role,
    nina: member.nina || null,
    joinedAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : new Date(member.createdAt).toISOString(),
    createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : new Date(member.createdAt).toISOString(),
  };
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/members/register - Register new member (PUBLIC)
  fastify.post<{ Body: RegisterMemberBody }>(
    '/api/members/register',
    {
      schema: {
        description: 'Register as a new member (public)',
        tags: ['members'],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            commune: { type: 'string' },
            nina: { type: 'string' },
            profession: { type: 'string' },
            motivation: { type: 'string' },
          },
          required: ['firstName', 'lastName', 'phone'],
        },
        response: {
          201: { type: 'object' },
          400: { type: 'object' },
          409: { type: 'object' },
          500: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { firstName, lastName, phone, email, region, cercle, commune, nina, profession, motivation } = request.body;

      // Step 2: Validate required fields
      if (!firstName || firstName.toString().trim() === '') {
        reply.status(400);
        return { error: 'firstName requis' };
      }

      if (!lastName || lastName.toString().trim() === '') {
        reply.status(400);
        return { error: 'lastName requis' };
      }

      if (!phone || phone.toString().trim() === '') {
        reply.status(400);
        return { error: 'phone requis' };
      }

      app.logger.info({ firstName, lastName, phone }, 'New member registration');

      try {
        // Step 3: Apply defaults for NOT NULL columns
        const finalCommune = commune && commune.trim() ? commune : 'Non spécifié';
        const finalProfession = profession && profession.trim() ? profession : 'Non spécifié';

        // Step 4: Generate membership_number safely with transaction
        const year = new Date().getFullYear();

        // Query for max membership number for current year
        const maxResult = await app.db
          .select({
            maxNum: sql<string>`MAX(${schema.memberProfiles.membershipNumber})`,
          })
          .from(schema.memberProfiles)
          .where(sql`${schema.memberProfiles.membershipNumber} LIKE ${`ARM-${year}-%`}`);

        let nextSeq = 1;
        if (maxResult[0]?.maxNum) {
          // Parse the numeric suffix from "ARM-YYYY-NNNN"
          const parts = maxResult[0].maxNum.split('-');
          if (parts.length === 3) {
            const currentSeq = parseInt(parts[2], 10);
            if (!isNaN(currentSeq)) {
              nextSeq = currentSeq + 1;
            }
          }
        }

        const paddedSeq = String(nextSeq).padStart(4, '0');
        const membershipNumber = `ARM-${year}-${paddedSeq}`;

        // Step 5: Insert into member_profiles
        const fullName = `${firstName} ${lastName}`;

        const result = await app.db
          .insert(schema.memberProfiles)
          .values({
            fullName,
            firstName: firstName.toString().trim(),
            lastName: lastName.toString().trim(),
            phone: phone.toString().trim(),
            email: email ? email.toString().trim() : null,
            commune: finalCommune,
            region: region ? region.toString().trim() : null,
            cercle: cercle ? cercle.toString().trim() : null,
            profession: finalProfession,
            nina: nina ? nina.toString().trim() : null,
            motivation: motivation ? motivation.toString().trim() : null,
            membershipNumber,
            qrCode: membershipNumber,
            status: 'pending',
            role: 'member',
            userId: null,
          })
          .returning();

        reply.status(201);
        app.logger.info({ memberId: result[0].id, membershipNumber }, 'Member registered successfully');

        // Step 7: Return success response
        return {
          membershipNumber,
          id: result[0].id,
          message: 'Inscription réussie',
        };
      } catch (error: any) {
        // Step 8: Comprehensive error handling
        console.error('POST /api/members/register error:', error);
        console.error('Error message:', error?.message);
        console.error('Error code:', error?.code);

        // Step 6: Handle unique constraint violation on phone
        if (error?.code === '23505') {
          app.logger.warn({ phone }, 'Phone already registered (constraint violation)');
          try {
            const existing = await app.db
              .select({ id: schema.memberProfiles.id, membershipNumber: schema.memberProfiles.membershipNumber })
              .from(schema.memberProfiles)
              .where(eq(schema.memberProfiles.phone, phone))
              .limit(1);

            if (existing.length > 0) {
              reply.status(409);
              return {
                error: 'Déjà inscrit',
                membershipNumber: existing[0].membershipNumber,
                id: existing[0].id,
              };
            }
          } catch (queryError) {
            app.logger.error({ err: queryError }, 'Failed to query existing member after constraint violation');
          }
        }

        // Default server error response
        reply.status(500);
        return {
          error: 'Erreur serveur',
          details: error?.message || 'Unknown error',
        };
      }
    }
  );

  // GET /api/members/card/:membershipNumber - Get member card (PUBLIC)
  fastify.get<{ Params: { membershipNumber: string } }>(
    '/api/members/card/:membershipNumber',
    {
      schema: {
        description: 'Get member card by membership number',
        tags: ['members'],
        params: {
          type: 'object',
          properties: { membershipNumber: { type: 'string' } },
        },
        response: {
          200: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const { membershipNumber } = request.params;
      app.logger.info({ membershipNumber }, 'Fetching member card');

      try {
        // ISSUE 5: Case-insensitive lookup using UPPER()
        const result = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(sql`UPPER(${schema.memberProfiles.membershipNumber}) = UPPER(${membershipNumber})`);

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Membre introuvable' };
        }

        // ISSUE 5: Return with formatMemberCard helper
        return formatMemberCard(result[0]);
      } catch (error) {
        app.logger.error({ err: error, membershipNumber }, 'Failed to fetch member card');
        throw error;
      }
    }
  );

  // POST /api/cotisations/initiate - Initiate payment (AUTHENTICATED)
  fastify.post<{ Body: InitiateCotisationBody }>(
    '/api/cotisations/initiate',
    {
      schema: {
        description: 'Initiate membership fee payment',
        tags: ['cotisations'],
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            type: { type: 'string', enum: ['monthly', 'annual', 'one-time'] },
            paymentMethod: { type: 'string', enum: ['sama_money', 'orange_money', 'moov_money', 'bank_transfer'] },
          },
          required: ['amount', 'type', 'paymentMethod'],
        },
        response: {
          201: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { amount, type, paymentMethod } = request.body;
      const userId = session.user.id;

      app.logger.info({ userId, amount, type }, 'Initiating cotisation payment');

      try {
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId));

        if (memberResult.length === 0) {
          reply.status(404);
          return { error: 'Profil membre introuvable' };
        }

        const memberId = memberResult[0].id;
        const result = await app.db
          .insert(schema.cotisations)
          .values({
            memberId,
            amount: amount.toString(),
            type,
            paymentMethod,
            status: 'pending',
          })
          .returning();

        reply.status(201);
        return {
          cotisationId: result[0].id,
          membershipNumber: memberResult[0].membershipNumber,
          paymentInstructions: 'Veuillez effectuer le paiement via Orange Money ou Moov Money',
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to initiate cotisation');
        throw error;
      }
    }
  );

  // POST /api/cotisations/confirm - Confirm payment (AUTHENTICATED)
  fastify.post<{ Body: ConfirmCotisationBody }>(
    '/api/cotisations/confirm',
    {
      schema: {
        description: 'Confirm membership fee payment',
        tags: ['cotisations'],
        body: {
          type: 'object',
          properties: {
            cotisationId: { type: 'string' },
            transactionId: { type: 'string' },
          },
          required: ['cotisationId', 'transactionId'],
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { cotisationId, transactionId } = request.body;
      const userId = session.user.id;

      app.logger.info({ userId, cotisationId }, 'Confirming cotisation payment');

      try {
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId));

        if (memberResult.length === 0) {
          reply.status(404);
          return { error: 'Profil membre introuvable' };
        }

        const memberId = memberResult[0].id;

        const cotisationResult = await app.db
          .select()
          .from(schema.cotisations)
          .where(and(eq(schema.cotisations.id, cotisationId as any), eq(schema.cotisations.memberId, memberId)));

        if (cotisationResult.length === 0) {
          reply.status(404);
          return { error: 'Cotisation introuvable' };
        }

        // Update cotisation
        await app.db
          .update(schema.cotisations)
          .set({ status: 'completed', transactionId, paidAt: new Date() })
          .where(eq(schema.cotisations.id, cotisationId as any));

        // Update member status to active
        await app.db
          .update(schema.memberProfiles)
          .set({ status: 'active', updatedAt: new Date() })
          .where(eq(schema.memberProfiles.id, memberId));

        app.logger.info({ userId, cotisationId }, 'Cotisation confirmed');
        return { success: true, message: 'Paiement confirmé' };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to confirm cotisation');
        throw error;
      }
    }
  );

  // GET /api/cotisations/my-history - Get payment history (AUTHENTICATED)
  fastify.get(
    '/api/cotisations/my-history',
    {
      schema: {
        description: 'Get user\'s cotisation payment history',
        tags: ['cotisations'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching cotisation history');

      try {
        const memberResult = await app.db
          .select()
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.userId, userId));

        if (memberResult.length === 0) {
          reply.status(404);
          return { error: 'Profil membre introuvable' };
        }

        const memberId = memberResult[0].id;
        const result = await app.db
          .select()
          .from(schema.cotisations)
          .where(eq(schema.cotisations.memberId, memberId))
          .orderBy(desc(schema.cotisations.createdAt));

        const cotisations = result.map((c: any) => ({
          id: c.id,
          amount: c.amount,
          type: c.type,
          paymentMethod: c.paymentMethod,
          transactionId: c.transactionId,
          status: c.status,
          paidAt: c.paidAt instanceof Date ? c.paidAt.toISOString() : c.paidAt ? new Date(c.paidAt).toISOString() : null,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
        }));

        return { cotisations };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch cotisation history');
        throw error;
      }
    }
  );

  // ISSUE 8: PATCH /api/admin/memberships/:id/status - Update member status (AUTHENTICATED ADMIN)
  fastify.patch<{ Params: { id: string }; Body: UpdateMemberStatusBody }>(
    '/api/admin/memberships/:id/status',
    {
      schema: {
        description: 'Update member status (admin only)',
        tags: ['admin', 'members'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: { status: { type: 'string', enum: ['active', 'pending', 'suspended', 'rejected'] } },
          required: ['status'],
        },
        response: {
          200: { type: 'object' },
          400: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { status } = request.body;
      const userId = session.user.id;

      if (!['active', 'pending', 'suspended', 'rejected'].includes(status)) {
        reply.status(400);
        return { error: 'Statut invalide' };
      }

      app.logger.info({ userId, memberId: id, status }, 'Updating member status');

      try {
        const isAdmin = await checkAdminRole(app, userId);
        if (!isAdmin) {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        // ISSUE 8: Update member_profiles with status and updated_at
        const result = await app.db
          .update(schema.memberProfiles)
          .set({ status, updatedAt: new Date() })
          .where(eq(schema.memberProfiles.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Membre introuvable' };
        }

        app.logger.info({ memberId: id, status }, 'Member status updated');

        // ISSUE 8: Exact response format with fullName mapped from full_name
        return {
          success: true,
          member: {
            id: result[0].id,
            fullName: result[0].fullName,
            status: result[0].status,
          },
        };
      } catch (error) {
        app.logger.error({ err: error, userId, memberId: id }, 'Failed to update member status');
        throw error;
      }
    }
  );

  // GET /api/admin/membership-stats - Get membership statistics (AUTHENTICATED ADMIN)
  fastify.get(
    '/api/admin/membership-stats',
    {
      schema: {
        description: 'Get membership statistics (admin only)',
        tags: ['admin', 'members'],
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching membership statistics');

      try {
        const isAdmin = await checkAdminRole(app, userId);
        if (!isAdmin) {
          reply.status(403);
          return { error: 'Accès refusé' };
        }

        // Get totals
        const allMembers = await app.db.select().from(schema.memberProfiles);
        const activeMembers = allMembers.filter((m: any) => m.status === 'active').length;
        const pendingMembers = allMembers.filter((m: any) => m.status === 'pending').length;
        const suspendedMembers = allMembers.filter((m: any) => m.status === 'suspended').length;

        // Get monthly registrations for last 6 months
        const monthlyData = new Map<number, number>();
        const now = new Date();
        for (let i = 0; i < 6; i++) {
          const month = (now.getMonth() - i + 12) % 12;
          monthlyData.set(month, 0);
        }

        allMembers.forEach((m: any) => {
          const memberDate = m.createdAt instanceof Date ? m.createdAt : new Date(m.createdAt);
          const month = memberDate.getMonth();
          if (memberDate.getFullYear() === now.getFullYear()) {
            monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
          }
        });

        const monthlyRegistrations = Array.from({ length: 6 }, (_, i) => {
          const month = (now.getMonth() - i + 12) % 12;
          return { month: FRENCH_MONTHS[month], count: monthlyData.get(month) || 0 };
        }).reverse();

        app.logger.info({ total: allMembers.length }, 'Membership stats retrieved');
        return {
          stats: {
            total: allMembers.length,
            active: activeMembers,
            pending: pendingMembers,
            suspended: suspendedMembers,
          },
          monthlyRegistrations,
        };
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch membership stats');
        throw error;
      }
    }
  );

  // GET /api/members/stats - Get public membership statistics (PUBLIC)
  fastify.get(
    '/api/members/stats',
    {
      schema: {
        description: 'Get public membership statistics',
        tags: ['members'],
        response: {
          200: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              pending: { type: 'number' },
              approved: { type: 'number' },
              rejected: { type: 'number' },
              byRegion: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    region: { type: 'string' },
                    count: { type: 'number' },
                  },
                },
              },
              recentCount: { type: 'number' },
              thisMonth: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      app.logger.info('Fetching public membership statistics');

      try {
        // Get total count
        const totalResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles);
        const total = totalResult[0]?.count ?? 0;

        // Get pending count
        const pendingResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'pending'));
        const pending = pendingResult[0]?.count ?? 0;

        // Get approved count (status = 'approved' OR status = 'active')
        const approvedResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(or(
            eq(schema.memberProfiles.status, 'approved'),
            eq(schema.memberProfiles.status, 'active')
          ));
        const approved = approvedResult[0]?.count ?? 0;

        // Get rejected count
        const rejectedResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'rejected'));
        const rejected = rejectedResult[0]?.count ?? 0;

        // Get by region (exclude NULL regions)
        const byRegionResult = await app.db
          .select({
            region: schema.memberProfiles.region,
            count: countFn(),
          })
          .from(schema.memberProfiles)
          .where(sql`${schema.memberProfiles.region} IS NOT NULL`)
          .groupBy(schema.memberProfiles.region)
          .orderBy(desc(countFn()));

        const byRegion = byRegionResult.map((r: any) => ({
          region: r.region,
          count: r.count,
        }));

        // Get recent count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(gte(schema.memberProfiles.createdAt, thirtyDaysAgo));
        const recentCount = recentResult[0]?.count ?? 0;

        // Get this month count
        const thisMonthResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(
            sql`DATE_TRUNC('month', ${schema.memberProfiles.createdAt}) = DATE_TRUNC('month', NOW())`
          );
        const thisMonth = thisMonthResult[0]?.count ?? 0;

        app.logger.info({ total, pending, approved, rejected }, 'Public membership statistics retrieved');

        return {
          total,
          pending,
          approved,
          rejected,
          byRegion,
          recentCount,
          thisMonth,
        };
      } catch (error) {
        app.logger.error({ err: error }, 'Failed to fetch public membership statistics');
        throw error;
      }
    }
  );

  // PUT /api/members/:id - Update member (AUTHENTICATED)
  fastify.put<{ Params: { id: string }; Body: UpdateMemberBody }>(
    '/api/members/:id',
    {
      schema: {
        description: 'Update member profile (authenticated)',
        tags: ['members'],
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            commune: { type: 'string' },
            region: { type: 'string' },
            cercle: { type: 'string' },
            profession: { type: 'string' },
            nina: { type: 'string' },
            motivation: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      const { firstName, lastName, phone, email, commune, region, cercle, profession, nina, motivation } = request.body;

      app.logger.info({ userId: session.user.id, memberId: id }, 'Updating member profile');

      try {
        // Prepare update values
        const updateValues: any = { updatedAt: new Date() };

        if (firstName) updateValues.firstName = firstName.toString().trim();
        if (lastName) updateValues.lastName = lastName.toString().trim();
        if (phone) updateValues.phone = phone.toString().trim();
        if (email) updateValues.email = email.toString().trim();
        if (commune) updateValues.commune = commune.toString().trim();
        if (region) updateValues.region = region.toString().trim();
        if (cercle) updateValues.cercle = cercle.toString().trim();
        if (profession) updateValues.profession = profession.toString().trim();
        if (nina) updateValues.nina = nina.toString().trim();
        if (motivation) updateValues.motivation = motivation.toString().trim();

        // Update full_name if firstName or lastName changed
        if (firstName || lastName) {
          const member = await app.db.select().from(schema.memberProfiles).where(eq(schema.memberProfiles.id, id as any)).limit(1);
          if (member.length > 0) {
            const newFirstName = firstName || member[0].firstName;
            const newLastName = lastName || member[0].lastName;
            updateValues.fullName = `${newFirstName} ${newLastName}`;
          }
        }

        const result = await app.db
          .update(schema.memberProfiles)
          .set(updateValues)
          .where(eq(schema.memberProfiles.id, id as any))
          .returning();

        if (result.length === 0) {
          reply.status(404);
          return { error: 'Membre non trouvé' };
        }

        const updated = result[0];
        app.logger.info({ memberId: id }, 'Member profile updated');

        return {
          id: updated.id,
          fullName: updated.fullName,
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
          email: updated.email,
          commune: updated.commune,
          region: updated.region,
          cercle: updated.cercle,
          profession: updated.profession,
          membershipNumber: updated.membershipNumber,
          status: updated.status,
          role: updated.role,
          joinedAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : new Date(updated.createdAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id, memberId: id }, 'Failed to update member');
        throw error;
      }
    }
  );

  // GET /api/cotisations/all - Get all cotisations (AUTHENTICATED)
  fastify.get(
    '/api/cotisations/all',
    {
      schema: {
        description: 'Get all cotisations with member details (admin)',
        tags: ['cotisations'],
        response: {
          200: {
            type: 'object',
            properties: {
              cotisations: { type: 'array' },
              total: { type: 'number' },
              totalAmount: { type: 'string' },
            },
          },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching all cotisations');

      try {
        const cotisations = await app.db.select().from(schema.cotisations).orderBy(desc(schema.cotisations.createdAt));

        // Get member details for each cotisation
        const withMembers = await Promise.all(
          cotisations.map(async (c: any) => {
            const member = await app.db
              .select()
              .from(schema.memberProfiles)
              .where(eq(schema.memberProfiles.id, c.memberId))
              .limit(1);

            return {
              id: c.id,
              amount: c.amount,
              type: c.type,
              paymentMethod: c.paymentMethod,
              transactionId: c.transactionId,
              status: c.status,
              paidAt: c.paidAt instanceof Date ? c.paidAt.toISOString() : c.paidAt ? new Date(c.paidAt).toISOString() : null,
              createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date(c.createdAt).toISOString(),
              memberName: member[0]?.fullName || 'Unknown',
              membershipNumber: member[0]?.membershipNumber || 'Unknown',
            };
          })
        );

        const totalAmount = cotisations
          .filter((c: any) => c.status === 'completed')
          .reduce((sum: any, c: any) => sum + parseFloat(c.amount), 0)
          .toFixed(2);

        app.logger.info({ count: withMembers.length, totalAmount }, 'All cotisations fetched');
        return { cotisations: withMembers, total: withMembers.length, totalAmount };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch cotisations');
        throw error;
      }
    }
  );

  // GET /api/admin/dashboard - Get admin dashboard stats (AUTHENTICATED)
  fastify.get(
    '/api/admin/dashboard',
    {
      schema: {
        description: 'Get admin dashboard statistics',
        tags: ['admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              totalMembers: { type: 'number' },
              activeMembers: { type: 'number' },
              pendingMembers: { type: 'number' },
              totalCotisations: { type: 'number' },
              totalAmount: { type: 'string' },
              recentMembers: { type: 'array' },
            },
          },
          401: { type: 'object' },
        },
      },
    },
    async (request, reply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      app.logger.info({ userId: session.user.id }, 'Fetching admin dashboard stats');

      try {
        // Get member counts
        const totalMembersResult = await app.db.select({ count: countFn() }).from(schema.memberProfiles);
        const totalMembers = totalMembersResult[0]?.count ?? 0;

        const activeMembersResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'active'));
        const activeMembers = activeMembersResult[0]?.count ?? 0;

        const pendingMembersResult = await app.db
          .select({ count: countFn() })
          .from(schema.memberProfiles)
          .where(eq(schema.memberProfiles.status, 'pending'));
        const pendingMembers = pendingMembersResult[0]?.count ?? 0;

        // Get cotisation stats
        const cotisationsResult = await app.db.select({ count: countFn() }).from(schema.cotisations);
        const totalCotisations = cotisationsResult[0]?.count ?? 0;

        const completedCotisations = await app.db
          .select()
          .from(schema.cotisations)
          .where(eq(schema.cotisations.status, 'completed'));

        const totalAmount = completedCotisations
          .reduce((sum: number, c: any) => sum + parseFloat(c.amount), 0)
          .toFixed(2);

        // Get recent members (5 most recent)
        const recentMembersData = await app.db
          .select()
          .from(schema.memberProfiles)
          .orderBy(desc(schema.memberProfiles.createdAt))
          .limit(5);

        const recentMembers = recentMembersData.map((m: any) => ({
          id: m.id,
          fullName: m.fullName,
          status: m.status,
          joinedAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString(),
          membershipNumber: m.membershipNumber,
        }));

        app.logger.info({ totalMembers, activeMembers, totalCotisations }, 'Admin dashboard stats retrieved');

        return {
          totalMembers,
          activeMembers,
          pendingMembers,
          totalCotisations,
          totalAmount,
          recentMembers,
        };
      } catch (error) {
        app.logger.error({ err: error, userId: session.user.id }, 'Failed to fetch admin dashboard stats');
        throw error;
      }
    }
  );

}

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { streamText } from 'ai';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ChatBody {
  message: string;
  conversation_id?: string;
}

interface AnalyzeBody {
  text: string;
  type: 'sentiment' | 'summary' | 'keywords' | 'political';
}

export function register(app: App, fastify: FastifyInstance) {
  const requireAuth = app.requireAuth();

  // POST /api/ai/chat - AI chatbot with conversation history (authenticated)
  fastify.post<{ Body: ChatBody }>(
    '/api/ai/chat',
    {
      schema: {
        description: 'Chat with AI assistant about the party',
        tags: ['ai'],
        body: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            conversation_id: { type: 'string' },
          },
          required: ['message'],
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { message, conversation_id } = request.body;
      app.logger.info({ userId, message }, 'Processing AI chat request');

      try {
        // Get or create conversation
        let convId = conversation_id;
        let messages: any[] = [];

        if (convId) {
          const conv = await app.db
            .select()
            .from(schema.aiConversations)
            .where(eq(schema.aiConversations.id, convId));

          if (conv.length > 0 && conv[0].userId === userId) {
            messages = (conv[0].messages as any[]) || [];
          } else {
            app.logger.warn({ convId, userId }, 'Conversation not found or unauthorized');
            reply.status(404);
            return { error: 'Conversation not found' };
          }
        } else {
          const result = await app.db
            .insert(schema.aiConversations)
            .values({ userId, messages: [] as any[] })
            .returning();
          convId = result[0].id;
        }

        // Fetch party information to provide context
        const [leadership, program, events] = await Promise.all([
          app.db.select().from(schema.leadership),
          app.db.select().from(schema.politicalProgram),
          app.db.select().from(schema.events),
        ]);

        // Build system prompt with party information
        const systemPrompt = `Tu es l'assistant officiel de l'Alliance ARM, un parti politique malien. Tu aides les membres avec leurs questions sur le parti, ses programmes, son idéologie, et les actualités politiques du Mali. Réponds toujours en français de manière professionnelle et engagée.

INFORMATIONS DU PARTI:
- Nom: A.R.M (Alliance pour le Rassemblement Malien)
- Siège: Bamako Sebenikoro, Rue 530, Porte 245, Bamako Mali
- Devise: "Fraternité Liberté Égalité"

STRUCTURE DE DIRECTION:
${leadership.map(l => `- ${l.position}: ${l.name}${l.location ? ` (${l.location})` : ''}`).join('\n')}

PROGRAMME POLITIQUE (Catégories):
${Array.from(new Set(program.map(p => p.category)))
  .map(cat => {
    const items = program.filter(p => p.category === cat);
    return `${cat}:\n${items.map(i => `  - ${i.title}: ${i.description}`).join('\n')}`;
  })
  .join('\n\n')}

ÉVÉNEMENTS À VENIR:
${events.length > 0 ? events.map(e => `- ${e.title} le ${e.date?.toLocaleDateString('fr-FR')} à ${e.location}`).join('\n') : 'Aucun événement programmé'}

Sois utile, amical et fournir des informations exactes.`;

        // Convert messages to the format expected by streamText
        const messageHistory = messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        }));

        const result = streamText({
          model: gateway('openai/gpt-4o-mini'),
          system: systemPrompt,
          messages: [...messageHistory, { role: 'user', content: message }],
        });

        // Collect response text for storage
        let responseText = '';

        // Stream response as Server-Sent Events
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        });

        for await (const textPart of result.textStream) {
          responseText += textPart;
          reply.raw.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
        }

        // Save conversation history
        const updatedMessages = [
          ...messages,
          { role: 'user', content: message },
          { role: 'assistant', content: responseText },
        ];

        await app.db
          .update(schema.aiConversations)
          .set({ messages: updatedMessages, updatedAt: new Date() })
          .where(eq(schema.aiConversations.id, convId));

        // Send final message with conversation ID
        reply.raw.write(`data: ${JSON.stringify({ conversationId: convId, done: true })}\n\n`);
        reply.raw.end();

        app.logger.info({ userId, conversationId: convId }, 'AI chat response completed');
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to process AI chat request');
        reply.status(500).send({ error: 'Failed to generate response' });
      }
    }
  );

  // POST /api/ai/analyze - AI text analysis (authenticated)
  fastify.post<{ Body: AnalyzeBody }>(
    '/api/ai/analyze',
    {
      schema: {
        description: 'Analyze text with AI',
        tags: ['ai'],
        body: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            type: { type: 'string', enum: ['sentiment', 'summary', 'keywords', 'political'] },
          },
          required: ['text', 'type'],
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Body: AnalyzeBody }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { text, type } = request.body;
      app.logger.info({ userId, type }, 'Processing AI analysis request');

      try {
        let prompt = '';
        switch (type) {
          case 'sentiment':
            prompt = `Analyze the sentiment of this text and return ONLY a JSON object with: { sentiment: 'positive'|'negative'|'neutral', confidence: 0-100 }\n\nText: ${text}`;
            break;
          case 'summary':
            prompt = `Summarize this text in 2-3 sentences:\n\n${text}`;
            break;
          case 'keywords':
            prompt = `Extract the top 5 keywords from this text, return as JSON array: { keywords: [...] }\n\nText: ${text}`;
            break;
          case 'political':
            prompt = `Analyze this political text from the perspective of ARM (Alliance pour le Rassemblement Malien). Return analysis as JSON: { alignment: 'aligned'|'neutral'|'opposed', themes: [...], confidence: 0-100 }\n\nText: ${text}`;
            break;
        }

        const result = await streamText({
          model: gateway('openai/gpt-4o-mini'),
          system: 'You are a text analysis AI. Provide precise, structured analysis.',
          prompt,
        });

        let analysis = '';
        for await (const textPart of result.textStream) {
          analysis += textPart;
        }

        app.logger.info({ userId, type }, 'AI analysis completed');
        return { analysis, type };
      } catch (error) {
        app.logger.error({ err: error, userId, type }, 'Failed to process AI analysis');
        throw error;
      }
    }
  );

  // GET /api/ai/conversations - List user's AI conversations (authenticated)
  fastify.get(
    '/api/ai/conversations',
    {
      schema: {
        description: 'List user AI conversations',
        tags: ['ai'],
        response: {
          200: { type: 'array' },
          401: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      app.logger.info({ userId }, 'Fetching AI conversations');

      try {
        const conversations = await app.db
          .select()
          .from(schema.aiConversations)
          .where(eq(schema.aiConversations.userId, userId));

        app.logger.info({ userId, count: conversations.length }, 'AI conversations fetched');
        return conversations.map((conv) => ({
          id: conv.id,
          userId: conv.userId,
          messageCount: ((conv.messages as any[]) || []).length,
          createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : new Date(conv.createdAt).toISOString(),
          updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.toISOString() : new Date(conv.updatedAt).toISOString(),
        }));
      } catch (error) {
        app.logger.error({ err: error, userId }, 'Failed to fetch conversations');
        throw error;
      }
    }
  );

  // GET /api/ai/conversations/:id - Get specific AI conversation (authenticated, must own it)
  fastify.get<{ Params: { id: string } }>(
    '/api/ai/conversations/:id',
    {
      schema: {
        description: 'Get specific AI conversation with full history',
        tags: ['ai'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { type: 'object' },
          401: { type: 'object' },
          403: { type: 'object' },
          404: { type: 'object' },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const userId = session.user.id;
      const { id } = request.params;

      app.logger.info({ userId, conversationId: id }, 'Fetching AI conversation');

      try {
        const conversations = await app.db
          .select()
          .from(schema.aiConversations)
          .where(eq(schema.aiConversations.id, id));

        if (conversations.length === 0) {
          app.logger.warn({ conversationId: id }, 'Conversation not found');
          reply.status(404);
          return { error: 'Conversation not found' };
        }

        const conv = conversations[0];
        if (conv.userId !== userId) {
          app.logger.warn({ conversationId: id, userId }, 'Unauthorized access');
          reply.status(403);
          return { error: 'Forbidden' };
        }

        app.logger.info({ conversationId: id }, 'AI conversation fetched');
        return {
          id: conv.id,
          userId: conv.userId,
          messages: conv.messages || [],
          createdAt: conv.createdAt instanceof Date ? conv.createdAt.toISOString() : new Date(conv.createdAt).toISOString(),
          updatedAt: conv.updatedAt instanceof Date ? conv.updatedAt.toISOString() : new Date(conv.updatedAt).toISOString(),
        };
      } catch (error) {
        app.logger.error({ err: error, userId, conversationId: id }, 'Failed to fetch conversation');
        throw error;
      }
    }
  );
}

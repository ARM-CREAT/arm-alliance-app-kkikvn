import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { gateway } from '@specific-dev/framework';
import { streamText } from 'ai';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

interface ChatBody {
  message: string;
  context?: string;
}

export function register(app: App, fastify: FastifyInstance) {
  // POST /api/ai/chat - AI chatbot
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
            context: { type: 'string' },
          },
          required: ['message'],
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatBody }>, reply: FastifyReply): Promise<void> => {
      const { message, context } = request.body;
      app.logger.info({ message }, 'Processing AI chat request');

      try {
        // Fetch party information to provide context
        const [leadership, program, events] = await Promise.all([
          app.db.select().from(schema.leadership),
          app.db.select().from(schema.politicalProgram),
          app.db.select().from(schema.events),
        ]);

        // Build system prompt with party information
        const systemPrompt = `You are an AI assistant for A.R.M (Alliance pour le Rassemblement Malien), a political party in Mali.

PARTY INFORMATION:
- Name: A.R.M (Alliance pour le Rassemblement Malien)
- Headquarters: Bamako Sebenikoro, Rue 530, Porte 245, Bamako Mali
- Motto: "Fraternité Liberté Égalité" (Fraternity, Liberty, Equality)

LEADERSHIP STRUCTURE:
${leadership.map(l => `- ${l.position}: ${l.name}${l.location ? ` (${l.location})` : ''}`).join('\n')}

POLITICAL PROGRAM (Categories):
${Array.from(new Set(program.map(p => p.category)))
  .map(cat => {
    const items = program.filter(p => p.category === cat);
    return `${cat}:\n${items.map(i => `  - ${i.title}: ${i.description}`).join('\n')}`;
  })
  .join('\n\n')}

UPCOMING EVENTS:
${events.length > 0 ? events.map(e => `- ${e.title} on ${e.date?.toLocaleDateString()} at ${e.location}`).join('\n') : 'No upcoming events scheduled'}

Answer questions about the party, its leadership, program, and events. Be helpful, friendly, and provide accurate information.
${context ? `\n\nAdditional context: ${context}` : ''}`;

        const result = streamText({
          model: gateway('openai/gpt-5-mini'),
          system: systemPrompt,
          prompt: message,
        });

        // Stream response as Server-Sent Events
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        });

        for await (const textPart of result.textStream) {
          reply.raw.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
        }

        reply.raw.end();
        app.logger.info({ message }, 'AI chat response completed');
      } catch (error) {
        app.logger.error(
          { err: error, message },
          'Failed to process AI chat request'
        );
        reply.status(500).send({ error: 'Failed to generate response' });
      }
    }
  );
}

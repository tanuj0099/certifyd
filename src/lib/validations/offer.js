import { z } from 'zod';

export const GroqRequestSchema = z.object({
  model: z.enum([
    'llama3-8b-8192',
    'llama3-70b-8192',
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
  ]).optional().default('llama-3.3-70b-versatile'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(60000),
  })).min(1).max(20),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(8192).optional(),
  response_format: z.object({ type: z.string() }).optional(),
});

export function validateGroqRequest(body) {
  return GroqRequestSchema.safeParse(body);
}

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    coverImage: z.string(),
    coverAlt: z.string(),
    coverWidth: z.number().int().positive(),
    coverHeight: z.number().int().positive(),
    socialImage: z.string().optional(),
    socialImageAlt: z.string().optional(),
    socialImageWidth: z.number().int().positive().optional(),
    socialImageHeight: z.number().int().positive().optional(),
  }),
});

export const collections = { blog };

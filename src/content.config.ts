import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { modelSchema } from './data/schema';

const models = defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './data/models' }), schema: modelSchema });
export const collections = { models };

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { coreModelSchema } from './data/schema';

const models = defineCollection({ loader: glob({ pattern: '**/*.yaml', base: './data/models' }), schema: coreModelSchema });
export const collections = { models };

import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { SeoConfig } from '../../domain/value-objects/SeoConfig';

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  description: text('description').default(''),
  seoConfig: jsonb('seo_config').$type<SeoConfig>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('PENDING'),
  totalUrls: integer('total_urls').notNull().default(0),
  processedUrls: integer('processed_urls').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

export const jobUrls = pgTable('job_urls', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  status: text('status').notNull().default('PENDING'),
  originalTitle: text('original_title'),
  originalH1: text('original_h1'),
  generatedTitle: text('generated_title'),
  titleLength: integer('title_length'),
  generatedDescription: text('generated_description'),
  descriptionLength: integer('description_length'),
  attempts: integer('attempts').notNull().default(0),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

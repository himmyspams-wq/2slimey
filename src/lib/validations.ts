import { z } from 'zod';
import { ALLOWED_BRANDS } from './brands';

const BRAND_ERROR = 'Only premium top-tier fishing reel brands are allowed on this marketplace.';

export const createListingSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  brand: z.enum(ALLOWED_BRANDS, {
    errorMap: () => ({ message: BRAND_ERROR }),
  }),
  model: z
    .string()
    .min(1, 'Model is required')
    .max(100, 'Model must be at most 100 characters'),
  condition: z
    .number()
    .int('Condition must be a whole number')
    .min(1, 'Condition must be at least 1')
    .max(10, 'Condition must be at most 10'),
  conditionDescription: z
    .string()
    .max(500, 'Condition description must be at most 500 characters')
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(100000, 'Price must be at most $100,000'),
  location: z
    .string()
    .min(1, 'Location is required')
    .max(100, 'Location must be at most 100 characters'),
  shippingAvailable: z.boolean(),
  shippingCost: z
    .number()
    .min(0, 'Shipping cost cannot be negative')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  imageKeys: z.array(z.string()).max(8, 'Maximum 8 images allowed').optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const reportListingSchema = z.object({
  reason: z.enum(['SPAM', 'COUNTERFEIT', 'WRONG_BRAND', 'MISLEADING', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a valid reason' }),
  }),
  details: z
    .string()
    .max(500, 'Details must be at most 500 characters')
    .optional(),
});

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be at most 2000 characters'),
  listingId: z.string().cuid('Invalid listing ID'),
  recipientId: z.string().cuid('Invalid recipient ID'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  location: z
    .string()
    .max(100, 'Location must be at most 100 characters')
    .optional(),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional(),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ReportListingInput = z.infer<typeof reportListingSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

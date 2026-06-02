import { z } from "zod";

export const spaceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  area: z.string().min(2, "Area is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  nightly_price: z.number().positive("Price must be a positive number"),
  max_guests: z.number().int().positive().max(50, "Max guests cannot exceed 50"),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  featured_image: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  active: z.boolean(),
  amenities: z.array(z.string()).default([]),
  rules: z.string().optional()
});

export type SpaceInput = z.infer<typeof spaceSchema>;

import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  description: z.string().trim().optional(),
  /** API requires integer level >= 1 (role hierarchy). */
  level: z.coerce.number().int('Level must be a whole number').min(1, 'Level must be at least 1'),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

export const permissionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().min(1, 'Slug is required'),
  module: z.string().trim().min(1, 'Module is required'),
  description: z.string().trim().optional(),
});

export type PermissionFormValues = z.infer<typeof permissionSchema>;

export const userCreateSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional(),
  roleIds: z.array(z.string().min(1)).optional(),
});

export type UserCreateValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  fullName: z.string().trim().optional(),
  email: z.string().trim().email('Enter a valid email').optional(),
  phone: z.string().trim().optional(),
});

export type UserUpdateValues = z.infer<typeof userUpdateSchema>;

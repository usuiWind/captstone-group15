import { z } from 'zod'

// Registration validation schema
export const registerSchema = z.object({
  token: z.string().uuid('Invalid token format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
           'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)')
})

// Attendance creation validation schema
export const createAttendanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  date: z.string().datetime('Invalid date format'),
  eventName: z.string().max(200, 'Event name too long').optional(),
  points: z.number().int('Points must be an integer').min(0, 'Points must be non-negative').max(100, 'Points too high')
})

// Staff creation/update validation schema
export const staffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.string().min(1, 'Role is required').max(100, 'Role too long'),
  bio: z.string().max(1000, 'Bio too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  order: z.number().int('Order must be an integer').min(0, 'Order must be non-negative'),
  isActive: z.boolean('isActive must be a boolean')
})

// Sponsor creation/update validation schema
export const sponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  tier: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'], {
    errorMap: () => ({ message: 'Tier must be PLATINUM, GOLD, SILVER, or BRONZE' })
  }),
  order: z.number().int('Order must be an integer').min(0, 'Order must be non-negative'),
  isActive: z.boolean('isActive must be a boolean'),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional()
})

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new Error(firstError.message)
    }
    throw new Error('Validation failed')
  }
}

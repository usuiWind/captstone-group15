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
  isActive: z.boolean({ error: 'isActive must be a boolean' })
})

// Sponsor creation/update validation schema
export const sponsorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  websiteUrl: z.string().url('Invalid website URL').optional(),
  tier: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'], {
    error: 'Tier must be PLATINUM, GOLD, SILVER, or BRONZE'
  }),
  order: z.number().int('Order must be an integer').min(0, 'Order must be non-negative'),
  isActive: z.boolean({ error: 'isActive must be a boolean' }),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional()
})

// Admin attendance update validation schema
export const updateAttendanceSchema = z.object({
  id: z.string().uuid('Invalid attendance ID'),
  points: z.number().int('Points must be an integer').min(0).max(100).optional(),
  eventName: z.string().max(200, 'Event name too long').optional(),
  date: z.string().datetime('Invalid date format').optional(),
})

// Google/Microsoft Forms webhook payload schema
export const formsWebhookSchema = z.object({
  email: z.string().email('Invalid email'),
  event_name: z.string().max(200, 'Event name too long').optional(),
  event_date: z.string().datetime('Invalid date format').refine(
    (d) => {
      const date = new Date(d)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return date <= now && date >= thirtyDaysAgo
    },
    'Date must be within the past 30 days and not in the future'
  ),
  points: z.number().int('Points must be an integer').min(1).max(100).optional(),
})

// Event creation validation schema
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  eventDate: z.string().datetime('Invalid date format'),
  pointsValue: z.number().int('Points must be an integer').min(0).max(100),
})

// Event update validation schema
export const updateEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  eventDate: z.string().datetime('Invalid date format').optional(),
  pointsValue: z.number().int('Points must be an integer').min(0).max(100).optional(),
})

// Admin member update/revoke validation schema
export const updateMemberSchema = z.object({
  id: z.string().uuid('Invalid member ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.enum(['MEMBER', 'ADMIN'], { error: 'Role must be MEMBER or ADMIN' }).optional(),
  revokeAccess: z.boolean().optional(),
})

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw new Error(firstError?.message ?? 'Validation failed')
    }
    throw new Error('Validation failed')
  }
}

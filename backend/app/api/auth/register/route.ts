import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/userService'
import { authRateLimit, getClientIdentifier } from '@/lib/rateLimit'
import { validateRequest, registerSchema } from '@/lib/validation'
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security'

const userService = new UserService()

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = authRateLimit(clientId)
    
    if (!rateLimitResult.allowed) {
      const response = createSecureErrorResponse(
        'Too many registration attempts. Please try again later.',
        429
      )
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime?.toString() || '')
      return response
    }
    const body = await request.json()
    
    // Validate request body with Zod schema
    const validatedData = validateRequest(registerSchema, body) as {
      token: string
      name: string
      password: string
    }
    const { token, name, password } = validatedData

    const user = await userService.registerUser(token, name, password)

    return createSecureResponse({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    // Don't expose detailed error messages to prevent information disclosure
    return createSecureErrorResponse('Registration failed', 400)
  }
}

import { NextRequest } from 'next/server'
import { StaffService } from '@/lib/services/staffService'
import { createSecureResponse, createSecureErrorResponse } from '@/lib/security'

const staffService = new StaffService()

export async function GET(request: NextRequest) {
  try {
    const staff = await staffService.getActiveStaff()
    return createSecureResponse({ success: true, data: staff })
  } catch (error: any) {
    console.error('Get staff error:', error)
    return createSecureErrorResponse('Failed to get staff', 500)
  }
}
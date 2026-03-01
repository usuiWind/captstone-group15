export interface User {
  id: string
  email: string
  name?: string
  passwordHash?: string
  role: 'MEMBER' | 'ADMIN'
  createdAt: Date
}

export interface Membership {
  id: string
  userId: string
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  planName: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Attendance {
  id: string
  userId: string
  date: Date
  points: number
  eventName?: string
  createdAt: Date
}

export interface StaffMember {
  id: string
  name: string
  role: string
  bio?: string
  imageUrl?: string
  email?: string
  order: number
  isActive: boolean
  createdAt: Date
}

export interface Sponsor {
  id: string
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'
  order: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
}

export interface VerificationToken {
  identifier: string
  token: string
  expires: Date
}

// Input types for creation
export interface CreateUserInput {
  email: string
  name?: string
  passwordHash?: string
  role: 'MEMBER' | 'ADMIN'
}

export interface CreateMembershipInput {
  userId: string
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
  planName: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}

export interface CreateAttendanceInput {
  userId: string
  date: Date
  points: number
  eventName?: string
}

export interface CreateStaffInput {
  name: string
  role: string
  bio?: string
  imageUrl?: string
  email?: string
  order: number
  isActive: boolean
}

export interface CreateSponsorInput {
  name: string
  logoUrl: string
  websiteUrl?: string
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'
  order: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
}

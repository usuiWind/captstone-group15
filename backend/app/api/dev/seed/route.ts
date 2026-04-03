import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { repositories } from '@/lib/container'

// Only works outside production. Returns 404 in production.
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@test.com'
  const memberEmail = process.env.SEED_MEMBER_EMAIL || 'member@test.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!'
  const memberPassword = process.env.SEED_MEMBER_PASSWORD || 'Member1234!'

  // -- Admin user --
  let admin = await repositories.user.findByEmail(adminEmail)
  if (!admin) {
    admin = await repositories.user.create({ email: adminEmail, name: 'Test Admin', role: 'ADMIN' })
  }
  await repositories.user.setPassword(admin.id, adminPassword)

  // -- Member user --
  let member = await repositories.user.findByEmail(memberEmail)
  if (!member) {
    member = await repositories.user.create({ email: memberEmail, name: 'Test Member', role: 'MEMBER' })
  }
  await repositories.user.setPassword(member.id, memberPassword)

  // -- Membership for the member (idempotent) --
  let membership = await repositories.membership.findByUserId(member.id)
  if (!membership) {
    const now = new Date()
    const nextMonth = new Date(now)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    membership = await repositories.membership.create({
      userId: member.id,
      status: 'ACTIVE',
      planName: 'Monthly',
      stripeCustomerId: 'cus_dev_test',
      stripeSubscriptionId: 'sub_dev_test',
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      cancelAtPeriodEnd: false,
    })
  }

  // -- Two attendance records for the member --
  const existingAttendance = await repositories.attendance.findByUserId(member.id)
  if (existingAttendance.length === 0) {
    await repositories.attendance.create({
      userId: member.id,
      date: new Date('2026-03-01'),
      eventName: 'Weekly Meeting',
      points: 10,
    })
    await repositories.attendance.create({
      userId: member.id,
      date: new Date('2026-03-08'),
      eventName: 'Workshop',
      points: 20,
    })
  }

  return NextResponse.json({
    success: true,
    accounts: [
      { email: adminEmail, role: 'ADMIN' },
      { email: memberEmail, role: 'MEMBER' },
    ],
    note: 'Data is in-memory and resets on server restart. Credentials are defined in the seed file.',
  })
}

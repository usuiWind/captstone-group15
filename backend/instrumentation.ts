export async function register() {
  if (process.env.NODE_ENV !== 'development') return
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { repositories } = await import('./lib/container')
  const bcrypt = await import('bcryptjs')

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@test.com'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!'
  const memberEmail = process.env.SEED_MEMBER_EMAIL ?? 'member@test.com'
  const memberPassword = process.env.SEED_MEMBER_PASSWORD ?? 'Member1234!'

  const adminHash = await bcrypt.hash(adminPassword, 12)
  const memberHash = await bcrypt.hash(memberPassword, 12)

  let admin = await repositories.user.findByEmail(adminEmail)
  if (!admin) {
    admin = await repositories.user.create({ email: adminEmail, name: 'Test Admin', role: 'ADMIN', passwordHash: adminHash })
  } else {
    await repositories.user.setPassword(admin.id, adminPassword)
  }

  let member = await repositories.user.findByEmail(memberEmail)
  if (!member) {
    member = await repositories.user.create({ email: memberEmail, name: 'Test Member', role: 'MEMBER', passwordHash: memberHash })
  } else {
    await repositories.user.setPassword(member.id, memberPassword)
  }

  console.log('[DEV] Seed complete — admin@test.com / Admin1234! ready')
}

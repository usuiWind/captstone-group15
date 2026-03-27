import { supabaseAdmin } from '../../supabase'
import { Membership, CreateMembershipInput } from '../../interfaces/models'
import { IMembershipRepository } from '../../interfaces/repositories'

// Maps schema status values ('active') to interface status values ('ACTIVE')
function mapStatus(s: string): Membership['status'] {
  const map: Record<string, Membership['status']> = {
    active: 'ACTIVE',
    pending: 'PENDING',
    past_due: 'PAST_DUE',
    cancelled: 'CANCELLED',
    expired: 'EXPIRED',
  }
  return map[s?.toLowerCase()] ?? 'PENDING'
}

function mapRow(row: any): Membership {
  return {
    id: String(row.id),
    userId: row.user_id,
    status: mapStatus(row.status),
    planName: row.membership_types?.name ?? 'Standard',
    stripeCustomerId: row.stripe_customer_id ?? '',
    stripeSubscriptionId: row.stripe_payment_id ?? '',
    currentPeriodStart: new Date(row.start_date),
    currentPeriodEnd: new Date(row.end_date),
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at ?? row.created_at),
  }
}

const SELECT = `
  *,
  membership_types ( name, price, duration_months )
`

export const membershipRepositorySupabase: IMembershipRepository = {
  findAll: async (): Promise<Membership[]> => {
    const { data, error } = await supabaseAdmin
      .from('memberships')
      .select(SELECT)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data.map(mapRow)
  },

  findByUserId: async (userId: string): Promise<Membership | null> => {
    const { data, error } = await supabaseAdmin
      .from('memberships')
      .select(SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  findByStripeCustomerId: async (stripeCustomerId: string): Promise<Membership | null> => {
    const { data, error } = await supabaseAdmin
      .from('memberships')
      .select(SELECT)
      .eq('stripe_customer_id', stripeCustomerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  findByStripeSubscriptionId: async (stripeSubscriptionId: string): Promise<Membership | null> => {
    const { data, error } = await supabaseAdmin
      .from('memberships')
      .select(SELECT)
      .eq('stripe_payment_id', stripeSubscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !data) return null
    return mapRow(data)
  },

  create: async (data: CreateMembershipInput): Promise<Membership> => {
    // Resolve membership_type_id from planName if available
    const { data: typeRow } = await supabaseAdmin
      .from('membership_types')
      .select('id')
      .ilike('name', data.planName)
      .single()

    const { data: row, error } = await supabaseAdmin
      .from('memberships')
      .insert({
        user_id: data.userId,
        membership_type_id: typeRow?.id ?? null,
        start_date: data.currentPeriodStart.toISOString().split('T')[0],
        end_date: data.currentPeriodEnd.toISOString().split('T')[0],
        status: data.status.toLowerCase(),
        stripe_payment_id: data.stripeSubscriptionId || null,
        stripe_customer_id: data.stripeCustomerId || null,
      })
      .select(SELECT)
      .single()

    if (error || !row) throw new Error(`Failed to create membership: ${error?.message}`)
    return mapRow(row)
  },

  update: async (id: string, data: Partial<Membership>): Promise<Membership> => {
    const patch: Record<string, any> = {}
    if (data.status !== undefined) patch.status = data.status.toLowerCase()
    if (data.currentPeriodStart !== undefined) patch.start_date = data.currentPeriodStart.toISOString().split('T')[0]
    if (data.currentPeriodEnd !== undefined) patch.end_date = data.currentPeriodEnd.toISOString().split('T')[0]
    if (data.stripeSubscriptionId !== undefined) patch.stripe_payment_id = data.stripeSubscriptionId
    if (data.stripeCustomerId !== undefined) patch.stripe_customer_id = data.stripeCustomerId
    if (data.cancelAtPeriodEnd !== undefined) patch.cancel_at_period_end = data.cancelAtPeriodEnd

    const { data: row, error } = await supabaseAdmin
      .from('memberships')
      .update(patch)
      .eq('id', parseInt(id, 10))
      .select(SELECT)
      .single()

    if (error || !row) throw new Error(`Failed to update membership: ${error?.message}`)
    return mapRow(row)
  },

  delete: async (id: string): Promise<void> => {
    await supabaseAdmin.from('memberships').delete().eq('id', parseInt(id, 10))
  },
}

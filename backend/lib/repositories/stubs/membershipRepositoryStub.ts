import { Membership, CreateMembershipInput } from '../../interfaces/models'
import { IMembershipRepository } from '../../interfaces/repositories'

const memberships = new Map<string, Membership>()

export const membershipRepositoryStub: IMembershipRepository = {
  findByUserId: async (userId: string): Promise<Membership | null> => {
    return [...memberships.values()].find(m => m.userId === userId) ?? null
  },

  findByStripeCustomerId: async (id: string): Promise<Membership | null> => {
    return [...memberships.values()].find(m => m.stripeCustomerId === id) ?? null
  },

  findByStripeSubscriptionId: async (id: string): Promise<Membership | null> => {
    return [...memberships.values()].find(m => m.stripeSubscriptionId === id) ?? null
  },

  create: async (data: CreateMembershipInput): Promise<Membership> => {
    const membership: Membership = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    memberships.set(membership.id, membership)
    return membership
  },

  update: async (id: string, data: Partial<Membership>): Promise<Membership> => {
    const existingMembership = memberships.get(id)
    if (!existingMembership) {
      throw new Error(`Membership with id ${id} not found`)
    }
    const updatedMembership = { 
      ...existingMembership, 
      ...data, 
      updatedAt: new Date() 
    }
    memberships.set(id, updatedMembership)
    return updatedMembership
  },

  delete: async (id: string): Promise<void> => {
    memberships.delete(id)
  }
}

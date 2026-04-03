import { Sponsor, CreateSponsorInput } from '../../interfaces/models'
import { ISponsorRepository } from '../../interfaces/repositories'

const sponsors = new Map<string, Sponsor>()

export const sponsorRepositoryStub: ISponsorRepository = {
  findAllActive: async (): Promise<Sponsor[]> => {
    const now = new Date()
    return [...sponsors.values()]
      .filter(s => {
        if (!s.isActive) return false
        if (s.endDate && s.endDate < now) return false
        return true
      })
      .sort((a, b) => a.order - b.order)
  },

  findById: async (id: string): Promise<Sponsor | null> => {
    return sponsors.get(id) ?? null
  },

  create: async (data: CreateSponsorInput): Promise<Sponsor> => {
    const sponsor: Sponsor = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    sponsors.set(sponsor.id, sponsor)
    return sponsor
  },

  update: async (id: string, data: Partial<Sponsor>): Promise<Sponsor> => {
    const existingSponsor = sponsors.get(id)
    if (!existingSponsor) {
      throw new Error(`Sponsor with id ${id} not found`)
    }
    const updatedSponsor = { ...existingSponsor, ...data }
    sponsors.set(id, updatedSponsor)
    return updatedSponsor
  },

  softDelete: async (id: string): Promise<void> => {
    const existingSponsor = sponsors.get(id)
    if (existingSponsor) {
      const updatedSponsor = { ...existingSponsor, isActive: false }
      sponsors.set(id, updatedSponsor)
    }
  }
}

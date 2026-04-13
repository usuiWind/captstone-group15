import { ClubEvent, CreateEventInput } from '../../interfaces/models'
import { IEventRepository } from '../../interfaces/repositories'

const events = new Map<string, ClubEvent>()

export const eventRepositoryStub: IEventRepository = {
  findAll: async (): Promise<ClubEvent[]> => {
    return [...events.values()].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
  },

  findUpcoming: async (): Promise<ClubEvent[]> => {
    const now = new Date()
    return [...events.values()]
      .filter(e => e.eventDate >= now)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
  },

  findById: async (id: string): Promise<ClubEvent | null> => {
    return events.get(id) ?? null
  },

  create: async (data: CreateEventInput): Promise<ClubEvent> => {
    const event: ClubEvent = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    }
    events.set(event.id, event)
    return event
  },

  update: async (id: string, data: Partial<Pick<ClubEvent, 'title' | 'description' | 'eventDate' | 'pointsValue'>>): Promise<ClubEvent> => {
    const existing = events.get(id)
    if (!existing) throw new Error(`Event ${id} not found`)
    const updated = { ...existing, ...data }
    events.set(id, updated)
    return updated
  },

  delete: async (id: string): Promise<void> => {
    events.delete(id)
  },
}

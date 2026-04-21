import { StaffMember, CreateStaffInput } from '../../interfaces/models'
import { IStaffRepository } from '../../interfaces/repositories'

const staffMembers = new Map<string, StaffMember>()

export const staffRepositoryStub: IStaffRepository = {
  findAllActive: async (): Promise<StaffMember[]> => {
    return [...staffMembers.values()]
      .filter(s => s.isActive)
      .sort((a, b) => a.order - b.order)
  },

  findById: async (id: string): Promise<StaffMember | null> => {
    return staffMembers.get(id) ?? null
  },

  create: async (data: CreateStaffInput): Promise<StaffMember> => {
    const staffMember: StaffMember = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    staffMembers.set(staffMember.id, staffMember)
    return staffMember
  },

  update: async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    const existingStaff = staffMembers.get(id)
    if (!existingStaff) {
      throw new Error(`Staff member with id ${id} not found`)
    }
    const updatedStaff = { ...existingStaff, ...data }
    staffMembers.set(id, updatedStaff)
    return updatedStaff
  },

  softDelete: async (id: string): Promise<void> => {
    const existingStaff = staffMembers.get(id)
    if (existingStaff) {
      const updatedStaff = { ...existingStaff, isActive: false }
      staffMembers.set(id, updatedStaff)
    }
  }
}

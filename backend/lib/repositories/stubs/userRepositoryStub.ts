import { User, CreateUserInput } from '../../interfaces/models'
import { IUserRepository } from '../../interfaces/repositories'

const users = new Map<string, User>()

export const userRepositoryStub: IUserRepository = {
  findByEmail: async (email: string): Promise<User | null> => {
    return [...users.values()].find(u => u.email === email) ?? null
  },

  findById: async (id: string): Promise<User | null> => {
    return users.get(id) ?? null
  },

  create: async (data: CreateUserInput): Promise<User> => {
    const user: User = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date()
    }
    users.set(user.id, user)
    return user
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const existingUser = users.get(id)
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`)
    }
    const updatedUser = { ...existingUser, ...data }
    users.set(id, updatedUser)
    return updatedUser
  },

  delete: async (id: string): Promise<void> => {
    users.delete(id)
  }
}

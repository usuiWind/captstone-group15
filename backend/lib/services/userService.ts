import bcrypt from 'bcryptjs'
import { User, CreateUserInput } from '../interfaces/models'
import { repositories } from '../container'
import { createCustomer } from '../stripe'
import { emailService } from '../email'

export class UserService {
  async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await repositories.user.findByEmail(email)
    
    if (!user || !user.passwordHash) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isPasswordValid) {
      return null
    }

    return user
  }

  async createFromStripeCheckout(session: any): Promise<User> {
    const email = session.customer_details?.email
    const name = session.customer_details?.name

    if (!email) {
      throw new Error('No email found in Stripe session')
    }

    // Check if user already exists
    let user = await repositories.user.findByEmail(email)
    
    if (!user) {
      // Create Stripe customer
      const customer = await createCustomer(email, name)
      
      // Create user without password initially
      const createUserInput: CreateUserInput = {
        email,
        name: name || undefined,
        role: 'MEMBER'
      }
      
      user = await repositories.user.create(createUserInput)
    }

    return user
  }

  async registerUser(token: string, name: string, password: string): Promise<User> {
    // Validate token
    const verificationToken = await repositories.verificationToken.findByToken(token)
    
    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new Error('Invalid or expired token')
    }

    // Get user by email
    const user = await repositories.user.findByEmail(verificationToken.identifier)
    
    if (!user) {
      throw new Error('User not found')
    }

    if (user.passwordHash) {
      throw new Error('User already registered')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update user with password and name
    const updatedUser = await repositories.user.update(user.id, {
      name,
      passwordHash
    })

    // Delete used token
    await repositories.verificationToken.delete(token)

    return updatedUser
  }

  async getUserById(id: string): Promise<User | null> {
    return await repositories.user.findById(id)
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await repositories.user.update(id, data)
  }

  async getAllUsers(): Promise<User[]> {
    // This would need to be implemented in the repository
    // For now, return empty array
    return []
  }
}

import { User, Membership, Attendance, ClubEvent, StaffMember, Sponsor, VerificationToken, AdminOtpCode, CreateAdminOtpInput, CreateUserInput, CreateMembershipInput, CreateAttendanceInput, CreateEventInput, CreateStaffInput, CreateSponsorInput } from './models'

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  findAll(): Promise<User[]>
  create(data: CreateUserInput): Promise<User>
  update(id: string, data: Partial<User>): Promise<User>
  setPassword(id: string, plainPassword: string): Promise<void>
  delete(id: string): Promise<void>
}

export interface IMembershipRepository {
  findAll(): Promise<Membership[]>
  findByUserId(userId: string): Promise<Membership | null>
  findByStripeCustomerId(id: string): Promise<Membership | null>
  findByStripeSubscriptionId(id: string): Promise<Membership | null>
  create(data: CreateMembershipInput): Promise<Membership>
  update(id: string, data: Partial<Membership>): Promise<Membership>
  delete(id: string): Promise<void>
}

export interface IAttendanceRepository {
  findByUserId(userId: string): Promise<Attendance[]>
  getTotalPoints(userId: string): Promise<number>
  create(data: CreateAttendanceInput): Promise<Attendance>
  update(id: string, data: Partial<Pick<Attendance, 'points' | 'eventName' | 'date'>>): Promise<Attendance>
  delete(id: string): Promise<void>
}

export interface IEventRepository {
  findAll(): Promise<ClubEvent[]>
  findUpcoming(): Promise<ClubEvent[]>
  findById(id: string): Promise<ClubEvent | null>
  create(data: CreateEventInput): Promise<ClubEvent>
  update(id: string, data: Partial<Pick<ClubEvent, 'title' | 'description' | 'eventDate' | 'pointsValue'>>): Promise<ClubEvent>
  delete(id: string): Promise<void>
}

export interface IStaffRepository {
  findAllActive(): Promise<StaffMember[]>
  findById(id: string): Promise<StaffMember | null>
  create(data: CreateStaffInput): Promise<StaffMember>
  update(id: string, data: Partial<StaffMember>): Promise<StaffMember>
  softDelete(id: string): Promise<void>
}

export interface ISponsorRepository {
  findAllActive(): Promise<Sponsor[]>
  findById(id: string): Promise<Sponsor | null>
  create(data: CreateSponsorInput): Promise<Sponsor>
  update(id: string, data: Partial<Sponsor>): Promise<Sponsor>
  softDelete(id: string): Promise<void>
}

export interface IVerificationTokenRepository {
  create(data: VerificationToken): Promise<VerificationToken>
  findByToken(token: string): Promise<VerificationToken | null>
  delete(token: string): Promise<void>
  deleteExpired(): Promise<void>
}

export interface IAdminOtpRepository {
  create(data: CreateAdminOtpInput): Promise<AdminOtpCode>
  findLatestForUser(userId: string): Promise<AdminOtpCode | null>
  markUsed(id: string): Promise<void>
  deleteExpiredForUser(userId: string): Promise<void>
}

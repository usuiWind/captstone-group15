import { 
  IUserRepository, 
  IMembershipRepository, 
  IAttendanceRepository, 
  IStaffRepository, 
  ISponsorRepository, 
  IVerificationTokenRepository 
} from './interfaces/repositories'

import {
  userRepositoryStub,
  membershipRepositoryStub,
  attendanceRepositoryStub,
  staffRepositoryStub,
  sponsorRepositoryStub,
  verificationTokenRepositoryStub
} from './repositories/stubs'

// Dependency injection container
// Swap these imports to change database implementation
export const repositories = {
  user: userRepositoryStub as IUserRepository,
  membership: membershipRepositoryStub as IMembershipRepository,
  attendance: attendanceRepositoryStub as IAttendanceRepository,
  staff: staffRepositoryStub as IStaffRepository,
  sponsor: sponsorRepositoryStub as ISponsorRepository,
  verificationToken: verificationTokenRepositoryStub as IVerificationTokenRepository,
}

// Example of how to swap to a real database later:
// import { userRepositoryPostgres } from './repositories/postgres/userRepository'
// import { membershipRepositoryPostgres } from './repositories/postgres/membershipRepository'
// ... etc

// export const repositories = {
//   user: userRepositoryPostgres,
//   membership: membershipRepositoryPostgres,
//   attendance: attendanceRepositoryPostgres,
//   staff: staffRepositoryPostgres,
//   sponsor: sponsorRepositoryPostgres,
//   verificationToken: verificationTokenRepositoryPostgres,
// }

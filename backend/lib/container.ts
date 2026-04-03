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

// Swap to Supabase repositories when SUPABASE_URL is configured.
// Staff and sponsor repositories stay as stubs (data is hardcoded in the frontend).
function buildRepositories() {
  if (process.env.SUPABASE_URL) {
    const {
      userRepositorySupabase,
      membershipRepositorySupabase,
      attendanceRepositorySupabase,
      verificationTokenRepositorySupabase,
    } = require('./repositories/supabase')

    return {
      user: userRepositorySupabase as IUserRepository,
      membership: membershipRepositorySupabase as IMembershipRepository,
      attendance: attendanceRepositorySupabase as IAttendanceRepository,
      staff: staffRepositoryStub as IStaffRepository,
      sponsor: sponsorRepositoryStub as ISponsorRepository,
      verificationToken: verificationTokenRepositorySupabase as IVerificationTokenRepository,
    }
  }

  // Default: in-memory stubs (no database needed for local dev)
  return {
    user: userRepositoryStub as IUserRepository,
    membership: membershipRepositoryStub as IMembershipRepository,
    attendance: attendanceRepositoryStub as IAttendanceRepository,
    staff: staffRepositoryStub as IStaffRepository,
    sponsor: sponsorRepositoryStub as ISponsorRepository,
    verificationToken: verificationTokenRepositoryStub as IVerificationTokenRepository,
  }
}

export const repositories = buildRepositories()

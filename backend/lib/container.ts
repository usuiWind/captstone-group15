import {
  IUserRepository,
  IMembershipRepository,
  IAttendanceRepository,
  IStaffRepository,
  ISponsorRepository,
  IVerificationTokenRepository,
  IMfaCodeRepository,
} from './interfaces/repositories'

import {
  userRepositoryStub,
  membershipRepositoryStub,
  attendanceRepositoryStub,
  staffRepositoryStub,
  sponsorRepositoryStub,
  verificationTokenRepositoryStub,
  mfaCodeRepositoryStub,
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
      mfaCodeRepositorySupabase,
    } = require('./repositories/supabase')

    return {
      user: userRepositorySupabase as IUserRepository,
      membership: membershipRepositorySupabase as IMembershipRepository,
      attendance: attendanceRepositorySupabase as IAttendanceRepository,
      staff: staffRepositoryStub as IStaffRepository,
      sponsor: sponsorRepositoryStub as ISponsorRepository,
      verificationToken: verificationTokenRepositorySupabase as IVerificationTokenRepository,
      mfaCode: mfaCodeRepositorySupabase as IMfaCodeRepository,
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
    mfaCode: mfaCodeRepositoryStub as IMfaCodeRepository,
  }
}

export const repositories = buildRepositories()

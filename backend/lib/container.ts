import {
  IUserRepository,
  IMembershipRepository,
  IAttendanceRepository,
  IEventRepository,
  IStaffRepository,
  ISponsorRepository,
  IVerificationTokenRepository,
  IAdminOtpRepository,
} from './interfaces/repositories'

import {
  userRepositoryStub,
  membershipRepositoryStub,
  attendanceRepositoryStub,
  eventRepositoryStub,
  staffRepositoryStub,
  sponsorRepositoryStub,
  verificationTokenRepositoryStub,
  otpRepositoryStub,
} from './repositories/stubs'

// Swap to Supabase repositories when SUPABASE_URL is configured.
function buildRepositories() {
  if (process.env.SUPABASE_URL) {
    const {
      userRepositorySupabase,
      membershipRepositorySupabase,
      attendanceRepositorySupabase,
      eventRepositorySupabase,
      verificationTokenRepositorySupabase,
      staffRepositorySupabase,
      sponsorRepositorySupabase,
      otpRepositorySupabase,
    } = require('./repositories/supabase')

    return {
      user: userRepositorySupabase as IUserRepository,
      membership: membershipRepositorySupabase as IMembershipRepository,
      attendance: attendanceRepositorySupabase as IAttendanceRepository,
      event: eventRepositorySupabase as IEventRepository,
      staff: staffRepositorySupabase as IStaffRepository,
      sponsor: sponsorRepositorySupabase as ISponsorRepository,
      verificationToken: verificationTokenRepositorySupabase as IVerificationTokenRepository,
      otp: otpRepositorySupabase as IAdminOtpRepository,
    }
  }

  // Default: in-memory stubs (no database needed for local dev)
  return {
    user: userRepositoryStub as IUserRepository,
    membership: membershipRepositoryStub as IMembershipRepository,
    attendance: attendanceRepositoryStub as IAttendanceRepository,
    event: eventRepositoryStub as IEventRepository,
    staff: staffRepositoryStub as IStaffRepository,
    sponsor: sponsorRepositoryStub as ISponsorRepository,
    verificationToken: verificationTokenRepositoryStub as IVerificationTokenRepository,
    otp: otpRepositoryStub as IAdminOtpRepository,
  }
}

export const repositories = buildRepositories()

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { repositories } from './container'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'One-Time Code', type: 'text' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase()
        const password = credentials?.password as string | undefined
        const otp = (credentials?.otp as string | undefined)?.trim()

        if (!email || !password) return null

        let userId: string
        let userEmail: string
        let userName: string | undefined
        let userRole: 'MEMBER' | 'ADMIN'

        if (process.env.SUPABASE_URL) {
          // Production: Supabase Auth validates the password.
          const { getSupabaseAnon } = await import('./supabase')
          const { data, error } = await getSupabaseAnon().auth.signInWithPassword({ email, password })
          if (error || !data.user) return null
          const user = await repositories.user.findById(data.user.id)
          if (!user) return null
          userId = user.id
          userEmail = user.email
          userName = user.name
          userRole = user.role
        } else {
          // Stub mode (no SUPABASE_URL): validate with bcrypt against the in-memory repo.
          const user = await repositories.user.findByEmail(email)
          if (!user?.passwordHash) return null
          const valid = await bcrypt.compare(password, user.passwordHash)
          if (!valid) return null
          userId = user.id
          userEmail = user.email
          userName = user.name
          userRole = user.role
        }

        // Admin accounts require a valid OTP as a second factor.
        if (userRole === 'ADMIN') {
          if (!otp) {
            // Signal the frontend to prompt for OTP. Returning null causes NextAuth
            // to redirect to /login?error=CredentialsSignin. The frontend detects
            // the absence of OTP and shows the OTP input instead.
            throw new Error('OTP_REQUIRED')
          }

          const otpRecord = await repositories.otp.findLatestForUser(userId)
          if (!otpRecord) throw new Error('OTP_INVALID')

          const otpValid = await bcrypt.compare(otp, otpRecord.codeHash)
          if (!otpValid) throw new Error('OTP_INVALID')

          // Consume the code so it cannot be reused.
          await repositories.otp.markUsed(otpRecord.id)
        }

        return { id: userId, email: userEmail, name: userName, role: userRole }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token?.sub) {
        // Re-fetch role from DB on every request so role changes (e.g. admin
        // demotion via PATCH /api/admin/members) take effect immediately instead
        // of persisting until JWT expiry (up to 30 days with the default strategy).
        const freshUser = await repositories.user.findById(token.sub)
        session.user.id = token.sub
        session.user.role = freshUser?.role ?? (token.role as string)
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}

export const { handlers, auth } = NextAuth(authOptions)

/** @deprecated Use auth() from next-auth instead. Kept for getServerSession in existing API routes. */
export { authOptions }

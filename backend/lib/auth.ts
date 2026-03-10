import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { repositories } from './container'
import { supabaseAnon } from './supabase'

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined
        if (!email || !password) return null

        // Supabase Auth validates the password — NextAuth owns the session from here.
        const { data, error } = await supabaseAnon.auth.signInWithPassword({
          email,
          password,
        })

        if (error || !data.user) return null

        // Fetch the profile to get name and role
        const user = await repositories.user.findById(data.user.id)
        if (!user) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
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
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
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

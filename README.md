# Club Membership Backend

A complete Next.js 14 backend for club membership management with Stripe payments, role-based access, and database-agnostic architecture.

## 🏗️ Architecture

**Service/Repository Pattern**: API routes → Services → Repositories
- **Database Agnostic**: Swap databases by changing only repository implementations
- **TypeScript Strict**: Full type safety throughout
- **Dependency Injection**: Centralized container for easy maintenance

## 📁 Structure

```
backend/
├── lib/
│   ├── interfaces/          # TypeScript interfaces & contracts
│   ├── services/           # Business logic layer
│   ├── repositories/       # Data access layer
│   │   └── stubs/         # In-memory implementations
│   ├── container.ts       # Dependency injection
│   ├── auth.ts           # NextAuth configuration
│   ├── stripe.ts         # Stripe integration
│   ├── email.ts          # Email service (stub)
│   └── upload.ts         # Vercel Blob file handling
├── app/api/              # API routes
├── middleware.ts         # Route protection
└── package.json
```

## 🚀 Quick Start

### Backend
1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```
2. **Environment setup**
   ```bash
   cp .env.example .env
   # Add your Stripe keys and other env variables
   ```
3. **Start development server**
   ```bash
   npm run dev
   ```

### Frontend
1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```
2. **Start development server**
   ```bash
   npm run dev
   ```
3. **Access the application**
   - Frontend: http://localhost:5173/
   - Backend: http://localhost:3000/

## 🔐 Authentication

- **NextAuth.js v5** with credentials provider
- **Role-based access**: MEMBER vs ADMIN permissions
- **JWT sessions** with role information
- **Protected routes** via middleware

## 💳 Payment Flow

1. User pays via Stripe checkout
2. Stripe webhook creates user account
3. Verification email sent with registration link
4. User completes registration with password
5. Membership becomes ACTIVE

## 📊 Data Models

- **User**: Authentication and role management
- **Membership**: Subscription status and Stripe integration
- **Attendance**: Points tracking for members
- **StaffMember**: Public staff profiles
- **Sponsor**: Public sponsor listings by tier

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Complete registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth routes

### Membership
- `GET /api/membership` - Get user's membership
- `POST /api/membership/cancel` - Cancel subscription

### Attendance
- `GET /api/attendance` - Get user's attendance records
- `POST /api/admin/attendance` - Create attendance (admin)

### Public Content
- `GET /api/staff` - Get active staff members
- `GET /api/sponsors` - Get sponsors grouped by tier

### Admin Management
- `POST/PUT/DELETE /api/admin/staff` - Staff management
- `POST/PUT/DELETE /api/admin/sponsors` - Sponsor management
- `GET /api/admin/members` - View all members

## 🔄 Database Migration

When ready to add a real database:

1. Create repository implementations in `/lib/repositories/postgres/`
2. Update `/lib/container.ts` imports
3. **No changes needed** to services or API routes

## 🛠️ Development

- **TypeScript strict mode** enabled
- **Consistent API responses**: `{ success: true, data: ... }` or `{ success: false, error: "..." }`
- **Error handling** on all routes
- **Input validation** for security

## 📦 Dependencies

### Backend
- **Next.js 14** with App Router
- **NextAuth.js v5** for authentication
- **Stripe** for payment processing
- **Vercel Blob** for file storage
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite
- **TypeScript** support available

## 🎯 Features

✅ Complete payment workflow  
✅ Role-based access control  
✅ File upload handling  
✅ Email service integration  
✅ Webhook processing  
✅ Database-agnostic design  
✅ Production-ready architecture  

**Ready for Vercel deployment!**

export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Club Membership Backend - Test Page</h1>
      <p>This is a basic test page to verify the backend is working.</p>
      
      <h2>Available API Endpoints:</h2>
      
      <h3>Public Endpoints (No Auth Required)</h3>
      <ul>
        <li><a href="/api/staff" target="_blank">GET /api/staff</a> - View staff members</li>
        <li><a href="/api/sponsors" target="_blank">GET /api/sponsors</a> - View sponsors</li>
      </ul>
      
      <h3>Authentication Endpoints</h3>
      <ul>
        <li>POST /api/auth/register - Complete registration (requires token)</li>
        <li>GET/POST /api/auth/[...nextauth] - NextAuth routes</li>
      </ul>
      
      <h3>Protected Endpoints (Auth Required)</h3>
      <ul>
        <li>GET /api/membership - Get user's membership</li>
        <li>POST /api/membership/cancel - Cancel subscription</li>
        <li>GET /api/attendance - Get attendance records</li>
      </ul>
      
      <h3>Admin Endpoints (Admin Role Required)</h3>
      <ul>
        <li>POST /api/admin/attendance - Create attendance record</li>
        <li>POST/PUT/DELETE /api/admin/staff - Manage staff</li>
        <li>POST/PUT/DELETE /api/admin/sponsors - Manage sponsors</li>
        <li>GET /api/admin/members - View all members</li>
      </ul>
      
      <h3>Webhook Endpoint</h3>
      <ul>
        <li>POST /api/webhooks/stripe - Stripe webhook handler</li>
      </ul>
      
      <h2>Testing Instructions:</h2>
      <ol>
        <li>Test public endpoints by clicking the links above</li>
        <li>Use Postman/curl to test POST endpoints</li>
        <li>Set up environment variables in .env file</li>
        <li>Configure Stripe webhooks for full testing</li>
      </ol>
      
      <h2>Environment Variables Needed:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px' }}>
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
      </pre>
    </div>
  )
}

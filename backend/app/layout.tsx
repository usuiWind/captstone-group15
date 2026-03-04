import './globals.css'

export const metadata = {
  title: 'Club Membership Backend',
  description: 'Test page for club membership API endpoints',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

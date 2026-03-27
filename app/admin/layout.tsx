import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/')
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0C0D14',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
    }}>
      <AdminSidebar />
      <main style={{ marginLeft: 220, flex: 1, padding: '36px 40px', maxWidth: 1100 }}>
        {children}
      </main>
    </div>
  )
}

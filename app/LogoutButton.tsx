'use client'

import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function LogoutButton({ email }: { email: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#62627A' }}>{email}</span>
      <button
        onClick={handleLogout}
        style={{
          fontSize: 11, fontWeight: 600, color: '#62627A',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '4px 10px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ログアウト
      </button>
    </div>
  )
}

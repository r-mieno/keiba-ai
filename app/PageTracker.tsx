'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const track = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('page_views').insert({
        user_id: user.id,
        user_email: user.email,
        path: pathname,
      })
    }
    track()
  }, [pathname])

  return null
}

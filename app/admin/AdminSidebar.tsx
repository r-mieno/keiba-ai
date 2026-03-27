'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',         label: 'アクセス解析', icon: '◈' },
  { href: '/admin/races',   label: 'レース管理',   icon: '◉' },
  { href: '/admin/results', label: '着順入力',     icon: '◎' },
  { href: '/admin/horses',  label: '馬マスタ',     icon: '◆' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div style={{
      width: 220,
      background: '#13141F',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 40,
    }}>
      <div style={{ padding: '0 8px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 4px' }}>
            ← Keiba AI
          </p>
        </Link>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#EEEEF5', margin: 0 }}>管理画面</p>
      </div>

      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: active ? 600 : 500,
            color: active ? '#14B8A6' : '#9898B0',
            background: active ? 'rgba(20,184,166,0.08)' : 'transparent',
            textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          }}>
            <span style={{ fontSize: 11, opacity: active ? 1 : 0.5 }}>{icon}</span>
            {label}
          </Link>
        )
      })}
    </div>
  )
}

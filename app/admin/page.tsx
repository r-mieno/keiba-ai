export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase-server'

type PageView = {
  id: string
  user_email: string | null
  path: string
  created_at: string
}

function Section({ title }: { title: string }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>
      {title}
    </p>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{
      background: '#13141F',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '20px 24px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#EEEEF5', margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: views } = await supabase
    .from('page_views')
    .select('id, user_email, path, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const rows: PageView[] = views ?? []

  // 集計
  const totalPV = rows.length
  const uniqueUsers = new Set(rows.map((r) => r.user_email).filter(Boolean)).size

  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' })
  const todayPV = rows.filter((r) => new Date(r.created_at).toLocaleDateString('sv', { timeZone: 'Asia/Tokyo' }) === today).length

  // パス別PV
  const pathCount: Record<string, number> = {}
  for (const r of rows) {
    pathCount[r.path] = (pathCount[r.path] ?? 0) + 1
  }
  const topPaths = Object.entries(pathCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  const maxCount = topPaths[0]?.[1] ?? 1

  // ユーザー別PV
  const userCount: Record<string, number> = {}
  for (const r of rows) {
    const key = r.user_email ?? '不明'
    userCount[key] = (userCount[key] ?? 0) + 1
  }
  const topUsers = Object.entries(userCount).sort((a, b) => b[1] - a[1])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>アクセス解析</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>直近500件のページビューを集計</p>
      </div>

      {/* サマリカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <StatCard label="総ページビュー" value={totalPV.toLocaleString()} />
        <StatCard label="ユニークユーザー" value={uniqueUsers} />
        <StatCard label="今日のPV" value={todayPV.toLocaleString()} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 人気ページ */}
        <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px' }}>
          <Section title="人気ページ TOP10" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topPaths.map(([path, count]) => (
              <div key={path}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#9898B0', fontFamily: 'monospace' }}>{path}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#EEEEF5' }}>{count}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / maxCount) * 100}%`,
                    background: '#14B8A6',
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ユーザー別 */}
        <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px' }}>
          <Section title="ユーザー別PV" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topUsers.map(([email, count]) => (
              <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 12, color: '#9898B0' }}>{email}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#EEEEF5' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 直近ログ */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '24px' }}>
        <Section title="直近アクセスログ" />
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {['日時', 'ユーザー', 'パス'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px 0', color: '#62627A', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 30).map((r) => (
              <tr key={r.id}>
                <td style={{ padding: '8px 12px 8px 0', color: '#62627A', whiteSpace: 'nowrap' }}>
                  {new Date(r.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}
                </td>
                <td style={{ padding: '8px 12px 8px 0', color: '#9898B0' }}>{r.user_email ?? '—'}</td>
                <td style={{ padding: '8px 0', color: '#EEEEF5', fontFamily: 'monospace' }}>{r.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

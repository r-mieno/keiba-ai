import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function AdminResultsPage() {
  const supabase = await createClient()

  const [{ data: races }, { data: results }] = await Promise.all([
    supabase.from('races').select('id,race_name,date,grade,venue').order('date', { ascending: false }),
    supabase.from('race_results').select('race_id'),
  ])

  const resultRaceIds = new Set((results ?? []).map((r) => r.race_id))

  const GRADE_COLOR: Record<string, string> = { G1: '#F59E0B', G2: '#9898B0', G3: '#78716C' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>着順入力</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>結果を入力するレースを選択してください</p>
      </div>

      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['日付', 'レース名', 'G', '開催場', 'ステータス', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(races ?? []).map((race) => {
              const done = resultRaceIds.has(race.id)
              return (
                <tr key={race.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', color: '#9898B0', whiteSpace: 'nowrap' }}>{race.date}</td>
                  <td style={{ padding: '12px 16px', color: '#EEEEF5', fontWeight: 500 }}>{race.race_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {race.grade && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: GRADE_COLOR[race.grade] ?? '#9898B0' }}>
                        {race.grade}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9898B0' }}>{race.venue ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {done ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#14B8A6', background: 'rgba(20,184,166,0.1)', padding: '3px 8px', borderRadius: 4 }}>
                        入力済み
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: '#62627A' }}>未入力</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/admin/results/${race.id}`} style={{ fontSize: 12, color: '#14B8A6', textDecoration: 'none', fontWeight: 600 }}>
                      {done ? '修正 →' : '入力 →'}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

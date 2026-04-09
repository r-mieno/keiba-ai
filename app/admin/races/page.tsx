import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { createRace } from './actions'

const GRADE_COLOR: Record<string, string> = {
  G1: '#F59E0B', G2: '#9898B0', G3: '#78716C',
}

export default async function AdminRacesPage() {
  const supabase = await createClient()

  const [{ data: races }, { data: entryCounts }] = await Promise.all([
    supabase.from('races').select('id,race_name,date,grade,venue,distance_m,surface').order('date', { ascending: false }),
    supabase.from('entries').select('race_id'),
  ])

  const countMap: Record<string, number> = {}
  for (const e of entryCounts ?? []) {
    countMap[e.race_id] = (countMap[e.race_id] ?? 0) + 1
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
    color: '#EEEEF5',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>レース管理</h1>
          <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>{races?.length ?? 0} 件登録済み</p>
        </div>
      </div>

      {/* 新規作成フォーム */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          新規レース作成
        </p>
        <form action={createRace}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>レース名 *</label>
              <input name="race_name" required placeholder="例：高松宮記念" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>日付 *</label>
              <input name="date" type="date" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>発走時刻</label>
              <input name="start_time" type="time" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>グレード</label>
              <select name="grade" style={inputStyle}>
                <option value="">—</option>
                <option value="G1">G1</option>
                <option value="G2">G2</option>
                <option value="G3">G3</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>開催場</label>
              <select name="venue" style={inputStyle}>
                <option value="">—</option>
                {['札幌','函館','福島','新潟','東京','中山','中京','京都','阪神','小倉'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>距離(m)</label>
              <select name="distance_m" style={inputStyle}>
                <option value="">—</option>
                {[1200,1400,1600,1800,2000,2200,2400,2500,3000,3200,3600].map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>馬場</label>
              <select name="surface" style={inputStyle}>
                <option value="">—</option>
                <option value="芝">芝</option>
                <option value="ダート">ダート</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{
            background: '#14B8A6', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            作成 →
          </button>
        </form>
      </div>

      {/* レース一覧 */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['日付', 'レース名', 'G', '開催場', '距離', '頭数', ''].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(races ?? []).map((race) => (
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
                <td style={{ padding: '12px 16px', color: '#9898B0' }}>
                  {race.distance_m ? `${race.surface ?? ''}${race.distance_m}m` : '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#9898B0' }}>{countMap[race.id] ?? 0}頭</td>
                <td style={{ padding: '12px 16px' }}>
                  <Link href={`/admin/races/${race.id}`} style={{
                    fontSize: 12, color: '#14B8A6', textDecoration: 'none', fontWeight: 600,
                  }}>
                    編集 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

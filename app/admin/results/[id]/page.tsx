import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { saveResults } from '../actions'
import SavedToast from '../../components/SavedToast'
import SubmitButton from '../../components/SubmitButton'

export default async function AdminResultsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: race }, { data: entries }, { data: horses }, { data: existingResults }] = await Promise.all([
    supabase.from('races').select('id,race_name,date,venue,grade,distance_m,surface').eq('id', id).single(),
    supabase.from('entries').select('horse_id,horse_number,jockey_name,finish_position,popularity_rank').eq('race_id', id),
    supabase.from('horses').select('id,name'),
    supabase.from('race_results').select('horse_id,finish_pos').eq('race_id', id),
  ])

  if (!race) notFound()

  const horseMap = new Map((horses ?? []).map((h) => [h.id, h.name]))
  const resultMap = new Map((existingResults ?? []).map((r) => [r.horse_id, r.finish_pos]))

  const rows = (entries ?? [])
    .map((e) => ({
      horse_id:       e.horse_id,
      horse_name:     horseMap.get(e.horse_id) ?? e.horse_id,
      horse_number:   e.horse_number,
      jockey_name:    e.jockey_name,
      finish_position: resultMap.get(e.horse_id) ?? e.finish_position ?? null,
      popularity_rank: e.popularity_rank ?? null,
    }))
    .sort((a, b) => (a.horse_number ?? 99) - (b.horse_number ?? 99))

  const saveAction = saveResults.bind(null, id)

  const selectStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 13,
    color: '#EEEEF5',
    outline: 'none',
    width: 72,
    cursor: 'pointer' as const,
  }
  const rankOptions = Array.from({ length: rows.length || 20 }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SavedToast message="着順を保存しました" />
      <div>
        <a href="/admin/results" style={{ fontSize: 12, color: '#62627A', textDecoration: 'none' }}>← 着順入力</a>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '8px 0 4px' }}>{race.race_name}</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>
          {race.date}　{race.venue ?? ''}　{race.distance_m ? `${race.surface ?? ''}${race.distance_m}m` : ''}
        </p>
      </div>

      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 20px' }}>
          着順・人気を入力
        </p>

        <form action={saveAction}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['馬番', '馬名', '騎手', '着順', '人気'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.horse_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#9898B0' }}>{row.horse_number ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#EEEEF5', fontWeight: 500 }}>{row.horse_name}</td>
                  <td style={{ padding: '10px 12px', color: '#9898B0' }}>{row.jockey_name ?? '—'}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <select name={`finish_${row.horse_id}`} defaultValue={row.finish_position ?? ''} style={selectStyle}>
                      <option value="">—</option>
                      {rankOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <select name={`popularity_${row.horse_id}`} defaultValue={row.popularity_rank ?? ''} style={selectStyle}>
                      <option value="">—</option>
                      {rankOptions.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <SubmitButton label="保存する" />
        </form>
      </div>
    </div>
  )
}

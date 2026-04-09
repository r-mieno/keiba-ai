import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { updateRace } from '../actions'
import EntryManager from './EntryManager'
import SavedToast from '../../components/SavedToast'
import SubmitButton from '../../components/SubmitButton'

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

export default async function AdminRaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: race }, { data: entries }, { data: horses }] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('entries').select('horse_id,horse_number,jockey_name,weight_kg,last3f_1,last3f_2,last3f_3,finish_position,popularity_rank').eq('race_id', id),
    supabase.from('horses').select('id,name'),
  ])

  if (!race) notFound()

  const horseMap = new Map((horses ?? []).map((h) => [h.id, h.name]))
  const entryRows = (entries ?? []).map((e) => ({
    ...e,
    horse_name: horseMap.get(e.horse_id) ?? e.horse_id,
  }))
  const allHorseNames = (horses ?? []).map((h) => h.name).sort()

  const updateAction = updateRace.bind(null, id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SavedToast />
      {/* ヘッダー */}
      <div>
        <a href="/admin/races" style={{ fontSize: 12, color: '#62627A', textDecoration: 'none' }}>← レース一覧</a>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '8px 0 4px' }}>{race.race_name}</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>{race.date}　{race.venue ?? ''}　{race.distance_m ? `${race.surface ?? ''}${race.distance_m}m` : ''}</p>
      </div>

      {/* レース情報編集 */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          レース情報
        </p>
        <form action={updateAction}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>レース名</label>
              <input name="race_name" defaultValue={race.race_name ?? ''} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>日付</label>
              <input name="date" type="date" defaultValue={race.date ?? ''} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>発走時刻</label>
              <input name="start_time" type="time" defaultValue={race.start_time ?? ''} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>グレード</label>
              <select name="grade" defaultValue={race.grade ?? ''} style={inputStyle}>
                <option value="">—</option>
                <option value="G1">G1</option>
                <option value="G2">G2</option>
                <option value="G3">G3</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>開催場</label>
              <select name="venue" defaultValue={race.venue ?? ''} style={inputStyle}>
                <option value="">—</option>
                {['札幌','函館','福島','新潟','東京','中山','中京','京都','阪神','小倉'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>距離(m)</label>
              <select name="distance_m" defaultValue={race.distance_m ?? ''} style={inputStyle}>
                <option value="">—</option>
                {[1200,1400,1600,1800,2000,2200,2400,2500,3000,3200,3600].map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>馬場</label>
              <select name="surface" defaultValue={race.surface ?? ''} style={inputStyle}>
                <option value="">—</option>
                <option value="芝">芝</option>
                <option value="ダート">ダート</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>ペース予想</label>
              <select name="pace_override" defaultValue={race.pace_override ?? ''} style={inputStyle}>
                <option value="">—</option>
                <option value="S">S（スロー）</option>
                <option value="M">M（ミドル）</option>
                <option value="H">H（ハイ）</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>レース紹介文</label>
              <textarea name="description" defaultValue={race.description ?? ''} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          <SubmitButton label="保存" />
        </form>
      </div>

      {/* エントリー管理 */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          出走馬　<span style={{ color: '#EEEEF5', fontSize: 14 }}>{entryRows.length}頭</span>
        </p>
        <EntryManager raceId={id} entries={entryRows} allHorseNames={allHorseNames} />
      </div>
    </div>
  )
}

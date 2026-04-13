import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { addPastResult, deletePastResult, upsertFormRecord, deleteFormRecord } from '../actions'
import SavedToast from '../../components/SavedToast'
import SubmitButton from '../../components/SubmitButton'
import HorseInfoForm from './HorseInfoForm'

const GRADE_OPTIONS = ['G1', 'G2', 'G3']

// horse_form_records の4角順位から脚質を自動判定
function computeDerivedStyle(records: { race_seq: number; corner_pos: number | null }[]): string | null {
  const TIME_W = [0.40, 0.28, 0.18, 0.09, 0.05]
  const FIELD = 16
  const sorted = [...records]
    .filter((r) => r.corner_pos != null)
    .sort((a, b) => b.race_seq - a.race_seq)
    .slice(0, 5)
  if (sorted.length === 0) return null
  let wSum = 0, wTotal = 0
  sorted.forEach((r, i) => {
    const w = TIME_W[i] ?? 0.02
    wSum += Math.min(1, r.corner_pos! / FIELD) * w
    wTotal += w
  })
  const ft = wSum / wTotal
  if (ft < 0.20) return '逃げ'
  if (ft < 0.45) return '先行'
  if (ft < 0.70) return '差し'
  return '追い込み'
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

export default async function AdminHorseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: horse }, { data: pastResults }, { data: formRecords }] = await Promise.all([
    supabase.from('horses').select('id,name,sire_name,damsire_name,dam_name,father_line,damsire_line,place3_rate,race_count').eq('id', id).single(),
    supabase.from('horse_past_results').select('id,race_name,grade,distance_m,finish_pos,field_size').eq('horse_id', id).order('grade').order('race_name'),
    supabase.from('horse_form_records').select('id,race_seq,race_name,last3f,corner_pos,finish_pos').eq('horse_id', id).order('race_seq', { ascending: false }),
  ])

  if (!horse) notFound()

  const derivedStyle = computeDerivedStyle(formRecords ?? [])
  const addAction = addPastResult.bind(null, id)
  const upsertFormAction = upsertFormRecord.bind(null, id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <SavedToast />
      {/* ヘッダー */}
      <div>
        <a href="/admin/horses" style={{ fontSize: 12, color: '#62627A', textDecoration: 'none' }}>← 馬マスタ</a>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '8px 0 0' }}>{horse.name}</h1>
      </div>

      {/* 基本情報・脚質 */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          基本情報・血統・脚質
        </p>
        <HorseInfoForm horseId={id} horse={horse as { name: string; sire_name?: string | null; damsire_name?: string | null; dam_name?: string | null; father_line?: string | null; damsire_line?: string | null; place3_rate?: number | null; race_count?: number | null }} derivedStyle={derivedStyle} />
      </div>

      {/* 過去実績 */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          過去重賞実績　<span style={{ color: '#EEEEF5', fontSize: 14 }}>{pastResults?.length ?? 0}件</span>
        </p>

        {/* 実績一覧 */}
        {(pastResults ?? []).length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['レース名', 'G', '距離', '着順', '頭数', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(pastResults ?? []).map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 12px', color: '#EEEEF5' }}>{r.race_name}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.grade ?? '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.distance_m ? `${r.distance_m}m` : '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.finish_pos}着</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.field_size}頭</td>
                  <td style={{ padding: '9px 12px' }}>
                    <form action={deletePastResult.bind(null, r.id, id)}>
                      <button type="submit" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 実績追加フォーム */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>
          実績を追加
        </p>
        <form action={addAction} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { name: 'race_name',  label: 'レース名', type: 'text',   placeholder: 'スプリンターズS', width: 160 },
            { name: 'distance_m', label: '距離(m)',  type: 'number', placeholder: '1200',           width: 80  },
            { name: 'finish_pos', label: '着順',     type: 'number', placeholder: '1',              width: 60  },
            { name: 'field_size', label: '頭数',     type: 'number', placeholder: '16',             width: 60  },
          ].map(({ name, label, type, placeholder, width }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#62627A' }}>{label}</label>
              <input
                name={name}
                type={type}
                placeholder={placeholder}
                required
                style={{ ...inputStyle, width }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: '#62627A' }}>グレード</label>
            <select name="grade" style={{ ...inputStyle, width: 80 }}>
              <option value="">—</option>
              {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <SubmitButton label="追加" />
        </form>
      </div>

      {/* 直近走行データ */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          直近走行データ（上がり・コーナー・着順）　<span style={{ color: '#EEEEF5', fontSize: 14 }}>{formRecords?.length ?? 0}件</span>
        </p>

        {(formRecords ?? []).length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['#', 'レース名', '上がり3F', '4角順位', '着順', ''].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#62627A', fontWeight: 600, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(formRecords ?? []).map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 12px', color: '#62627A', fontSize: 11 }}>{r.race_seq}</td>
                  <td style={{ padding: '9px 12px', color: '#EEEEF5' }}>{r.race_name ?? '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.last3f ?? '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.corner_pos ?? '—'}</td>
                  <td style={{ padding: '9px 12px', color: '#9898B0' }}>{r.finish_pos != null ? `${r.finish_pos}着` : '—'}</td>
                  <td style={{ padding: '9px 12px' }}>
                    <form action={deleteFormRecord.bind(null, r.id, id)}>
                      <button type="submit" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 12px' }}>
          追加・更新（同じ走目は上書き）
        </p>
        <form action={upsertFormAction} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { name: 'race_seq',   label: '# (古い順)',  type: 'number', placeholder: '1',      width: 64,  step: '1'   },
            { name: 'race_name',  label: 'レース名',    type: 'text',   placeholder: '桜花賞', width: 140, step: undefined },
            { name: 'last3f',     label: '上がり3F',    type: 'number', placeholder: '33.5',   width: 80,  step: '0.1' },
            { name: 'corner_pos', label: '4角順位',     type: 'number', placeholder: '5',      width: 72,  step: '1'   },
            { name: 'finish_pos', label: '着順',        type: 'number', placeholder: '2',      width: 64,  step: '1'   },
          ].map(({ name, label, type, placeholder, width, step }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: '#62627A' }}>{label}</label>
              <input
                name={name}
                type={type}
                step={step}
                placeholder={placeholder}
                required={name === 'race_seq'}
                style={{ ...inputStyle, width }}
              />
            </div>
          ))}
          <SubmitButton label="保存" />
        </form>
      </div>
    </div>
  )
}

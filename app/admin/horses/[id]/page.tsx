import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import SavedToast from '../../components/SavedToast'
import HorseInfoForm from './HorseInfoForm'
import FormRecordManager from './FormRecordManager'
import PastResultManager from './PastResultManager'

// horse_form_records の4角順位から脚質を自動判定
function computeDerivedStyle(records: { race_seq: number; corner_pos: number | null; field_size?: number | null }[]): string | null {
  const TIME_W = [0.40, 0.28, 0.18, 0.09, 0.05]
  const sorted = [...records]
    .filter((r) => r.corner_pos != null)
    .sort((a, b) => b.race_seq - a.race_seq)
    .slice(0, 5)
  if (sorted.length === 0) return null
  let wSum = 0, wTotal = 0
  sorted.forEach((r, i) => {
    const fieldSize = r.field_size ?? 16
    const w = TIME_W[i] ?? 0.02
    wSum += Math.min(1, r.corner_pos! / fieldSize) * w
    wTotal += w
  })
  const ft = wSum / wTotal
  if (ft < 0.20) return '逃げ'
  if (ft < 0.40) return '先行'
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
    supabase.from('horses').select('id,name,sire_name,damsire_name,dam_name,father_line,damsire_line,place3_rate,race_count,birth_date').eq('id', id).single(),
    supabase.from('horse_past_results').select('id,race_name,grade,distance_m,finish_pos,field_size').eq('horse_id', id).order('grade').order('race_name'),
    supabase.from('horse_form_records').select('id,race_seq,race_name,last3f,corner_pos,finish_pos,field_size').eq('horse_id', id).order('race_seq', { ascending: false }),
  ])

  if (!horse) notFound()

  const derivedStyle = computeDerivedStyle(formRecords ?? [])

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

        <PastResultManager horseId={id} results={pastResults ?? []} />
      </div>

      {/* 直近走行データ */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>
          直近走行データ（上がり・コーナー・着順）　<span style={{ color: '#EEEEF5', fontSize: 14 }}>{formRecords?.length ?? 0}件</span>
        </p>
        <FormRecordManager horseId={id} records={formRecords ?? []} />
      </div>
    </div>
  )
}

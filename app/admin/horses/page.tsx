import { createClient } from '@/lib/supabase-server'
import HorseList from './HorseList'
import CreateHorseForm from './CreateHorseForm'

export default async function AdminHorsesPage() {
  const supabase = await createClient()

  const [{ data: horses }, { data: styles }, { data: entries }, { data: races }, { data: runForms }] = await Promise.all([
    supabase.from('horses').select('id,name,sire_name,father_line,damsire_name,damsire_line').order('name'),
    supabase.from('horse_style_profiles').select('horse_id,style'),
    supabase.from('entries').select('horse_id,race_id'),
    supabase.from('races').select('id,race_name'),
    supabase.from('horse_form_records').select('horse_id,race_seq,corner_pos'),
  ])

  const styleMap = new Map((styles ?? []).map((s) => [s.horse_id, s.style]))
  const raceNameMap = new Map((races ?? []).map((r) => [r.id, r.race_name]))

  // horse_form_recordsから脚質を自動判定
  // レースページのgetDerivedStyle/getFrontTendencyと同一ロジック（加重平均・直近重視）
  const TIME_W = [0.40, 0.28, 0.18, 0.09, 0.05]
  const runFormsByHorse = new Map<string, { race_seq: number; corner_pos: number | null }[]>()
  for (const r of runForms ?? []) {
    const list = runFormsByHorse.get(r.horse_id) ?? []
    list.push(r)
    runFormsByHorse.set(r.horse_id, list)
  }
  function derivedStyleFromForms(horseId: string): string | null {
    const forms = (runFormsByHorse.get(horseId) ?? [])
      .filter((r) => r.corner_pos !== null)
      .sort((a, b) => b.race_seq - a.race_seq)
      .slice(0, 5)
    if (forms.length === 0) return null
    let wSum = 0, wTotal = 0
    forms.forEach((r, i) => {
      const normalized = Math.min(1, r.corner_pos! / 16)
      const w = TIME_W[i] ?? 0.02
      wSum += normalized * w
      wTotal += w
    })
    const ft = wTotal > 0 ? wSum / wTotal : 0
    if (ft < 0.20) return 'front'
    if (ft < 0.40) return 'stalker'
    if (ft < 0.70) return 'closer'
    return 'deep_closer'
  }

  // horse_id → レース名一覧
  const horseRaceMap = new Map<string, string[]>()
  for (const e of entries ?? []) {
    const raceName = raceNameMap.get(e.race_id)
    if (!raceName) continue
    const list = horseRaceMap.get(e.horse_id) ?? []
    list.push(raceName)
    horseRaceMap.set(e.horse_id, list)
  }

  const horseRows = (horses ?? []).map((h) => ({
    ...h,
    // 自動判定を優先、なければ手動設定
    style: derivedStyleFromForms(h.id) ?? styleMap.get(h.id) ?? null,
    raceNames: horseRaceMap.get(h.id) ?? [],
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>馬マスタ</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>{horseRows.length} 頭登録済み</p>
      </div>

      {/* 新規登録フォーム */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>新規馬登録</p>
        <CreateHorseForm />
      </div>

      <HorseList horses={horseRows} />
    </div>
  )
}

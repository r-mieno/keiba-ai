import { createClient } from '@/lib/supabase-server'
import HorseList from './HorseList'

export default async function AdminHorsesPage() {
  const supabase = await createClient()

  const [{ data: horses }, { data: styles }] = await Promise.all([
    supabase.from('horses').select('id,name,sire_name,father_line').order('name'),
    supabase.from('horse_style_profiles').select('horse_id,style'),
  ])

  const styleMap = new Map((styles ?? []).map((s) => [s.horse_id, s.style]))
  const horseRows = (horses ?? []).map((h) => ({
    ...h,
    style: styleMap.get(h.id) ?? null,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>馬マスタ</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>{horseRows.length} 頭登録済み</p>
      </div>
      <HorseList horses={horseRows} />
    </div>
  )
}

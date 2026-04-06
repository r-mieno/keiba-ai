'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'

export async function saveResults(raceId: string, formData: FormData) {
  const supabase = createAdminClient()

  // horse_id ごとに finish_position / popularity_rank を収集
  const updates: { horse_id: string; finish_pos: number; popularity: number | null }[] = []

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('finish_')) continue
    const horseId = key.replace('finish_', '')
    const finishPos = Number(value)
    if (!finishPos) continue
    const popularity = formData.get(`popularity_${horseId}`)
    updates.push({
      horse_id: horseId,
      finish_pos: finishPos,
      popularity: popularity ? Number(popularity) : null,
    })
  }

  if (updates.length === 0) return

  // entries.finish_position と popularity_rank を更新
  await Promise.all(
    updates.map(({ horse_id, finish_pos, popularity }) =>
      supabase
        .from('entries')
        .update({
          finish_position: finish_pos,
          ...(popularity !== null ? { popularity_rank: popularity } : {}),
        })
        .eq('race_id', raceId)
        .eq('horse_id', horse_id)
    )
  )

  // race_results に upsert
  await supabase.from('race_results').upsert(
    updates.map(({ horse_id, finish_pos }) => ({
      race_id: raceId,
      horse_id,
      finish_pos,
    })),
    { onConflict: 'race_id,horse_id' }
  )

  revalidatePath(`/admin/results/${raceId}`)
  revalidatePath(`/admin/results`)
  revalidatePath(`/race/${raceId}`)
  revalidatePath('/')
}

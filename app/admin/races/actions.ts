'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'

// ── レース ──────────────────────────────────────────────────────────

export async function createRace(formData: FormData) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('races')
    .insert({
      race_name:   formData.get('race_name') as string,
      date:        formData.get('date') as string,
      grade:       (formData.get('grade') as string) || null,
      venue:       (formData.get('venue') as string) || null,
      distance_m:  formData.get('distance_m') ? Number(formData.get('distance_m')) : null,
      surface:     (formData.get('surface') as string) || null,
      start_time:  (formData.get('start_time') as string) || null,
    })
    .select('id')
    .single()

  if (!error && data) redirect(`/admin/races/${data.id}`)
}

export async function updateRace(raceId: string, formData: FormData) {
  const supabase = createAdminClient()
  await supabase
    .from('races')
    .update({
      race_name:     formData.get('race_name') as string,
      date:          formData.get('date') as string,
      grade:         (formData.get('grade') as string) || null,
      venue:         (formData.get('venue') as string) || null,
      distance_m:    formData.get('distance_m') ? Number(formData.get('distance_m')) : null,
      surface:       (formData.get('surface') as string) || null,
      start_time:    (formData.get('start_time') as string) || null,
      pace_override: (formData.get('pace_override') as string) || null,
      description:   (formData.get('description') as string) || null,
    })
    .eq('id', raceId)

  revalidatePath(`/admin/races/${raceId}`)
  redirect(`/admin/races/${raceId}?saved=1`)
}

export async function deleteRace(raceId: string) {
  const supabase = createAdminClient()
  // entries も cascade で消えるが念のため先に削除
  await supabase.from('entries').delete().eq('race_id', raceId)
  await supabase.from('races').delete().eq('id', raceId)
  revalidatePath('/admin/races')
  redirect('/admin/races')
}

// ── エントリー ──────────────────────────────────────────────────────

export async function addEntry(raceId: string, formData: FormData) {
  const supabase = createAdminClient()
  const horseName = (formData.get('horse_name') as string).trim()

  const { data: horse } = await supabase
    .from('horses')
    .select('id')
    .eq('name', horseName)
    .single()

  if (!horse) return

  await supabase.from('entries').insert({
    race_id:      raceId,
    horse_id:     horse.id,
    horse_number: formData.get('horse_number') ? Number(formData.get('horse_number')) : null,
    jockey_name:  ((formData.get('jockey_name') as string) || '').replace(/\s+/g, '') || null,
    weight_kg:    formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null,
  })

  revalidatePath(`/admin/races/${raceId}`)
}

export async function updateEntry(raceId: string, horseId: string, formData: FormData) {
  const supabase = createAdminClient()
  const finishPosition = formData.get('finish_position') ? Number(formData.get('finish_position')) : null

  await supabase
    .from('entries')
    .update({
      horse_number:     formData.get('horse_number') ? Number(formData.get('horse_number')) : null,
      jockey_name:      ((formData.get('jockey_name') as string) || '').replace(/\s+/g, '') || null,
      weight_kg:        formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null,
      finish_position:  finishPosition,
      popularity_rank:  formData.get('popularity_rank') ? Number(formData.get('popularity_rank')) : null,
    })
    .eq('race_id', raceId)
    .eq('horse_id', horseId)

  if (finishPosition != null) {
    await supabase
      .from('race_results')
      .upsert({ race_id: raceId, horse_id: horseId, finish_pos: finishPosition }, { onConflict: 'race_id,horse_id' })
  }

  revalidatePath(`/admin/races/${raceId}`)
  revalidatePath(`/race/${raceId}`)
  revalidatePath('/')
}

export async function deleteEntry(raceId: string, horseId: string) {
  const supabase = createAdminClient()
  await supabase
    .from('entries')
    .delete()
    .eq('race_id', raceId)
    .eq('horse_id', horseId)

  revalidatePath(`/admin/races/${raceId}`)
}

type BulkEntryUpdate = {
  horse_id: string
  horse_number: number | null
  jockey_name: string | null
  weight_kg: number | null
  finish_position: number | null
  popularity_rank: number | null
}

export async function bulkUpdateEntries(raceId: string, updates: BulkEntryUpdate[]) {
  const supabase = createAdminClient()

  // entries を一括更新
  await Promise.all(
    updates.map((u) =>
      supabase
        .from('entries')
        .update({
          horse_number:    u.horse_number,
          jockey_name:     u.jockey_name,
          weight_kg:       u.weight_kg,
          finish_position: u.finish_position,
          popularity_rank: u.popularity_rank,
        })
        .eq('race_id', raceId)
        .eq('horse_id', u.horse_id)
    )
  )

  // finish_position が入力されている馬を race_results にも upsert
  const resultRows = updates
    .filter((u) => u.finish_position != null)
    .map((u) => ({ race_id: raceId, horse_id: u.horse_id, finish_pos: u.finish_position! }))

  if (resultRows.length > 0) {
    await supabase
      .from('race_results')
      .upsert(resultRows, { onConflict: 'race_id,horse_id' })
  }

  revalidatePath(`/admin/races/${raceId}`)
  revalidatePath(`/race/${raceId}`)
  revalidatePath('/')
}

export async function toggleScratched(raceId: string, horseId: string, scratched: boolean) {
  const supabase = createAdminClient()
  await supabase
    .from('entries')
    .update({ scratched })
    .eq('race_id', raceId)
    .eq('horse_id', horseId)

  revalidatePath(`/admin/races/${raceId}`)
}

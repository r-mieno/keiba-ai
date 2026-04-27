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
  await supabase
    .from('entries')
    .update({
      horse_number:     formData.get('horse_number') ? Number(formData.get('horse_number')) : null,
      jockey_name:      ((formData.get('jockey_name') as string) || '').replace(/\s+/g, '') || null,
      weight_kg:        formData.get('weight_kg') ? Number(formData.get('weight_kg')) : null,
      last3f_1:         formData.get('last3f_1') ? Number(formData.get('last3f_1')) : null,
      last3f_2:         formData.get('last3f_2') ? Number(formData.get('last3f_2')) : null,
      last3f_3:         formData.get('last3f_3') ? Number(formData.get('last3f_3')) : null,
      finish_position:  formData.get('finish_position') ? Number(formData.get('finish_position')) : null,
      popularity_rank:  formData.get('popularity_rank') ? Number(formData.get('popularity_rank')) : null,
    })
    .eq('race_id', raceId)
    .eq('horse_id', horseId)

  revalidatePath(`/admin/races/${raceId}`)
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

export async function toggleScratched(raceId: string, horseId: string, scratched: boolean) {
  const supabase = createAdminClient()
  await supabase
    .from('entries')
    .update({ scratched })
    .eq('race_id', raceId)
    .eq('horse_id', horseId)

  revalidatePath(`/admin/races/${raceId}`)
}

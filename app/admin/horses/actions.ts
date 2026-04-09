'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'

export async function createHorse(formData: FormData) {
  const supabase = createAdminClient()

  const name = (formData.get('name') as string).trim()
  if (!name) return

  const { data, error } = await supabase.from('horses').insert({
    name,
    sire_name:    (formData.get('sire_name') as string) || null,
    damsire_name: (formData.get('damsire_name') as string) || null,
    dam_name:     (formData.get('dam_name') as string) || null,
    father_line:  (formData.get('father_line') as string) || null,
    damsire_line: (formData.get('damsire_line') as string) || null,
    place3_rate:  formData.get('place3_rate') ? Number(formData.get('place3_rate')) : null,
  }).select('id').single()

  if (error || !data) return

  const style = formData.get('style') as string
  if (style) {
    await supabase.from('horse_style_profiles').insert({ horse_id: data.id, style })
  }

  revalidatePath('/admin/horses')
  redirect(`/admin/horses/${data.id}`)
}

export async function updateHorse(horseId: string, formData: FormData) {
  const supabase = createAdminClient()

  await supabase.from('horses').update({
    name:         formData.get('name') as string,
    sire_name:    (formData.get('sire_name') as string) || null,
    damsire_name: (formData.get('damsire_name') as string) || null,
    dam_name:     (formData.get('dam_name') as string) || null,
    father_line:  (formData.get('father_line') as string) || null,
    damsire_line: (formData.get('damsire_line') as string) || null,
    place3_rate:  formData.get('place3_rate') ? Number(formData.get('place3_rate')) : null,
  }).eq('id', horseId)

  const style = formData.get('style') as string
  if (style) {
    await supabase.from('horse_style_profiles').upsert(
      { horse_id: horseId, style },
      { onConflict: 'horse_id' }
    )
  }

  revalidatePath(`/admin/horses/${horseId}`)
  redirect(`/admin/horses/${horseId}?saved=1`)
}

export async function addPastResult(horseId: string, formData: FormData) {
  const supabase = createAdminClient()

  await supabase.from('horse_past_results').insert({
    horse_id:   horseId,
    race_name:  formData.get('race_name') as string,
    grade:      (formData.get('grade') as string) || null,
    distance_m: formData.get('distance_m') ? Number(formData.get('distance_m')) : null,
    finish_pos: Number(formData.get('finish_pos')),
    field_size: Number(formData.get('field_size')),
  })

  revalidatePath(`/admin/horses/${horseId}`)
  redirect(`/admin/horses/${horseId}?saved=1`)
}

export async function deletePastResult(resultId: string, horseId: string) {
  const supabase = createAdminClient()
  await supabase.from('horse_past_results').delete().eq('id', resultId)
  revalidatePath(`/admin/horses/${horseId}`)
}

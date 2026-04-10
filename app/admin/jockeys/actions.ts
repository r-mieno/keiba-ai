'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'

export async function createJockey(formData: FormData) {
  const supabase = createAdminClient()
  const name = (formData.get('jockey_name') as string).trim()
  if (!name) return

  await supabase.from('jockey_stats').insert({
    jockey_name: name,
    rides:       0,
    win_rate:    0,
    place2_rate: 0,
    place3_rate: formData.get('place3_rate') ? Number(formData.get('place3_rate')) : 0,
  })

  revalidatePath('/admin/jockeys')
}

export async function updateJockey(formData: FormData) {
  const supabase = createAdminClient()
  const name = formData.get('jockey_name') as string

  await supabase.from('jockey_stats').update({
    place3_rate: formData.get('place3_rate') ? Number(formData.get('place3_rate')) : 0,
  }).eq('jockey_name', name)

  revalidatePath('/admin/jockeys')
}

export async function deleteJockey(jockeyName: string) {
  const supabase = createAdminClient()
  await supabase.from('jockey_stats').delete().eq('jockey_name', jockeyName)
  revalidatePath('/admin/jockeys')
}

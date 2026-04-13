import { createClient } from '@/lib/supabase-server'
import JockeyList from './JockeyList'
import { createJockey } from './actions'
import SubmitButton from '../components/SubmitButton'

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

export default async function AdminJockeysPage() {
  const supabase = await createClient()
  const { data: jockeys } = await supabase
    .from('jockey_stats')
    .select('jockey_name,place3_rate,g1_wins,g2_wins,g3_wins')
    .order('jockey_name')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#EEEEF5', margin: '0 0 4px' }}>騎手マスタ</h1>
        <p style={{ fontSize: 13, color: '#62627A', margin: 0 }}>{jockeys?.length ?? 0} 名登録済み</p>
      </div>

      {/* 新規登録フォーム */}
      <div style={{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A', margin: '0 0 16px' }}>新規騎手登録</p>
        <form action={createJockey}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', maxWidth: 240 }}>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>騎手名 *</label>
              <input name="jockey_name" required placeholder="例：C.ルメール" style={inputStyle} />
            </div>
            <div style={{ width: 120 }}>
              <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>3着内率</label>
              <input name="place3_rate" type="number" step="0.001" min="0" max="1" placeholder="0.350" style={inputStyle} />
            </div>
            <SubmitButton label="登録" loadingLabel="登録中..." />
          </div>
        </form>
      </div>

      <JockeyList jockeys={jockeys ?? []} />
    </div>
  )
}

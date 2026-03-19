import RaceList from './RaceList'
import GradeCalendar from './GradeCalendar'
import LogoutButton from './LogoutButton'
import { createClient } from '@/lib/supabase-server'

type Race = {
  id: string
  race_name: string
  date: string
  is_test: boolean
  grade?: string | null
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email ?? ''

  let races: Race[] = []
  let resultRaceIds = new Set<string>()
  let errorMessage = ''

  try {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const headers = { apikey: key, Authorization: `Bearer ${key}` }

    const [racesRes, resultsRes] = await Promise.all([
      fetch(`${base}/rest/v1/races?select=id,race_name,date,is_test,grade&order=date.desc`, {
        headers, cache: 'no-store',
      }),
      fetch(`${base}/rest/v1/race_results?select=race_id`, {
        headers, cache: 'no-store',
      }),
    ])

    if (!racesRes.ok) {
      errorMessage = `取得失敗: ${racesRes.status}`
    } else {
      races = await racesRes.json()
    }
    if (resultsRes.ok) {
      const results: { race_id: string }[] = await resultsRes.json()
      resultRaceIds = new Set(results.map((r) => r.race_id))
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  const normalRaces = races.filter((r) => !r.is_test)

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0D14',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
    }}>

      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 16, lineHeight: 1, color: '#fff',
        }}>♞</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#EEEEF5', letterSpacing: '-0.01em' }}>
          Keiba AI
        </span>
        <span style={{ marginLeft: 4, fontSize: 12, color: '#62627A', letterSpacing: '0.01em' }}>
          AI競馬フォーメーション予想
        </span>
        <LogoutButton email={email} />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#14B8A6', textTransform: 'uppercase', margin: '0 0 12px',
          }}>
            KEIBA AI
          </p>
          <p style={{ fontSize: 14, color: '#9898B0', lineHeight: 1.85, margin: 0 }}>
            血統・脚質・展開・ペース・騎手・出走頭数・コース適性などをAIが総合分析し、軸馬・ヒモ馬のフォーメーション予想を自動生成します。
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
            borderRadius: 16, padding: '12px 16px', color: '#F87171',
            fontSize: 13, marginBottom: 24,
          }}>
            {errorMessage}
          </div>
        )}

        {/* ── Race list card ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: '#62627A', textTransform: 'uppercase', margin: '0 0 12px',
          }}>
            レース一覧
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            overflow: 'hidden',
          }}>
            {/* Column header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#62627A',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                width: 52, flexShrink: 0,
              }}>Date</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#62627A',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Race</span>
            </div>

            <RaceList races={normalRaces} resultRaceIds={[...resultRaceIds]} />

            {normalRaces.length === 0 && !errorMessage && (
              <p style={{ color: '#62627A', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
                レースデータがありません
              </p>
            )}
          </div>
        </div>

        {/* ── 重賞カレンダー ──────────────────────────────────────────────── */}
        <GradeCalendar today={new Date().toISOString().slice(0, 10)} />

        {/* ── 馬マスタ一覧リンク ───────────────────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <a
            href="/horses"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              color: '#9898B0',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'rgba(251,191,36,0.10)',
                border: '1px solid rgba(251,191,36,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>🐴</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#EEEEF5', margin: '0 0 2px' }}>
                  馬マスタ一覧
                </p>
                <p style={{ fontSize: 11, color: '#62627A', margin: 0 }}>
                  出走馬の脚質・父・母父・血統系統を確認
                </p>
              </div>
            </div>
            <span style={{ fontSize: 16, color: '#62627A', flexShrink: 0 }}>›</span>
          </a>
        </div>

        {/* ── 競馬用語集リンク ─────────────────────────────────────────── */}
        <div style={{ marginTop: 12 }}>
          <a
            href="/glossary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              color: '#9898B0',
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: 'rgba(20,184,166,0.10)',
                border: '1px solid rgba(20,184,166,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>📖</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#EEEEF5', margin: '0 0 2px' }}>
                  競馬用語集
                </p>
                <p style={{ fontSize: 11, color: '#62627A', margin: 0 }}>
                  買い目・脚質・展開・重賞など用語を解説
                </p>
              </div>
            </div>
            <span style={{ fontSize: 16, color: '#62627A', flexShrink: 0 }}>›</span>
          </a>
        </div>

        {/* ── 検証レース（DEBUG トグル） ── 非表示中 ─────────────────────── */}
        {/* {testRaces.length > 0 && (
          <DebugRaceList
            races={testRaces}
            resultRaceIds={[...resultRaceIds]}
          />
        )} */}
      </div>
    </main>
  )
}

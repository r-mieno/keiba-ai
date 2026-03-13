type Race = {
  id: string
  race_name: string
  date: string
}

export default async function Home() {
  let races: Race[] = []
  let errorMessage = ''

  try {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/races?select=id,race_name,date&order=date.desc`
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      errorMessage = `取得失敗: ${res.status}`
    } else {
      races = await res.json()
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0C0E',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
    }}>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: '#6366F1',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8EA', letterSpacing: '-0.01em' }}>
          Keiba AI
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px' }}>

        <h1 style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#E8E8EA',
          margin: '0 0 4px',
          letterSpacing: '-0.02em',
        }}>
          レース一覧
        </h1>
        <p style={{ fontSize: 13, color: '#5C5C63', marginBottom: 32 }}>
          AIによるレース分析・フォーメーション予想
        </p>

        {errorMessage && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 6,
            padding: '10px 14px',
            color: '#F87171',
            fontSize: 13,
            marginBottom: 20,
          }}>
            {errorMessage}
          </div>
        )}

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px',
          padding: '0 16px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Race
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9D9DA3', letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: 'right' }}>
            Date
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {races.map((race) => (
            <a key={race.id} href={`/race/${race.id}`} className="race-link">
              <span style={{ fontSize: 14, fontWeight: 500, color: '#E8E8EA' }}>
                {race.race_name}
              </span>
              <span style={{ fontSize: 12, color: '#9D9DA3', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {race.date.replace(/-/g, '/')}
              </span>
            </a>
          ))}
        </div>

        {races.length === 0 && !errorMessage && (
          <p style={{ color: '#5C5C63', fontSize: 13, textAlign: 'center', padding: '48px 0' }}>
            レースデータがありません
          </p>
        )}
      </div>
    </main>
  )
}

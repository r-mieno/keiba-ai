import { ChevronLeft } from 'lucide-react'

type Horse = {
  id: string
  name: string
  sire_name: string | null    // 父名（実データはここ）
  dam_name: string | null     // 母名
  damsire_name: string | null // 母父名
  father_line: string | null
  damsire_line: string | null
}

type StyleProfile = {
  horse_id: string
  style: string | null
}

type RunForm = {
  horse_id: string
  race_seq: number
  corner_pos: number | null
  field_size?: number | null
}

const TIME_W = [0.40, 0.28, 0.18, 0.09, 0.05]

function derivedStyle(horseId: string, runForms: RunForm[]): string | null {
  const records = runForms
    .filter((r) => r.horse_id === horseId && r.corner_pos !== null)
    .sort((a, b) => b.race_seq - a.race_seq)
    .slice(0, 5)
  if (records.length === 0) return null
  let wSum = 0, wTotal = 0
  records.forEach((r, i) => {
    const w = TIME_W[i] ?? 0.02
    wSum += Math.min(1, r.corner_pos! / (r.field_size ?? 16)) * w
    wTotal += w
  })
  const ft = wSum / wTotal
  if (ft < 0.20) return 'front'
  if (ft < 0.40) return 'stalker'
  if (ft < 0.70) return 'closer'
  return 'deep_closer'
}

// 脚質ラベル・カラー
const STYLE_LABELS: Record<string, string> = {
  front:       '逃げ',
  stalker:     '先行',
  closer:      '差し',
  deep_closer: '追込',
}
const STYLE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  front:       { color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)' },
  stalker:     { color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.30)'  },
  closer:      { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.30)'  },
  deep_closer: { color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.30)' },
}

// 血統系統の表示名とカラー（DBのbloodline_type enumに対応）
const LINE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  sunday:         { label: 'サンデー系',        color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.25)'  },
  mrprospector:   { label: 'ミスプロ系',        color: '#34D399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)'  },
  northerndancer: { label: 'ノーザンダンサー系', color: '#C084FC', bg: 'rgba(192,132,252,0.10)', border: 'rgba(192,132,252,0.25)' },
  roberto:        { label: 'ロベルト系',        color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  nasrullah:      { label: 'ナスルーラ系',      color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  other:          { label: 'その他',            color: '#9898B0', bg: 'rgba(152,152,176,0.10)', border: 'rgba(152,152,176,0.25)' },
}

function LineBadge({ line }: { line: string | null }) {
  if (!line) return <span style={{ fontSize: 11, color: '#62627A' }}>—</span>
  const key = line.toLowerCase().replace(/[\s-]/g, '_')
  const meta = LINE_META[key]
  if (!meta) {
    return (
      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
        background: 'rgba(255,255,255,0.05)', color: '#9898B0',
        border: '1px solid rgba(255,255,255,0.10)',
      }}>
        {line}
      </span>
    )
  }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
    }}>
      {meta.label}
    </span>
  )
}

function StyleBadge({ style }: { style: string | null }) {
  if (!style || !STYLE_LABELS[style]) {
    return <span style={{ fontSize: 11, color: '#62627A' }}>—</span>
  }
  const s = STYLE_COLORS[style]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {STYLE_LABELS[style]}
    </span>
  )
}

export default async function HorsesPage() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  let horses: Horse[] = []
  let styleProfiles: StyleProfile[] = []
  let runForms: RunForm[] = []
  let errorMessage = ''

  try {
    const [horsesRes, stylesRes, runFormsRes] = await Promise.all([
      fetch(`${base}/rest/v1/horses?select=id,name,sire_name,dam_name,damsire_name,father_line,damsire_line&order=name.asc`, {
        headers, cache: 'no-store',
      }),
      fetch(`${base}/rest/v1/horse_style_profiles?select=horse_id,style`, {
        headers, cache: 'no-store',
      }),
      fetch(`${base}/rest/v1/horse_form_records?select=horse_id,race_seq,corner_pos,field_size`, {
        headers, cache: 'no-store',
      }),
    ])

    if (!horsesRes.ok) {
      errorMessage = `取得失敗: ${horsesRes.status}`
    } else {
      horses = await horsesRes.json()
    }
    if (stylesRes.ok) styleProfiles = await stylesRes.json()
    if (runFormsRes.ok) runForms = await runFormsRes.json()
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  const styleMap = new Map(styleProfiles.map((p) => [p.horse_id, p.style]))

  // 自動判定を優先、なければ手動設定にフォールバック
  const getStyle = (horseId: string) => derivedStyle(horseId, runForms) ?? styleMap.get(horseId) ?? null

  // 脚質ごとの集計
  const styleCounts = horses.reduce<Record<string, number>>((acc, h) => {
    const s = getStyle(h.id) ?? 'unknown'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0C0D14',
      fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
      color: '#EEEEF5',
    }}>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <a href="/" className="back-link">
          <ChevronLeft size={14} strokeWidth={2} />
          レース一覧
        </a>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#9898B0' }}>馬マスタ一覧</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#62627A' }}>
          {horses.length} 頭
        </span>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* 脚質集計チップ */}
        {horses.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {(['front', 'stalker', 'closer', 'deep_closer'] as const).map((s) => (
              <span key={s} style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                background: STYLE_COLORS[s].bg, color: STYLE_COLORS[s].color,
                border: `1px solid ${STYLE_COLORS[s].border}`,
              }}>
                {STYLE_LABELS[s]} {styleCounts[s] ?? 0}頭
              </span>
            ))}
            {(styleCounts['unknown'] ?? 0) > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', color: '#62627A',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                脚質未設定 {styleCounts['unknown']}頭
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
            borderRadius: 12, padding: '12px 16px', color: '#F87171',
            fontSize: 13, marginBottom: 20,
          }}>
            {errorMessage}
          </div>
        )}

        {/* 血統系統の特徴 */}
        <div style={{
          background: '#13141F', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: '#62627A', margin: '0 0 14px',
          }}>血統系統の特徴</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                key: 'sunday',
                label: 'サンデー系',
                desc: '芝の中距離〜長距離に強く、末脚（切れ味）に優れる。日本の芝コースに最適化。ディープインパクト、ハーツクライなど。',
              },
              {
                key: 'mrprospector',
                label: 'ミスプロ系',
                desc: 'スピードとパワーのバランスが良く、短距離〜マイルに適性。ダートでも活躍。キングカメハメハ、ロードカナロアなど。',
              },
              {
                key: 'northerndancer',
                label: 'ノーザンダンサー系',
                desc: 'スタミナと頑丈さが特徴。道悪・重馬場に強く、欧州型は長距離向き。サドラーズウェルズ系はステイヤーに多い。',
              },
              {
                key: 'roberto',
                label: 'ロベルト系',
                desc: 'パワーと根性が特徴。雨・重馬場に強く、直線の短いコースや洋芝向き。ブライアンズタイム、スクリーンヒーロー、モーリスなど。',
              },
              {
                key: 'nasrullah',
                label: 'ナスルーラ系',
                desc: 'スピード特化型が多い古い系統。現代では純粋な系統は少なく、グレイソヴリン系などを通じて残っている。',
              },
            ].map(({ key, label, desc }) => {
              const meta = LINE_META[key]
              return (
                <div key={key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, flexShrink: 0, marginTop: 1,
                    background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                  }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#9898B0', lineHeight: 1.7 }}>{desc}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* テーブル */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Column header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 1fr 1fr',
            gap: '0 16px',
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            {['馬名', '脚質', '父 / 父系統', '母父 / 母父系統'].map((col) => (
              <span key={col} style={{
                fontSize: 10, fontWeight: 700, color: '#62627A',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {col}
              </span>
            ))}
          </div>

          {/* Rows */}
          {horses.length === 0 && !errorMessage && (
            <p style={{ color: '#62627A', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
              データがありません
            </p>
          )}
          {horses.map((horse, i) => {
            const style = getStyle(horse.id)
            return (
              <div
                key={horse.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 1fr 1fr',
                  gap: '0 16px',
                  padding: '12px 20px',
                  alignItems: 'center',
                  borderBottom: i < horses.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}
              >
                {/* 馬名 */}
                <span style={{ fontSize: 13, fontWeight: 600, color: '#EEEEF5' }}>
                  {horse.name}
                </span>

                {/* 脚質 */}
                <StyleBadge style={style} />

                {/* 父 / 父系統 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12, color: '#9898B0' }}>
                    {horse.sire_name ?? <span style={{ color: '#62627A' }}>—</span>}
                  </span>
                  <LineBadge line={horse.father_line} />
                </div>

                {/* 母父 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 12, color: '#9898B0' }}>
                    {horse.damsire_name ?? <span style={{ color: '#62627A' }}>—</span>}
                  </span>
                  <LineBadge line={horse.damsire_line} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

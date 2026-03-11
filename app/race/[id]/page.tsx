import BetPlanPanel from './BetPlanPanel'

type FormationResponse = {
  race_id: string
  race_structure_score: number
  axis_count: number
  axis_horses: string[]
  himo_horses: string[]
  ticket_count: number
}

type Race = {
  id: string
  race_name: string
  date: string
}

type RunningStyle = 'front' | 'stalker' | 'closer' | 'deep_closer'

type Horse = {
  id: string
  name: string
  style: RunningStyle | null
}

type RaceResult = {
  horse_id: string
  finish_pos: number
}

type Entry = {
  horse_id: string
  horse_number: number | null
}

// ─── Score level data ────────────────────────────────────────────────────────

const SCORE_LEVELS = [
  { min: 81, max: 100, color: '#1f5fa8', label: '✅ 非常に安定' },
  { min: 61, max: 80,  color: '#1a6e3f', label: '🟢 安定' },
  { min: 41, max: 60,  color: '#7a6012', label: '🟡 バランス型' },
  { min: 21, max: 40,  color: '#a05020', label: '🟠 荒れやすい' },
  { min: 0,  max: 20,  color: '#a83030', label: '🌪 非常に荒れやすい' },
]

const STRATEGIES = [
  {
    min: 81, max: 100,
    raceType: '✅ 非常に安定',
    approach: '軸馬を絞って堅く買う',
    comment: '実力馬がそのまま結果に直結しやすい。上位人気を中心に組み立てるのが有効。',
  },
  {
    min: 61, max: 80,
    raceType: '🟢 安定',
    approach: '軸馬重視のフォーメーション',
    comment: '波乱は少なめ。人気馬を軸に、ヒモは手広く押さえる程度でよい。',
  },
  {
    min: 41, max: 60,
    raceType: '🟡 バランス型',
    approach: '軸・ヒモともにバランスよく選ぶ',
    comment: '実力と紛れが混在する。人気馬と中穴を組み合わせた買い方が有効。',
  },
  {
    min: 21, max: 40,
    raceType: '🟠 荒れやすい',
    approach: 'ヒモを広めに取る',
    comment: '人気馬の信頼度がやや低い。中穴・大穴の馬も視野に入れて買い目を広げよう。',
  },
  {
    min: 0,  max: 20,
    raceType: '🌪 非常に荒れやすい',
    approach: '大穴狙いも視野に入れる',
    comment: '実力通りに決まりにくいレース。思い切って人気薄を軸にした買い方も一考。',
  },
]

const BET_LEVELS = [
  {
    min: 81, max: 100,
    color: '#1f5fa8',
    label: '🚀 強く買い',
    comment: 'AIのエッジが高く、レース構造も明確。積極的に狙える局面。',
  },
  {
    min: 61, max: 80,
    color: '#1a6e3f',
    label: '🔥 買い候補',
    comment: 'AIが優位性を見出しており、レースも十分読みやすい。バランスの取れた賭け機会。',
  },
  {
    min: 41, max: 60,
    color: '#7a6012',
    label: '👍 検討',
    comment: '一定の価値はあるが、慎重な判断を要する。買い目を絞った参加が賢明。',
  },
  {
    min: 21, max: 40,
    color: '#a05020',
    label: '👀 様子見',
    comment: 'AIのエッジは存在するが、レースの読みづらさがリスクを高めている。少額での参加を推奨。',
  },
  {
    min: 0,  max: 20,
    color: '#a83030',
    label: '👀 見送り',
    comment: '現時点では賭けのメリットが薄い。見送りも十分な選択肢。',
  },
]

const VALUE_REASONS = [
  { min: 81, max: 100, reason: 'AIが高く評価しているが、人気が集中しすぎている可能性あり。オッズに妙味が出やすい。' },
  { min: 61, max: 80,  reason: 'AIの評価がマーケット予想を上回っている可能性がある。安定レースの穴狙いに有効。' },
  { min: 41, max: 60,  reason: '実力と人気のギャップが生じやすいレース。AIが見出した隠れた実力馬。' },
  { min: 21, max: 40,  reason: '荒れやすいレースでAIが推奨する穴馬。人気以上の好走が期待できる。' },
  { min: 0,  max: 20,  reason: '大荒れ想定のレース。AIが拾い上げた大穴候補。高配当のチャンス。' },
]

// ─── Pace outlook data ────────────────────────────────────────────────────────

type PaceType = 'fast' | 'balanced' | 'slow'

const PACE_INFO: Record<PaceType, { label: string; color: string; explanation: string; aiComment: string }> = {
  fast: {
    label: 'ハイペース',
    color: '#a83030',
    explanation: '先行馬が複数いるため、序盤からペースが上がりやすい展開。',
    aiComment: '差し・追い込み馬にとってチャンスが生まれやすい。先行馬の消耗が鍵になる。',
  },
  slow: {
    label: 'スローペース',
    color: '#1f5fa8',
    explanation: '先行馬が少なく、前半はゆったりとした流れになる可能性が高い。',
    aiComment: '先行・番手馬が楽に前を取れる展開。差し馬は早めのポジション取りが重要になる。',
  },
  balanced: {
    label: '平均ペース',
    color: '#1a6e3f',
    explanation: '先行馬と追い込み馬のバランスが取れており、平均的な流れが予想される。',
    aiComment: '番手・差し馬ともに好機が生まれやすい。展開の読みに幅を持たせた買い方が有効。',
  },
}

function computePaceOutlook(
  formation: FormationResponse,
  horses: Horse[],
): { pace: PaceType; frontCount: number; stalkerCount: number; closerCount: number; deepCloserCount: number } {
  const raceHorseIds = [...formation.axis_horses, ...formation.himo_horses]
  const raceHorses = raceHorseIds.map((hid) => horses.find((h) => h.id === hid)).filter(Boolean) as Horse[]
  const frontCount = raceHorses.filter((h) => h.style === 'front').length
  const stalkerCount = raceHorses.filter((h) => h.style === 'stalker').length
  const closerCount = raceHorses.filter((h) => h.style === 'closer').length
  const deepCloserCount = raceHorses.filter((h) => h.style === 'deep_closer').length
  let pace: PaceType
  if (frontCount >= 2) {
    pace = 'fast'
  } else if (frontCount === 1 && stalkerCount <= 2) {
    pace = 'slow'
  } else {
    pace = 'balanced'
  }
  return { pace, frontCount, stalkerCount, closerCount, deepCloserCount }
}

// ─── Pace advantage helpers ───────────────────────────────────────────────────

const STYLE_LABELS: Record<RunningStyle, string> = {
  front: '逃げ',
  stalker: '先行',
  closer: '差し',
  deep_closer: '追込',
}

// Fixed color per running style — used consistently across all panels
const STYLE_COLORS: Record<RunningStyle, string> = {
  front: '#c0392b',        // 逃げ — red
  stalker: '#d35400',      // 先行 — orange
  closer: '#1a5fa8',       // 差し — blue
  deep_closer: '#7d3c98',  // 追込 — purple
}

// Short explanation of why each style benefits from a given pace
const PACE_ADV_COMMENTS: Partial<Record<PaceType, Partial<Record<RunningStyle, string>>>> = {
  slow: {
    front: 'スローペースで前残りの恩恵を受けやすい',
    stalker: 'スローペースで好位を楽に確保できる展開',
  },
  fast: {
    closer: 'ハイペースなら差し脚が活きる可能性が高い',
    deep_closer: 'ハイペースで前が崩れれば追込が台頭しやすい',
  },
}

// Returns up to 3 horses that gain a positive pace adjustment from the current pace,
// sorted by adjustment descending. Returns [] when pace is balanced (no adjustment).
function getPaceAdvantageHorses(
  formation: FormationResponse,
  horses: Horse[],
  pace: PaceType,
): { name: string; style: RunningStyle; comment: string }[] {
  if (pace === 'balanced') return []
  const raceHorseIds = [...formation.axis_horses, ...formation.himo_horses]
  return raceHorseIds
    .map((hid) => horses.find((h) => h.id === hid))
    .filter((h): h is Horse & { style: RunningStyle } => h !== undefined && h.style !== null)
    .map((h) => ({ h, adj: getPaceAdjustment(h.style, pace) }))
    .filter(({ adj }) => adj > 0)
    .sort((a, b) => b.adj - a.adj)
    .slice(0, 3)
    .map(({ h }) => ({
      name: h.name,
      style: h.style,
      comment: PACE_ADV_COMMENTS[pace]?.[h.style] ?? 'この展開で恩恵を受けやすい',
    }))
}

// ─── Pace adjustment helper ───────────────────────────────────────────────────

// Returns a pace adjustment value for a horse based on its running style and the race pace.
// Positive = horse benefits; negative = horse is disadvantaged.
// Magnitude: boost +0.05 to +0.10, reduce -0.03 to -0.08
function getPaceAdjustment(style: RunningStyle | null, pace: PaceType): number {
  if (pace === 'balanced' || style === null) return 0
  if (pace === 'slow') {
    // Front/stalker can dictate tempo and coast to victory in a slow-run race
    if (style === 'front') return 0.08
    if (style === 'stalker') return 0.05
    // Closers need the pace to be fast to generate momentum — disadvantaged here
    if (style === 'closer') return -0.05
    if (style === 'deep_closer') return -0.08
  }
  if (pace === 'fast') {
    // Front runners burn out fighting for position early
    if (style === 'front') return -0.05
    // Stalkers can adapt to either pace; roughly neutral
    if (style === 'stalker') return 0
    // Closers and deep closers thrive when the front speeds up and tires
    if (style === 'closer') return 0.07
    if (style === 'deep_closer') return 0.10
  }
  return 0
}

const STRATEGIES_MAP = STRATEGIES
const BET_LEVELS_MAP = BET_LEVELS

// ─── Axis horse reason builder ────────────────────────────────────────────────

function buildAxisReason(style: RunningStyle | null, pace: PaceType, pct: number, rank: number): string {
  const adj = getPaceAdjustment(style, pace)
  const rankText = rank === 0 ? '総合評価トップ' : '総合評価上位'
  const stabilityText = pct >= 61 ? '安定したレースで' : pct >= 41 ? 'バランス型のレースで' : '波乱含みのレースだが'
  if (style !== null && adj > 0) {
    const paceComment = PACE_ADV_COMMENTS[pace]?.[style] ?? 'この展開で恩恵を受けやすい'
    return `${paceComment}。${rankText}のため信頼できる軸馬。`
  } else if (style !== null && adj < 0) {
    return `展開面では若干不利だが、${rankText}のため軸に選定。`
  } else {
    return `${stabilityText}展開を問わない安定感があり、${rankText}の軸馬。`
  }
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function getBetLevel(betScore: number) {
  return BET_LEVELS_MAP.find((l) => betScore >= l.min && betScore <= l.max) ?? BET_LEVELS_MAP[4]
}

function computeBetScore(pct: number, edge: number): number {
  return Math.min(100, Math.max(0, Math.round(pct * 0.6 + edge * 1.5)))
}

function getBetPlanInfo(
  formation: FormationResponse,
  horses: Horse[],
  pct: number,
): { betType: string; axisNames: string[]; himoNames: string[] } {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id
  const axisNames = formation.axis_horses.map(resolveName)
  const himoNames = formation.himo_horses.map(resolveName)
  const betType =
    formation.axis_count === 1
      ? '三連複 1頭軸流し'
      : formation.axis_count === 2
      ? '三連複 2頭軸流し'
      : '三連複 フォーメーション'
  void pct
  return { betType, axisNames, himoNames }
}

function getLevel(pct: number) {
  return SCORE_LEVELS.find((l) => pct >= l.min && pct <= l.max) ?? SCORE_LEVELS[4]
}

function getStrategy(pct: number) {
  return STRATEGIES_MAP.find((s) => pct >= s.min && pct <= s.max) ?? STRATEGIES_MAP[4]
}

function getValueOpportunity(
  formation: FormationResponse,
  horses: Horse[],
  pct: number,
  pace: PaceType,
): { horseName: string; aiWinProb: number; marketProb: number; edge: number; reason: string } | null {
  // Pick the himo horse most favored by the current pace (highest pace adjustment first)
  const sortedHimo = [...formation.himo_horses].sort((a, b) => {
    const styleA = horses.find((h) => h.id === a)?.style ?? null
    const styleB = horses.find((h) => h.id === b)?.style ?? null
    return getPaceAdjustment(styleB, pace) - getPaceAdjustment(styleA, pace)
  })
  const candidateId = sortedHimo[0] ?? formation.axis_horses.at(-1) ?? null
  if (!candidateId) return null
  const candidateHorse = horses.find((h) => h.id === candidateId)
  const horseName = candidateHorse?.name ?? candidateId
  const baseAiWinProb = Math.round(20 + (100 - pct) * 0.1)
  // Convert fractional pace adjustment to percentage points and apply to AI win probability
  const paceAdj = Math.round(getPaceAdjustment(candidateHorse?.style ?? null, pace) * 100)
  const aiWinProb = Math.max(1, baseAiWinProb + paceAdj)
  const edge = Math.round(10 + (100 - pct) * 0.2)
  const marketProb = Math.max(1, aiWinProb - edge)
  const entry = VALUE_REASONS.find((r) => pct >= r.min && pct <= r.max) ?? VALUE_REASONS[4]
  return { horseName, aiWinProb, marketProb, edge, reason: entry.reason }
}

// ─── AI summary builder ───────────────────────────────────────────────────────

// Combines stability, pace, and value signals into 2–3 natural-language sentences.
function buildAiSummary(
  pct: number,
  pace: PaceType,
  advantageHorses: { style: RunningStyle }[],
  valueHorse: { horseName: string; edge: number } | null,
): string[] {
  const stabilityTexts: [number, string][] = [
    [81, '非常に安定した'],
    [61, '安定した'],
    [41, 'バランス型の'],
    [21, '荒れやすい'],
    [0,  '非常に荒れやすい'],
  ]
  const stabilityText = stabilityTexts.find(([min]) => pct >= min)?.[1] ?? '荒れやすい'

  const lines: string[] = []

  // Line 1: race type + pace
  lines.push(`${stabilityText}レースで${PACE_INFO[pace].label}想定。`)

  // Line 2: pace advantage style (or no-advantage fallback)
  if (advantageHorses.length > 0) {
    const styleComment: Partial<Record<RunningStyle, string>> = {
      front:       '逃げ・先行馬が有利な展開になりそう。',
      stalker:     '先行馬が好位を取りやすい展開になりそう。',
      closer:      '差し馬に展開が向く可能性が高い。',
      deep_closer: '追込馬が台頭しやすい展開になりそう。',
    }
    lines.push(styleComment[advantageHorses[0].style] ?? 'ペース適性馬が台頭しやすい。')
  } else {
    lines.push('展開の有利・不利は少なく、実力通りの結果になりやすい。')
  }

  // Line 3: value horse
  if (valueHorse) {
    lines.push(`${valueHorse.horseName} が人気より +${valueHorse.edge}% 高評価の穴候補。`)
  }

  return lines
}

// ─── Score legend ─────────────────────────────────────────────────────────────

const LEGEND = [
  { range: '81–100', color: '#1f5fa8', label: '✅ 非常に安定' },
  { range: '61–80',  color: '#1a6e3f', label: '🟢 安定' },
  { range: '41–60',  color: '#7a6012', label: '🟡 バランス型' },
  { range: '21–40',  color: '#a05020', label: '🟠 荒れやすい' },
  { range: '0–20',   color: '#a83030', label: '🌪 非常に荒れやすい' },
]

// ─── Shared card style ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 10,
  padding: '20px 20px',
  border: '1px solid #e0dbd3',
  marginBottom: 16,
}

const sectionLabel: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: '1px solid #ede9e3',
}

// ─── ScoreGauge component ─────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)))
  const level = getLevel(pct)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: level.color }}>{pct}</span>
        <span style={{ color: '#9b9490', marginBottom: 6, fontSize: 15 }}> / 100</span>
      </div>
      <div style={{ background: '#ede9e3', borderRadius: 9999, height: 6, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: level.color, borderRadius: 9999 }} />
      </div>
      <p style={{ color: level.color, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{level.label}</p>
      <div style={{ borderTop: '1px solid #ede9e3', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {LEGEND.map(({ range, color, label }) => (
          <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: '#9b9490', fontSize: 11, width: 52 }}>{range}</span>
            <span style={{ color: '#b0aaa4', fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── HorseRow component ───────────────────────────────────────────────────────

function HorseRow({
  rank,
  name,
  role,
  paceTag,
  styleTag,
}: {
  rank: number
  name: string
  role: 'axis' | 'himo'
  paceTag?: 'up' | 'down' | null
  styleTag?: { label: string; color: string } | null
}) {
  const isAxis = role === 'axis'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        background: isAxis ? 'rgba(26,92,53,0.06)' : '#faf8f5',
        borderLeft: `3px solid ${isAxis ? '#1a5c35' : '#e0dbd3'}`,
        marginBottom: 5,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          background: isAxis ? '#1a5c35' : '#ede9e3',
          color: isAxis ? '#fff' : '#9b9490',
        }}
      >
        {rank}
      </span>
      <span
        style={{
          flex: 1,
          fontWeight: isAxis ? 700 : 400,
          fontSize: 14,
          color: isAxis ? '#1e1b18' : '#5c5650',
        }}
      >
        {name}
      </span>
      {styleTag && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: 9999,
            background: `${styleTag.color}18`,
            color: styleTag.color,
            border: `1px solid ${styleTag.color}44`,
          }}
        >
          {styleTag.label}
        </span>
      )}
      {paceTag && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 9999,
            background: paceTag === 'up' ? '#e6f4ec' : '#fdf2f2',
            color: paceTag === 'up' ? '#1a6e3f' : '#a83030',
            border: `1px solid ${paceTag === 'up' ? '#b8dfc8' : '#e8c8c8'}`,
          }}
        >
          {paceTag === 'up' ? '↑ペース' : '↓ペース'}
        </span>
      )}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 9999,
          background: isAxis ? '#1a5c35' : 'transparent',
          color: isAxis ? '#fff' : '#9b9490',
          border: `1px solid ${isAxis ? '#1a5c35' : '#e0dbd3'}`,
        }}
      >
        {isAxis ? '軸' : 'ヒモ'}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  let race: Race | null = null
  let formation: FormationResponse | null = null
  let horses: Horse[] = []
  let raceResults: RaceResult[] = []
  let entries: Entry[] = []
  let errorMessage = ''

  try {
    const raceRes = await fetch(
      `${baseUrl}/rest/v1/races?id=eq.${id}&select=id,race_name,date`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    )
    if (!raceRes.ok) throw new Error(`レース取得失敗: ${raceRes.status}`)
    const raceData = await raceRes.json()
    race = raceData[0] ?? null

    const rpcRes = await fetch(
      `${baseUrl}/rest/v1/rpc/compute_formation_for_race`,
      {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_race_id: id }),
        cache: 'no-store',
      }
    )
    if (!rpcRes.ok) {
      const text = await rpcRes.text()
      throw new Error(`AI予想取得失敗: ${rpcRes.status} / ${text}`)
    }
    formation = await rpcRes.json()

    const horseRes = await fetch(`${baseUrl}/rest/v1/horses?select=id,name,style`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })
    if (!horseRes.ok) throw new Error(`馬名取得失敗: ${horseRes.status}`)
    horses = await horseRes.json()

  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'unknown error'
  }

  // Results and entries fetched separately so formation errors don't block them
  try {
    const [resultsRes, entriesRes] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/race_results?race_id=eq.${id}&select=horse_id,finish_pos`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      }),
      fetch(`${baseUrl}/rest/v1/entries?race_id=eq.${id}&select=horse_id,horse_number`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      }),
    ])
    if (resultsRes.ok) raceResults = await resultsRes.json()
    if (entriesRes.ok) entries = await entriesRes.json()
  } catch {
    // results/entries are optional — page renders without them
  }

  const getHorseName = (horseId: string) =>
    horses.find((h) => h.id === horseId)?.name ?? horseId

  // Compute pace once so it can be shared across ranking, value opportunity, etc.
  const pace = formation ? computePaceOutlook(formation, horses).pace : 'balanced'

  // Axis horses stay in their original AI-determined order.
  // Himo horses are re-sorted by pace adjustment: most favored by current pace comes first.
  const paceAdjustedHimo = [...(formation?.himo_horses ?? [])].sort((a, b) => {
    const styleA = horses.find((h) => h.id === a)?.style ?? null
    const styleB = horses.find((h) => h.id === b)?.style ?? null
    return getPaceAdjustment(styleB, pace) - getPaceAdjustment(styleA, pace)
  })

  const allRankedHorses = [
    ...(formation?.axis_horses ?? []).map((id) => ({ id, role: 'axis' as const })),
    ...paceAdjustedHimo.map((id) => ({ id, role: 'himo' as const })),
  ]

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f5f2ed',
        color: '#1e1b18',
        padding: '32px 20px',
        fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Back link */}
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            color: '#9b9490',
            textDecoration: 'none',
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          ← レース一覧へ戻る
        </a>

        {/* Race header */}
        {race && (
          <div
            style={{
              borderBottom: '2px solid #1a5c35',
              paddingBottom: 16,
              marginBottom: 24,
            }}
          >
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1e1b18', letterSpacing: '0.01em' }}>
              🏇 {race.race_name}
            </h1>
            <p style={{ color: '#9b9490', marginTop: 6, fontSize: 13 }}>
              📅 {race.date.replace(/-/g, '/')}
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: '#fdf2f2',
              border: '1px solid #e8c8c8',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#a83030',
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            エラー: {errorMessage}
          </div>
        )}

        {formation && (() => {
          const pct = Math.min(100, Math.max(0, Math.round(formation.race_structure_score * 100)))

          // Chapter header style
          const chapterHeader = (label: string) => (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '2px solid #e0dbd3',
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: '#3d3a37', letterSpacing: '0.01em' }}>
                {label}
              </span>
            </div>
          )

          // ── Pre-computed shared values ──────────────────────────────────────
          const { betType, himoNames } = getBetPlanInfo(formation, horses, pct)
          const axisDetails = formation.axis_horses.map((id, i) => {
            const horse = horses.find((h) => h.id === id)
            const style = horse?.style ?? null
            return {
              name: horse?.name ?? id,
              styleLabel: style ? STYLE_LABELS[style] : null,
              styleColor: style ? STYLE_COLORS[style] : null,
              aiEval: Math.max(15, Math.round(25 + pct * 0.15 - i * 3)),
              reason: buildAxisReason(style, pace, pct, i),
            }
          })

          const advantageHorses = getPaceAdvantageHorses(formation, horses, pace)
          const valueHorse = getValueOpportunity(formation, horses, pct, pace)
          const aiSummaryLines = buildAiSummary(pct, pace, advantageHorses, valueHorse)
          const level = getLevel(pct)
          const strategy = getStrategy(pct)

          const paceInfo = computePaceOutlook(formation, horses)
          const paceMeta = PACE_INFO[paceInfo.pace]
          const paceCounts: { label: string; count: number; style: RunningStyle }[] = [
            { label: '逃げ', count: paceInfo.frontCount,      style: 'front' },
            { label: '先行', count: paceInfo.stalkerCount,    style: 'stalker' },
            { label: '差し', count: paceInfo.closerCount,     style: 'closer' },
            { label: '追込', count: paceInfo.deepCloserCount, style: 'deep_closer' },
          ]
          const favoredStyles = [...new Set(advantageHorses.map((h) => STYLE_LABELS[h.style]))]

          const edge = Math.round(10 + (100 - pct) * 0.2)
          const betScore = computeBetScore(pct, edge)
          const betLevel = getBetLevel(betScore)

          return (
            <>
              {/* ── Chapter 1: AIの見解 ─────────────────────────────────── */}
              {chapterHeader('🧠 AIの見解')}

              <BetPlanPanel
                betType={betType}
                allHimoNames={himoNames}
                axisCount={formation.axis_count}
                pct={pct}
                axisDetails={axisDetails}
              />

              <div style={{ ...card, background: '#1e1b18' }}>
                <p style={{ ...sectionLabel, color: '#e8e4df', borderBottomColor: '#3a3733' }}>
                  🧠 AIまとめ
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {aiSummaryLines.map((line, i) => (
                    <p key={i} style={{ color: '#c8c2bb', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div style={{ ...card, borderLeft: `3px solid ${level.color}` }}>
                <p style={sectionLabel}>🤖 AI戦略</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 700,
                        background: `${level.color}14`,
                        color: level.color,
                        border: `1px solid ${level.color}44`,
                      }}
                    >
                      {strategy.raceType}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9b9490', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      推奨戦略
                    </span>
                    <span style={{ color: '#1e1b18', fontSize: 14, fontWeight: 600 }}>{strategy.approach}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9b9490', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      AIコメント
                    </span>
                    <span style={{ color: '#5c5650', fontSize: 13, lineHeight: 1.6 }}>{strategy.comment}</span>
                  </div>
                </div>
              </div>

              {/* ── Chapter 2: レース展開 ───────────────────────────────── */}
              {chapterHeader('🏇 レース展開')}

              {/* レース安定性スコア */}
              <div style={card}>
                <p style={sectionLabel}>レース安定性スコア</p>
                <ScoreGauge score={formation.race_structure_score} />
              </div>

              {/* 展開予想 */}
              <div style={{ ...card, borderLeft: `3px solid ${paceMeta.color}` }}>
                <p style={sectionLabel}>🏇 展開予想</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      background: `${paceMeta.color}14`,
                      color: paceMeta.color,
                      border: `1px solid ${paceMeta.color}44`,
                    }}
                  >
                    {paceMeta.label}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {paceCounts.map(({ label, count, style: rs }) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: `${STYLE_COLORS[rs]}10`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          minWidth: 36,
                          border: `1px solid ${STYLE_COLORS[rs]}30`,
                        }}
                      >
                        <span style={{ color: STYLE_COLORS[rs], fontSize: 10, fontWeight: 700 }}>{label}</span>
                        <span style={{ color: '#1e1b18', fontSize: 15, fontWeight: 700 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9b9490', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      展開予想
                    </span>
                    <span style={{ color: '#5c5650', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.explanation}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9b9490', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      AIコメント
                    </span>
                    <span style={{ color: '#5c5650', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.aiComment}</span>
                  </div>
                </div>
              </div>

              {/* 展開有利脚質 */}
              <div style={card}>
                <p style={sectionLabel}>⚡ 展開有利脚質</p>
                {favoredStyles.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {favoredStyles.map((styleLabel) => {
                      const rs = (Object.keys(STYLE_LABELS) as RunningStyle[]).find(
                        (k) => STYLE_LABELS[k] === styleLabel,
                      )
                      const color = rs ? STYLE_COLORS[rs] : '#9b9490'
                      return (
                        <span
                          key={styleLabel}
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            padding: '4px 14px',
                            borderRadius: 9999,
                            background: `${color}14`,
                            color,
                            border: `1px solid ${color}44`,
                          }}
                        >
                          {styleLabel}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: '#9b9490', fontSize: 13 }}>
                    平均ペース想定のため、展開による有利・不利はありません。
                  </p>
                )}
              </div>

              {/* 展開有利馬 */}
              {advantageHorses.length > 0 && (
                <div style={card}>
                  <p style={sectionLabel}>⚡ 展開有利馬</p>
                  <p style={{ color: '#b0aaa4', fontSize: 11, marginBottom: 14 }}>
                    ※ ペース適性による恩恵馬です。総合的な強さとは異なります。
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {advantageHorses.map(({ name, style, comment }) => (
                      <div
                        key={name}
                        style={{
                          background: `${STYLE_COLORS[style]}08`,
                          border: `1px solid ${STYLE_COLORS[style]}28`,
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: STYLE_COLORS[style],
                              color: '#fff',
                              flexShrink: 0,
                            }}
                          >
                            {STYLE_LABELS[style]}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b18' }}>{name}</span>
                        </div>
                        <p style={{ color: '#7a7269', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Chapter 3: 期待値分析 ──────────────────────────────── */}
              {chapterHeader('💎 期待値分析')}

              {/* AI注目の穴馬 */}
              {valueHorse && (
                <div style={card}>
                  <p style={sectionLabel}>💎 AI注目の穴馬</p>
                  <p style={{ color: '#1e1b18', fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
                    {valueHorse.horseName}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#f5f2ed', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ color: '#9b9490', fontSize: 10, marginBottom: 4 }}>AI評価</p>
                      <p style={{ color: '#1e1b18', fontSize: 22, fontWeight: 700 }}>{valueHorse.aiWinProb}%</p>
                    </div>
                    <div style={{ background: '#f5f2ed', borderRadius: 8, padding: '10px 14px' }}>
                      <p style={{ color: '#9b9490', fontSize: 10, marginBottom: 4 }}>想定人気評価</p>
                      <p style={{ color: '#9b9490', fontSize: 22, fontWeight: 700 }}>{valueHorse.marketProb}%</p>
                    </div>
                  </div>
                  <div
                    style={{
                      background: `${level.color}0d`,
                      border: `1px solid ${level.color}30`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ color: '#7a7269', fontSize: 12, marginBottom: 2 }}>AIはこの馬を</p>
                    <p style={{ color: level.color, fontSize: 15, fontWeight: 800 }}>
                      人気より +{valueHorse.edge}% 高く評価しています
                    </p>
                  </div>
                  <p style={{ color: '#7a7269', fontSize: 12, lineHeight: 1.7 }}>{valueHorse.reason}</p>
                </div>
              )}

              {/* 買いチャンス */}
              <div style={{ ...card, borderLeft: `3px solid ${betLevel.color}` }}>
                <p style={sectionLabel}>🎯 買いチャンス</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 7 }}>
                      <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: betLevel.color }}>
                        {betScore}
                      </span>
                      <span style={{ color: '#9b9490', marginBottom: 6, fontSize: 15 }}> / 100</span>
                    </div>
                    <div
                      style={{
                        background: '#ede9e3',
                        borderRadius: 9999,
                        height: 6,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{ width: `${betScore}%`, height: '100%', background: betLevel.color, borderRadius: 9999 }}
                      />
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${betLevel.color}14`,
                        color: betLevel.color,
                        border: `1px solid ${betLevel.color}44`,
                      }}
                    >
                      {betLevel.label}
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#5c5650',
                      fontSize: 13,
                      lineHeight: 1.7,
                      flex: 1,
                      minWidth: 180,
                      borderLeft: `2px solid ${betLevel.color}33`,
                      paddingLeft: 16,
                    }}
                  >
                    {betLevel.comment}
                  </p>
                </div>
              </div>

              {/* 馬ランキング */}
              <div style={card}>
                <p style={sectionLabel}>馬ランキング</p>
                {allRankedHorses.map(({ id: horseId, role }, index) => {
                  const horse = horses.find((h) => h.id === horseId)
                  const adj = getPaceAdjustment(horse?.style ?? null, pace)
                  const paceTag = adj > 0 ? 'up' : adj < 0 ? 'down' : null
                  const styleTag = horse?.style
                    ? { label: STYLE_LABELS[horse.style], color: STYLE_COLORS[horse.style] }
                    : null
                  return (
                    <HorseRow
                      key={horseId}
                      rank={index + 1}
                      name={getHorseName(horseId)}
                      role={role}
                      paceTag={paceTag}
                      styleTag={styleTag}
                    />
                  )
                })}
              </div>
            </>
          )
        })()}

        {/* ── 🏁 レース結果 ──────────────────────────────────────────── */}
        {raceResults.length > 0 && (() => {
          const sorted = [...raceResults].sort((a, b) => a.finish_pos - b.finish_pos)
          return (
            <div style={{ ...card, marginTop: 8 }}>
              <p
                style={{
                  color: '#3d3a37',
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                  paddingBottom: 10,
                  borderBottom: '1px solid #ede9e3',
                }}
              >
                🏁 レース結果
              </p>

              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 44px 1fr 56px 64px',
                  gap: 4,
                  paddingBottom: 8,
                  borderBottom: '1px solid #ede9e3',
                  marginBottom: 4,
                }}
              >
                {['着順', '馬番', '馬名', 'AI順位', ''].map((h) => (
                  <span key={h} style={{ color: '#9b9490', fontSize: 10, fontWeight: 700 }}>{h}</span>
                ))}
              </div>

              {sorted.map(({ horse_id, finish_pos }) => {
                const name = horses.find((h) => h.id === horse_id)?.name ?? horse_id
                const horseNumber = entries.find((e) => e.horse_id === horse_id)?.horse_number ?? null
                const aiRank = allRankedHorses.findIndex((h) => h.id === horse_id) + 1
                const aiRankDisplay = aiRank > 0 ? `${aiRank}位` : '—'

                let hint: { label: string; color: string; bg: string } | null = null
                if (aiRank > 0 && aiRank <= 3 && finish_pos <= 3) {
                  hint = { label: 'AI上位', color: '#1a6e3f', bg: '#e6f4ec' }
                } else if (aiRank > 0 && aiRank <= 3 && finish_pos > 3) {
                  hint = { label: '惜しい', color: '#a05020', bg: '#fdf0e6' }
                } else if ((aiRank === 0 || aiRank > 3) && finish_pos <= 3) {
                  hint = { label: '想定外', color: '#a83030', bg: '#fdf2f2' }
                }

                const isTop3 = finish_pos <= 3

                return (
                  <div
                    key={horse_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 44px 1fr 56px 64px',
                      gap: 4,
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f5f2ed',
                      background: isTop3 ? 'rgba(26,92,53,0.03)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 800 : 400,
                        color: isTop3 ? '#1a5c35' : '#5c5650',
                      }}
                    >
                      {finish_pos}着
                    </span>
                    <span style={{ fontSize: 13, color: '#9b9490' }}>
                      {horseNumber !== null ? `${horseNumber}番` : '—'}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 700 : 400,
                        color: '#1e1b18',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: '#9b9490' }}>{aiRankDisplay}</span>
                    <span>
                      {hint && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 9999,
                            background: hint.bg,
                            color: hint.color,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {hint.label}
                        </span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </main>
  )
}

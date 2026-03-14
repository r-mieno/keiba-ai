import BetPlanPanel from './BetPlanPanel'
import { Brain, TrendingUp, Gem, ChevronLeft } from 'lucide-react'

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
  { min: 81, max: 100, color: '#6EE7B7', label: '非常に安定' },
  { min: 61, max: 80,  color: '#34D399', label: '安定' },
  { min: 41, max: 60,  color: '#FCD34D', label: 'バランス型' },
  { min: 21, max: 40,  color: '#FB923C', label: '荒れやすい' },
  { min: 0,  max: 20,  color: '#F87171', label: '非常に荒れやすい' },
]

const STRATEGIES = [
  {
    min: 81, max: 100,
    raceType: '非常に安定',
    approach: '軸馬を絞って堅く買う',
    comment: '実力馬がそのまま結果に直結しやすい。上位人気を中心に組み立てるのが有効。',
  },
  {
    min: 61, max: 80,
    raceType: '安定',
    approach: '軸馬重視のフォーメーション',
    comment: '波乱は少なめ。人気馬を軸に、ヒモは手広く押さえる程度でよい。',
  },
  {
    min: 41, max: 60,
    raceType: 'バランス型',
    approach: '軸・ヒモともにバランスよく選ぶ',
    comment: '実力と紛れが混在する。人気馬と中穴を組み合わせた買い方が有効。',
  },
  {
    min: 21, max: 40,
    raceType: '荒れやすい',
    approach: 'ヒモを広めに取る',
    comment: '人気馬の信頼度がやや低い。中穴・大穴の馬も視野に入れて買い目を広げよう。',
  },
  {
    min: 0,  max: 20,
    raceType: '非常に荒れやすい',
    approach: '大穴狙いも視野に入れる',
    comment: '実力通りに決まりにくいレース。思い切って人気薄を軸にした買い方も一考。',
  },
]

const BET_LEVELS = [
  {
    min: 81, max: 100,
    color: '#6EE7B7',
    label: '強く買い',
    comment: 'AIのエッジが高く、レース構造も明確。積極的に狙える局面。',
  },
  {
    min: 61, max: 80,
    color: '#34D399',
    label: '買い候補',
    comment: 'AIが優位性を見出しており、レースも十分読みやすい。バランスの取れた賭け機会。',
  },
  {
    min: 41, max: 60,
    color: '#FCD34D',
    label: '検討',
    comment: '一定の価値はあるが、慎重な判断を要する。買い目を絞った参加が賢明。',
  },
  {
    min: 21, max: 40,
    color: '#FB923C',
    label: '様子見',
    comment: 'AIのエッジは存在するが、レースの読みづらさがリスクを高めている。少額での参加を推奨。',
  },
  {
    min: 0,  max: 20,
    color: '#F87171',
    label: '見送り',
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
    color: '#F87171',
    explanation: '先行馬が複数いるため、序盤からペースが上がりやすい展開。',
    aiComment: '差し・追い込み馬にとってチャンスが生まれやすい。先行馬の消耗が鍵になる。',
  },
  slow: {
    label: 'スローペース',
    color: '#60A5FA',
    explanation: '先行馬が少なく、前半はゆったりとした流れになる可能性が高い。',
    aiComment: '先行・番手馬が楽に前を取れる展開。差し馬は早めのポジション取りが重要になる。',
  },
  balanced: {
    label: '平均ペース',
    color: '#34D399',
    explanation: '先行馬と追い込み馬のバランスが取れており、平均的な流れが予想される。',
    aiComment: '番手・差し馬ともに好機が生まれやすい。展開の読みに幅を持たせた買い方が有効。',
  },
}

function computePaceOutlook(
  raceHorseIds: string[],
  horses: Horse[],
): { pace: PaceType; frontCount: number; stalkerCount: number; closerCount: number; deepCloserCount: number } {
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
  front: '#F87171',        // 逃げ — red
  stalker: '#FB923C',      // 先行 — orange
  closer: '#60A5FA',       // 差し — blue
  deep_closer: '#A78BFA',  // 追込 — purple
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
  raceHorseIds: string[],
  horses: Horse[],
  pace: PaceType,
): { name: string; style: RunningStyle; comment: string }[] {
  if (pace === 'balanced') return []
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
  const betType = '三連複フォーメーション'
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
    if (pct >= 61) {
      lines.push('展開の有利・不利は少なく、実力通りの結果になりやすい。')
    } else if (pct >= 41) {
      lines.push('展開の有利・不利は少なめだが、波乱の可能性も残る。')
    } else {
      lines.push('波乱含みのレースで、ヒモを広めに取りたい。')
    }
  }

  // Line 3: value horse
  if (valueHorse) {
    lines.push(`${valueHorse.horseName} が人気より +${valueHorse.edge}% 高評価の穴候補。`)
  }

  return lines
}

// ─── Score legend ─────────────────────────────────────────────────────────────

const LEGEND = [
  { range: '81–100', color: '#6EE7B7', label: '非常に安定' },
  { range: '61–80',  color: '#34D399', label: '安定' },
  { range: '41–60',  color: '#FCD34D', label: 'バランス型' },
  { range: '21–40',  color: '#FB923C', label: '荒れやすい' },
  { range: '0–20',   color: '#F87171', label: '非常に荒れやすい' },
]

// ─── Shared card style ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#141416',
  borderRadius: 8,
  padding: '20px 20px',
  border: '1px solid rgba(255,255,255,0.07)',
  marginBottom: 10,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#7A7A84',
  marginBottom: 14,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

// ─── ScoreGauge component ─────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)))
  const level = getLevel(pct)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 14 }}>
        <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: level.color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
          {pct}
        </span>
        <span style={{ color: '#b0aaa4', fontSize: 16, fontWeight: 500 }}>/100</span>
        <span style={{
          marginLeft: 10,
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 4,
          background: `${level.color}14`,
          color: level.color,
          border: `1px solid ${level.color}33`,
          letterSpacing: '0.04em',
        }}>
          {level.label.replace(/^[^\s]+ /, '')}
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 2, height: 4, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: level.color, borderRadius: 2 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {LEGEND.map(({ range, color, label }) => (
          <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: 1, background: color, flexShrink: 0 }} />
            <span style={{ color: '#9b9490', fontSize: 10, width: 44 }}>{range}</span>
            <span style={{ color: '#b0aaa4', fontSize: 10 }}>{label}</span>
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
        padding: isAxis ? '11px 14px' : '9px 14px',
        borderRadius: 6,
        background: isAxis ? 'rgba(99,102,241,0.08)' : 'transparent',
        borderLeft: `3px solid ${isAxis ? '#6366F1' : 'rgba(255,255,255,0.07)'}`,
        marginBottom: 4,
      }}
    >
      {/* Rank number */}
      <span
        style={{
          width: isAxis ? 28 : 22,
          height: isAxis ? 28 : 22,
          borderRadius: isAxis ? 6 : '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isAxis ? 13 : 10,
          fontWeight: 800,
          flexShrink: 0,
          background: isAxis ? '#6366F1' : 'rgba(255,255,255,0.07)',
          color: isAxis ? '#fff' : '#7A7A84',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rank}
      </span>

      {/* Horse name */}
      <span
        style={{
          flex: 1,
          fontWeight: isAxis ? 700 : 500,
          fontSize: isAxis ? 15 : 13,
          color: isAxis ? '#E8E8EA' : '#B0B0B8',
          letterSpacing: isAxis ? '0.01em' : 0,
        }}
      >
        {name}
      </span>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {styleTag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 4,
              background: `${styleTag.color}14`,
              color: styleTag.color,
              border: `1px solid ${styleTag.color}38`,
              letterSpacing: '0.02em',
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
              padding: '2px 7px',
              borderRadius: 4,
              background: paceTag === 'up' ? '#e6f4ec' : '#fdf2f2',
              color: paceTag === 'up' ? '#1a6e3f' : '#a83030',
              border: `1px solid ${paceTag === 'up' ? '#b8dfc8' : '#e8c8c8'}`,
            }}
          >
            {paceTag === 'up' ? '↑' : '↓'}ペース
          </span>
        )}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 4,
            background: isAxis ? '#6366F1' : 'transparent',
            color: isAxis ? '#fff' : '#7A7A84',
            border: `1px solid ${isAxis ? '#6366F1' : 'rgba(255,255,255,0.1)'}`,
            letterSpacing: '0.04em',
          }}
        >
          {isAxis ? '軸' : 'ヒモ'}
        </span>
      </div>
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

    const horseRes = await fetch(`${baseUrl}/rest/v1/horses?select=id,name`, {
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

    // Fetch running style from horse_style_profiles and merge into horses array
    const raceHorseIdList = entries.map((e) => e.horse_id)
    if (raceHorseIdList.length > 0) {
      const styleRes = await fetch(
        `${baseUrl}/rest/v1/horse_style_profiles?horse_id=in.(${raceHorseIdList.join(',')})&select=horse_id,style`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
      )
      if (styleRes.ok) {
        const profiles: { horse_id: string; style: RunningStyle }[] = await styleRes.json()
        const styleMap = new Map(profiles.map((p) => [p.horse_id, p.style]))
        horses = horses.map((h) => ({ ...h, style: styleMap.get(h.id) ?? null }))
      }
    }
  } catch {
    // results/entries are optional — page renders without them
  }

  const getHorseName = (horseId: string) =>
    horses.find((h) => h.id === horseId)?.name ?? horseId

  // Full race field: use all entered horses for pace calculation.
  // Fall back to formation horses only when entries haven't loaded.
  const raceHorseIds = entries.length > 0
    ? entries.map((e) => e.horse_id)
    : [...(formation?.axis_horses ?? []), ...(formation?.himo_horses ?? [])]

  // Compute pace once so it can be shared across ranking, value opportunity, etc.
  const pace = formation ? computePaceOutlook(raceHorseIds, horses).pace : 'balanced'

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
        background: '#0C0C0E',
        color: '#E8E8EA',
        fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
      }}
    >
      {/* ── Hero header ───────────────────────────────────────────────── */}
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <a href="/" className="back-link">
          <ChevronLeft size={14} strokeWidth={2} />
          レース一覧
        </a>
        {race && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: '#B0B0B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {race.race_name}
            </span>
          </>
        )}
      </div>

      {/* ── Race hero ────────────────────────────────────────────────── */}
      {race && (
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '32px 20px 28px',
          maxWidth: 720,
          margin: '0 auto',
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#6366F1',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Race Analysis
          </p>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: '#E8E8EA',
            letterSpacing: '-0.02em',
          }}>
            {race.race_name}
          </h1>
          <p style={{ color: '#7A7A84', marginTop: 6, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {race.date.replace(/-/g, '/')}
          </p>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>

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

        {formation && (() => {
          const pct = Math.min(100, Math.max(0, Math.round(formation.race_structure_score * 100)))

          // Chapter header style
          const CHAPTER_ICONS: Record<string, React.ReactNode> = {
            'AIの見解':   <Brain size={15} color="#818CF8" strokeWidth={2} />,
            'レース展開': <TrendingUp size={15} color="#818CF8" strokeWidth={2} />,
            '期待値分析': <Gem size={15} color="#818CF8" strokeWidth={2} />,
          }
          const chapterHeader = (label: string) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, marginBottom: 16 }}>
              {CHAPTER_ICONS[label] && (
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {CHAPTER_ICONS[label]}
                </span>
              )}
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F2', letterSpacing: '-0.02em' }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
          )

          // ── Pre-computed shared values ──────────────────────────────────────
          const { betType } = getBetPlanInfo(formation, horses, pct)
          const himoHorses = formation.himo_horses.map((hid) => ({
            name: horses.find((h) => h.id === hid)?.name ?? hid,
            number: entries.find((e) => e.horse_id === hid)?.horse_number ?? null,
          }))
          const axisDetails = formation.axis_horses.map((id, i) => {
            const horse = horses.find((h) => h.id === id)
            const style = horse?.style ?? null
            return {
              name: horse?.name ?? id,
              horseNumber: entries.find((e) => e.horse_id === id)?.horse_number ?? null,
              styleLabel: style ? STYLE_LABELS[style] : null,
              styleColor: style ? STYLE_COLORS[style] : null,
              aiEval: Math.max(15, Math.round(25 + pct * 0.15 - i * 3)),
              reason: buildAxisReason(style, pace, pct, i),
            }
          })

          const advantageHorses = getPaceAdvantageHorses(raceHorseIds, horses, pace)
          const valueHorse = getValueOpportunity(formation, horses, pct, pace)
          const aiSummaryLines = buildAiSummary(pct, pace, advantageHorses, valueHorse)
          const level = getLevel(pct)
          const strategy = getStrategy(pct)

          const paceInfo = computePaceOutlook(raceHorseIds, horses)
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
              {chapterHeader('AIの見解')}

              <BetPlanPanel
                betType={betType}
                allHimoHorses={himoHorses}
                axisCount={formation.axis_count}
                pct={pct}
                axisDetails={axisDetails}
              />

              <div style={{ ...card, background: '#0A0A0C', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p style={{ ...sectionLabel, color: '#7A7A84', borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  AIまとめ
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {aiSummaryLines.map((line, i) => (
                    <p key={i} style={{ color: '#B0B0B8', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              <div style={card}>
                <p style={sectionLabel}>AI戦略</p>
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
                    <span style={{ color: '#7A7A84', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      推奨戦略
                    </span>
                    <span style={{ color: '#E8E8EA', fontSize: 14, fontWeight: 600 }}>{strategy.approach}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#7A7A84', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      AIコメント
                    </span>
                    <span style={{ color: '#B0B0B8', fontSize: 13, lineHeight: 1.6 }}>{strategy.comment}</span>
                  </div>
                </div>
              </div>

              {/* ── Chapter 2: レース展開 ───────────────────────────────── */}
              {chapterHeader('レース展開')}

              {/* レース安定性スコア */}
              <div style={card}>
                <p style={sectionLabel}>レース安定性スコア</p>
                <ScoreGauge score={formation.race_structure_score} />
              </div>


              {/* 展開予想 */}
              <div style={card}>
                <p style={sectionLabel}>展開予想</p>
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
                        <span style={{ color: '#E8E8EA', fontSize: 15, fontWeight: 700 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#7A7A84', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      展開予想
                    </span>
                    <span style={{ color: '#B0B0B8', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.explanation}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#7A7A84', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      AIコメント
                    </span>
                    <span style={{ color: '#B0B0B8', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.aiComment}</span>
                  </div>
                </div>
              </div>

              {/* 展開有利脚質 */}
              <div style={card}>
                <p style={sectionLabel}>展開有利脚質</p>
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
                  <p style={sectionLabel}>展開有利馬</p>
                  <p style={{ color: '#7A7A84', fontSize: 11, marginBottom: 14 }}>
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
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#E8E8EA' }}>{name}</span>
                        </div>
                        <p style={{ color: '#B0B0B8', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Chapter 3: 期待値分析 ──────────────────────────────── */}
              {chapterHeader('期待値分析')}

              {/* AI注目の穴馬 */}
              {valueHorse && (
                <div style={card}>
                  <p style={sectionLabel}>AI注目の穴馬</p>
                  <p style={{ color: '#E8E8EA', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
                    {valueHorse.horseName}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ color: '#7A7A84', fontSize: 10, marginBottom: 4 }}>AI評価</p>
                      <p style={{ color: '#E8E8EA', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{valueHorse.aiWinProb}%</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ color: '#7A7A84', fontSize: 10, marginBottom: 4 }}>想定人気評価</p>
                      <p style={{ color: '#7A7A84', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{valueHorse.marketProb}%</p>
                    </div>
                  </div>
                  <div
                    style={{
                      background: `${level.color}10`,
                      border: `1px solid ${level.color}25`,
                      borderRadius: 6,
                      padding: '10px 14px',
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ color: '#7A7A84', fontSize: 11, marginBottom: 2 }}>AIはこの馬を</p>
                    <p style={{ color: level.color, fontSize: 14, fontWeight: 700 }}>
                      人気より +{valueHorse.edge}% 高く評価しています
                    </p>
                  </div>
                  <p style={{ color: '#B0B0B8', fontSize: 12, lineHeight: 1.7 }}>{valueHorse.reason}</p>
                </div>
              )}

              {/* 買いチャンス */}
              <div style={card}>
                <p style={sectionLabel}>買いチャンス</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 7 }}>
                      <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: betLevel.color }}>
                        {betScore}
                      </span>
                      <span style={{ color: '#7A7A84', marginBottom: 6, fontSize: 15 }}>/100</span>
                    </div>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: 2,
                        height: 4,
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
                      color: '#B0B0B8',
                      fontSize: 13,
                      lineHeight: 1.7,
                      flex: 1,
                      minWidth: 180,
                      paddingLeft: 0,
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
              <p style={{ ...sectionLabel }}>レース結果</p>

              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 44px 1fr 56px 64px',
                  gap: 4,
                  paddingBottom: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 4,
                }}
              >
                {['着順', '馬番', '馬名', 'AI順位', ''].map((h) => (
                  <span key={h} style={{ color: '#7A7A84', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>

              {sorted.map(({ horse_id, finish_pos }) => {
                const name = horses.find((h) => h.id === horse_id)?.name ?? horse_id
                const horseNumber = entries.find((e) => e.horse_id === horse_id)?.horse_number ?? null
                const aiRank = allRankedHorses.findIndex((h) => h.id === horse_id) + 1
                const aiRankDisplay = aiRank > 0 ? `${aiRank}位` : '—'

                let hint: { label: string; color: string; bg: string } | null = null
                if (aiRank > 0 && aiRank <= 3 && finish_pos <= 3) {
                  hint = { label: 'AI上位', color: '#34D399', bg: 'rgba(52,211,153,0.1)' }
                } else if (finish_pos <= 3 && (aiRank === 0 || aiRank > 3)) {
                  hint = { label: '想定外', color: '#F87171', bg: 'rgba(248,113,113,0.1)' }
                } else if (aiRank > 0 && Math.abs(aiRank - finish_pos) <= 1) {
                  hint = { label: '惜しい', color: '#FB923C', bg: 'rgba(251,146,60,0.1)' }
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
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isTop3 ? 'rgba(99,102,241,0.04)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 700 : 400,
                        color: isTop3 ? '#818CF8' : '#7A7A84',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {finish_pos}着
                    </span>
                    <span style={{ fontSize: 13, color: '#7A7A84', fontVariantNumeric: 'tabular-nums' }}>
                      {horseNumber !== null ? `${horseNumber}番` : '—'}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 600 : 400,
                        color: isTop3 ? '#E8E8EA' : '#B0B0B8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: '#7A7A84', fontVariantNumeric: 'tabular-nums' }}>{aiRankDisplay}</span>
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

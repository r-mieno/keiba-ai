import BetPlanPanel from './BetPlanPanel'
import PicksPanel from './PicksPanel'
import { createClient } from '@/lib/supabase-server'
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
  venue?: string | null
  grade?: string | null
  surface?: string | null
  distance_m?: number | null
  start_time?: string | null
  is_test?: boolean | null
  pace_override?: string | null
  description?: string | null
}

type RunningStyle = 'front' | 'stalker' | 'closer' | 'deep_closer'

type Horse = {
  id: string
  name: string
  style: RunningStyle | null
  father_line: string | null
  damsire_line: string | null
}

type RaceResult = {
  horse_id: string
  finish_pos: number
}

type Entry = {
  horse_id: string
  horse_number: number | null
  popularity_rank: number | null
  jockey_name: string | null
  last3f_1: number | null
  last3f_2: number | null
  last3f_3: number | null
  finish_position: number | null
  weight_kg: number | null
}

type JockeyStat = {
  jockey_name: string
  place3_rate: number
}

type HorseFormRecord = {
  horse_id: string
  finish_pos: number
  grade: string | null
  field_size: number
  distance_m: number | null
}

// ─── 騎手スコアマスタ（複勝圏能力の初期仮説値 0〜1）──────────────────────────
// 0.60 をデフォルト値として、上位騎手を上乗せする運用。
// 更新時はここだけを修正する。
// 騎手名が未登録の場合のデフォルトスコア（JRA全体の平均3着内率付近）
const JOCKEY_DEFAULT_SCORE = 0.25

// DB上の表記 → JOCKEY_PLACE_SCORE のキーへのエイリアスマッピング
// 同姓が多い日本人騎手を誤マッチしないよう、フルネームで明示的にマップする

// ─── Score level data ────────────────────────────────────────────────────────

const SCORE_LEVELS = [
  { min: 81, max: 100, color: '#6EE7B7', label: '非常に安定' },
  { min: 61, max: 80,  color: '#166534', label: '安定' },
  { min: 41, max: 60,  color: '#FCD34D', label: 'バランス型' },
  { min: 21, max: 40,  color: '#FB923C', label: '荒れやすい' },
  { min: 0,  max: 20,  color: '#DC2626', label: '非常に荒れやすい' },
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
    color: '#166534',
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
    color: '#DC2626',
    label: '見送り',
    comment: '現時点では賭けのメリットが薄い。見送りも十分な選択肢。',
  },
]

// ─── Pace outlook data ────────────────────────────────────────────────────────

type PaceType = 'fast' | 'balanced' | 'slow'

const PACE_INFO: Record<PaceType, { label: string; color: string; explanation: string; aiComment: string }> = {
  fast: {
    label: 'ハイペース',
    color: '#DC2626',
    explanation: '先行馬が複数いるため、序盤からペースが上がりやすい展開。',
    aiComment: '差し・追い込み馬にとってチャンスが生まれやすい。先行馬の消耗が鍵になる。',
  },
  slow: {
    label: 'スローペース',
    color: '#2563EB',
    explanation: '先行馬が少なく、前半はゆったりとした流れになる可能性が高い。',
    aiComment: '先行・番手馬が楽に前を取れる展開。差し馬は早めのポジション取りが重要になる。',
  },
  balanced: {
    label: '平均ペース',
    color: '#166534',
    explanation: '先行馬と追い込み馬のバランスが取れており、平均的な流れが予想される。',
    aiComment: '番手・差し馬ともに好機が生まれやすい。展開の読みに幅を持たせた買い方が有効。',
  },
}

function computePaceOutlook(
  raceHorseIds: string[],
  horses: Horse[],
  distanceM: number | null = null,
): { pace: PaceType; frontCount: number; stalkerCount: number; closerCount: number; deepCloserCount: number } {
  const raceHorses = raceHorseIds.map((hid) => horses.find((h) => h.id === hid)).filter(Boolean) as Horse[]
  const frontCount = raceHorses.filter((h) => h.style === 'front').length
  const stalkerCount = raceHorses.filter((h) => h.style === 'stalker').length
  const closerCount = raceHorses.filter((h) => h.style === 'closer').length
  const deepCloserCount = raceHorses.filter((h) => h.style === 'deep_closer').length
  let pace: PaceType
  const d = distanceM ?? 0
  if (d <= 1400) {
    // スプリント〜短距離：逃げ2頭でfast（従来通り）
    if (frontCount >= 2) pace = 'fast'
    else if (frontCount === 1 && stalkerCount <= 2) pace = 'slow'
    else pace = 'balanced'
  } else if (d <= 1999) {
    // マイル〜中距離前半（1401〜1999m）
    // 逃げ5頭以上：お見合いが起きやすくbalanced（多すぎる逃げ馬は互いに控える）
    // 逃げ3〜4頭：fast
    // 逃げ2頭：balanced
    // 逃げ1頭・先行少：slow
    if (frontCount >= 5) pace = 'balanced'
    else if (frontCount >= 3) pace = 'fast'
    else if (frontCount >= 2) pace = 'balanced'
    else if (frontCount === 1 && stalkerCount <= 2) pace = 'slow'
    else pace = 'balanced'
  } else {
    // 長距離（2000m〜）：逃げが多くてもbalancedまで、1頭以下はslow
    if (frontCount >= 2) pace = 'balanced'
    else if (frontCount === 1 && stalkerCount <= 2) pace = 'slow'
    else pace = 'slow'
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
  front: '#DC2626',        // 逃げ — red
  stalker: '#C2410C',      // 先行 — orange
  closer: '#2563EB',       // 差し — blue
  deep_closer: '#6D28D9',  // 追込 — purple
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

function getDistanceFitScore(style: RunningStyle | null, distanceM: number | null): number {
  if (!style || !distanceM) return 0.5
  if (distanceM <= 1400) {
    if (style === 'front') return 0.85
    if (style === 'stalker') return 0.70
    if (style === 'closer') return 0.45
    if (style === 'deep_closer') return 0.30
  } else if (distanceM <= 1800) {
    if (style === 'front') return 0.60
    if (style === 'stalker') return 0.75
    if (style === 'closer') return 0.65
    if (style === 'deep_closer') return 0.50
  } else if (distanceM <= 2200) {
    if (style === 'front') return 0.50
    if (style === 'stalker') return 0.65
    if (style === 'closer') return 0.75
    if (style === 'deep_closer') return 0.60
  } else {
    if (style === 'front') return 0.35
    if (style === 'stalker') return 0.55
    if (style === 'closer') return 0.80
    if (style === 'deep_closer') return 0.85
  }
  return 0.5
}

// コース×脚質補正（ヒモスコアへの加算値）
// 小回りコース（直線短い）→ 追い込み不利、逃げ有利
// 広いコース（直線長い）→ 追い込みやや有利
// ※阪神は距離で内/外回りを判定（1800m以下=内回り的、2000m以上=外回り的）
function getVenueStyleAdjustment(venue: string | null | undefined, style: RunningStyle | null, distanceM: number | null): number {
  if (!venue || !style) return 0
  const isTight =
    venue.includes('中山') ||
    venue.includes('福島') ||
    venue.includes('函館') ||
    venue.includes('札幌') ||
    (venue.includes('阪神') && (distanceM ?? 9999) <= 1800)
  const isWide =
    venue.includes('東京') ||
    venue.includes('京都') ||
    (venue.includes('阪神') && (distanceM ?? 0) >= 2000)

  if (isTight) {
    if (style === 'deep_closer') return -0.04
    if (style === 'closer')      return -0.02
    if (style === 'front')       return +0.02
  }
  if (isWide) {
    if (style === 'deep_closer') return +0.03
    if (style === 'closer')      return +0.02
    if (style === 'front')       return -0.02
  }
  return 0
}

// ─── 血統スコア ────────────────────────────────────────────────────────────────
// 父系統・母父系統の距離適性をスコア化し、小さいボーナスとして加算する（ロマン枠）
// 父6割・母父4割で合成し、黄金配合クロスにはさらにボーナスを乗せる
// 影響は venueAdj 程度（±0.05以内）に抑える

const BLOODLINE_DIST_FIT: Record<string, { sprint: number; mile: number; middle: number; long: number }> = {
  sunday:         { sprint: 0.55, mile: 0.65, middle: 0.80, long: 0.65 }, // 日本芝中距離の王道
  mrprospector:   { sprint: 0.70, mile: 0.75, middle: 0.65, long: 0.40 }, // スピード型・マイル
  roberto:        { sprint: 0.40, mile: 0.55, middle: 0.65, long: 0.80 }, // タフネス・長距離
  northerndancer: { sprint: 0.40, mile: 0.55, middle: 0.65, long: 0.80 }, // スタミナ・欧州型
  nasrullah:      { sprint: 0.80, mile: 0.65, middle: 0.50, long: 0.35 }, // スピード特化・短距離
  other:          { sprint: 0.50, mile: 0.50, middle: 0.50, long: 0.50 },
}

const CROSS_BONUS: Record<string, number> = {
  'sunday×mrprospector':   0.04, // 日本の黄金配合
  'mrprospector×sunday':   0.04,
  'sunday×northerndancer': 0.03,
  'northerndancer×sunday': 0.03,
  'sunday×roberto':        0.02,
  'roberto×sunday':        0.02,
}

function getBloodlineFitBonus(
  father_line: string | null,
  damsire_line: string | null,
  distanceM: number | null,
): number {
  const bucket = !distanceM ? 'middle'
    : distanceM <= 1400 ? 'sprint'
    : distanceM <= 1800 ? 'mile'
    : distanceM <= 2200 ? 'middle'
    : 'long'

  const fKey = father_line?.toLowerCase().replace(/[\s-]/g, '') ?? 'other'
  const dKey = damsire_line?.toLowerCase().replace(/[\s-]/g, '') ?? 'other'

  const fFit = (BLOODLINE_DIST_FIT[fKey] ?? BLOODLINE_DIST_FIT.other)[bucket]
  const dFit = (BLOODLINE_DIST_FIT[dKey] ?? BLOODLINE_DIST_FIT.other)[bucket]
  const combined = fFit * 0.6 + dFit * 0.4  // 父の影響6割・母父4割

  const crossKey = `${fKey}×${dKey}`
  const crossBonus = CROSS_BONUS[crossKey] ?? 0

  return (combined - 0.5) * 0.12 + crossBonus  // -0.036〜+0.054 + crossBonus
}

// 斤量補正（基準57kg。超過分はペナルティ、軽減分は小ボーナス）
// 57kg超: -0.015/kg、57kg未満: +0.008/kg
function getWeightAdjustment(weightKg: number | null): number {
  if (weightKg == null) return 0
  const diff = weightKg - 57
  return diff > 0 ? diff * -0.015 : diff * -0.008
}

// ── 脚質多様性ルール（2026-03-30以降のレースに適用） ─────────────────────────
// 同じ脚質は最大2頭まで。ただし除外馬のスコアが選出最低馬より0.05以上高ければ救済採用。
const DIVERSITY_RULE_START_DATE = '2026-03-30'

function selectHimoDiverse(
  sorted: { id: string; score: number }[],
  count: number,
  getStyle: (id: string) => string | null,
): string[] {
  const RESCUE_THRESHOLD = 0.05
  const styleCount: Record<string, number> = {}
  const selected: { id: string; score: number }[] = []

  // Step1: 多様性ルールで選出
  for (const c of sorted) {
    if (selected.length >= count) break
    const style = getStyle(c.id) ?? '_unknown'
    if ((styleCount[style] ?? 0) < 2) {
      selected.push(c)
      styleCount[style] = (styleCount[style] ?? 0) + 1
    }
  }

  // 頭数不足時は脚質制約なしで補充（頭数が少ないレース対応）
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((s) => s.id))
    for (const c of sorted) {
      if (selected.length >= count) break
      if (!selectedIds.has(c.id)) { selected.push(c); selectedIds.add(c.id) }
    }
  }

  // Step2: 救済チェック（除外馬が選出最低スコアを0.05以上上回る場合は入れ替え）
  if (selected.length === 0) return []
  const selectedIds = new Set(selected.map((s) => s.id))
  const minEntry = selected.reduce((a, b) => a.score < b.score ? a : b)
  for (const c of sorted) {
    if (selectedIds.has(c.id)) continue
    if (c.score < minEntry.score) break  // ソート済みなのでここで打ち切り
    if (c.score - minEntry.score >= RESCUE_THRESHOLD) {
      const idx = selected.findIndex((s) => s.id === minEntry.id)
      selected[idx] = c
      break
    }
  }

  return selected.map((s) => s.id)
}

// 過去の重賞実績から地力スコアを算出（グレード重み付き相対着順の平均）
// データなし = 0（加算なし）、1着続き ≈ +0.08、最下位続き ≈ -0.08
function getGroundStrengthScore(
  horseId: string,
  formRecords: HorseFormRecord[],
  targetDistanceM: number | null = null,
): number {
  const records = formRecords.filter((r) => r.horse_id === horseId)
  if (records.length === 0) return 0
  const gradeWeight = (grade: string | null) =>
    grade === 'G1' ? 1.5 : grade === 'G2' ? 1.2 : grade === 'G3' ? 1.0 : 0.8
  const distanceWeight = (dm: number | null) => {
    if (!dm || !targetDistanceM) return 1.0
    const diff = Math.abs(dm - targetDistanceM)
    if (diff <= 200) return 1.5
    if (diff <= 400) return 1.0
    return 0.5
  }
  let weightedSum = 0
  let totalWeight = 0
  for (const r of records) {
    const w = gradeWeight(r.grade) * distanceWeight(r.distance_m)
    weightedSum += (r.finish_pos / r.field_size) * w
    totalWeight += w
  }
  if (totalWeight === 0) return 0
  // サンプル数が少ないほど信頼性が低いため0に近づける（1件→×0.4 / 2件→×0.7 / 3件以上→×1.0）
  const confidence = records.length === 1 ? 0.4 : records.length === 2 ? 0.7 : 1.0
  // avgRelativePos: 0.0(1着/全頭) → +0.08、0.5(中位) → 0、1.0(最下位) → -0.08
  return (0.5 - weightedSum / totalWeight) * 0.16 * confidence
}

// 直近3走の上がり3ハロンから末脚スコアを算出（1走前を重視した加重平均）
// 33.0 = 1.0（最高）、36.5 = 0.0（最低）、データなし = 0.5（中立）
function getClosingSpeedScore(
  last3f_1: number | null,
  last3f_2: number | null,
  last3f_3: number | null,
): number {
  const BEST = 33.0
  const WORST = 36.5
  const vals: [number | null, number][] = [
    [last3f_1, 0.5],
    [last3f_2, 0.3],
    [last3f_3, 0.2],
  ]
  const available = vals.filter(([v]) => v !== null) as [number, number][]
  if (available.length === 0) return 0.5
  const totalWeight = available.reduce((sum, [, w]) => sum + w, 0)
  const weightedAvg = available.reduce((sum, [v, w]) => sum + v * w, 0) / totalWeight
  return Math.max(0, Math.min(1, (WORST - weightedAvg) / (WORST - BEST)))
}

// 脚質補正付き上がりスコア
// 逃げ・先行は上がりが遅くても粘れるのでフロアを0.5に設定（ペナルティなし）
// 差し・追込は末脚勝負なので生スコアをそのまま使用
function getStyleAdjustedClosingScore(
  last3f_1: number | null,
  last3f_2: number | null,
  last3f_3: number | null,
  style: RunningStyle | null,
): number {
  const raw = getClosingSpeedScore(last3f_1, last3f_2, last3f_3)
  if (style === 'front' || style === 'stalker') {
    return Math.max(raw, 0.5)  // 下限0.5：遅くても減点しない
  }
  return raw
}

const STRATEGIES_MAP = STRATEGIES
const BET_LEVELS_MAP = BET_LEVELS

// ─── Axis horse reason builder ────────────────────────────────────────────────

function buildAxisReason(
  style: RunningStyle | null,
  pace: PaceType,
  _stabilityScore: number,
  _rank: number,
  distanceFitScore: number,
  axisConfidenceLevel: AxisType,
): string {
  const paceAdj = style ? getPaceAdjustment(style, pace) : 0

  const STYLE_DESC: Partial<Record<RunningStyle, string>> = {
    front:       '自らハナを奪ってペースを支配できる逃げタイプ',
    stalker:     '好位から直線で力強く抜け出す先行タイプ',
    closer:      '末脚を温存して直線で一気に突き抜ける差しタイプ',
    deep_closer: '後方から豪快な末脚を炸裂させる追込タイプ',
  }

  const parts: string[] = []

  if (style && STYLE_DESC[style]) {
    parts.push(`${STYLE_DESC[style]}。`)
  }

  if (style && paceAdj > 0) {
    parts.push(`${PACE_ADV_COMMENTS[pace]?.[style] ?? 'この展開で強みが最大限に活きる'}。`)
  } else if (style && paceAdj < 0) {
    parts.push('展開面での不利を覆すだけの総合力を持つ。')
  }

  const distPart = distanceFitScore >= 0.70
    ? '距離適性も抜群で、'
    : distanceFitScore >= 0.55
    ? '距離への適性も高く、'
    : distanceFitScore < 0.45
    ? 'スタミナが問われる舞台だが、'
    : ''

  const confPart = axisConfidenceLevel === '軸強い'
    ? 'AI評価で2位以下に差をつけた断然の軸馬。'
    : axisConfidenceLevel === '標準'
    ? 'AI総合評価トップの軸馬。'
    : '混戦の中でもAI最高評価を獲得した軸候補。'

  parts.push(`${distPart}${confPart}`)

  return parts.join('')
}

function buildValueHorseReason(
  style: RunningStyle | null,
  pace: PaceType,
  aiRank: number,
  popularityRank: number | null,
): string {
  const adj = getPaceAdjustment(style, pace)
  const gap = popularityRank != null ? popularityRank - aiRank : null

  const paceText = style !== null && adj > 0
    ? (PACE_ADV_COMMENTS[pace]?.[style] ?? 'この展開で恩恵を受けやすい') + '。'
    : style !== null && adj < 0
    ? '展開面では不利だが、'
    : ''

  if (gap != null && gap >= 5) {
    return `市場評価よりAI評価が大きく上回る配当妙味馬。${paceText}ヒモに加えることで回収率向上が期待できる。`
  } else if (gap != null && gap >= 3) {
    return `人気以上にAIが評価している穴候補。${paceText}展開次第で上位に食い込む可能性がある。`
  } else {
    return `${paceText}人気と実力の乖離から配当妙味が見込める一頭。`
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

// ─── Race stability score ─────────────────────────────────────────────────────

// Computes a 0–100 race stability score from the running-style composition of
// the race field. Higher = more predictable outcome; lower = more chaotic.
// Three sub-scores are weighted into the final result:
//   - frontClarityScore  (0.45): single front-runner → most readable
//   - pressureScore      (0.35): fewer pace-setters → less pace pressure
//   - balanceScore       (0.20): larger front/rear gap → clearer pace dynamic
function computeRaceStabilityScore(
  frontCount: number,
  stalkerCount: number,
  closerCount: number,
  deepCloserCount: number,
  totalCount: number,
): number {
  const frontClarityScore =
    frontCount === 1 ? 1.0 :
    frontCount === 0 ? 0.60 :
    frontCount === 2 ? 0.70 :
    0.35

  const pacePressure = frontCount * 1.0 + stalkerCount * 0.45
  const pressureScore = 1 - Math.min(pacePressure / 6.0, 1.0)

  const frontGroup = frontCount + stalkerCount
  const rearGroup = closerCount + deepCloserCount
  const balanceGap = totalCount === 0 ? 0 : Math.abs(frontGroup - rearGroup) / totalCount
  const balanceScore = 0.4 + 0.6 * balanceGap

  return Math.round(
    100 * (0.45 * frontClarityScore + 0.35 * pressureScore + 0.20 * balanceScore)
  )
}

type ValueHorseCandidate = {
  horseName: string
  reason: string
  aiRank: number
  popularityRank: number | null
}

type NextBestCandidate = {
  horseName: string
  aiRank: number
  popularityRank: number
  valueIndex: number
}

type ValueOpportunityResult = {
  candidate: ValueHorseCandidate | null
  // 穴条件は満たさないが、formation内でvalueIndexが最も高い次点候補
  nextBest: NextBestCandidate | null
}

function getValueOpportunity(
  formation: FormationResponse,
  horses: Horse[],
  pace: PaceType,
  allRankedHorses: { id: string }[],
  entries: Entry[],
): ValueOpportunityResult {
  const totalHorses = allRankedHorses.length
  if (totalHorses === 0) return { candidate: null, nextBest: null }

  // AI上位40%のカットライン
  const aiTopCutoff = Math.ceil(totalHorses * 0.4)

  // ヒモ馬のみを評価（軸馬は既にメイン軸として採用済みのため除外）
  const allCandidateIds = [...formation.himo_horses]

  type Scored = {
    id: string
    aiRank: number
    popularityRank: number
    valueIndex: number
    qualifies: boolean // 穴馬条件（4番人気以下 かつ AI上位40%以内）を満たすか
  }

  const allScored: Scored[] = []

  for (const id of allCandidateIds) {
    const aiRankIndex = allRankedHorses.findIndex((h) => h.id === id)
    const aiRank = aiRankIndex >= 0 ? aiRankIndex + 1 : totalHorses + 1
    const popularityRank = entries.find((e) => e.horse_id === id)?.popularity_rank ?? null
    if (popularityRank == null) continue

    // valueIndex: 高いほどAIが市場より高く評価している
    const valueIndex = popularityRank / aiRank
    const qualifies = popularityRank >= 4 && aiRank <= aiTopCutoff
    allScored.push({ id, aiRank, popularityRank, valueIndex, qualifies })
  }

  allScored.sort((a, b) => b.valueIndex - a.valueIndex)

  // 穴馬条件を満たす候補
  const qualified = allScored.filter((s) => s.qualifies)
  let candidate: ValueHorseCandidate | null = null
  if (qualified.length > 0) {
    const best = qualified[0]
    const h = horses.find((h) => h.id === best.id)
    candidate = {
      horseName: h?.name ?? best.id,
      reason: buildValueHorseReason(h?.style ?? null, pace, best.aiRank, best.popularityRank),
      aiRank: best.aiRank,
      popularityRank: best.popularityRank,
    }
  }

  // 次点候補: 穴条件は満たさないが、valueIndexが最も高い馬（candidateと重複しない）
  const candidateId = qualified[0]?.id ?? null
  const nextBestRaw = allScored.find((s) => !s.qualifies && s.id !== candidateId && s.popularityRank >= 2)
  const nextBest: NextBestCandidate | null = nextBestRaw
    ? {
        horseName: horses.find((h) => h.id === nextBestRaw.id)?.name ?? nextBestRaw.id,
        aiRank: nextBestRaw.aiRank,
        popularityRank: nextBestRaw.popularityRank,
        valueIndex: nextBestRaw.valueIndex,
      }
    : null

  return { candidate, nextBest }
}

// ─── AI summary builder ───────────────────────────────────────────────────────

function buildAiSummary(
  stabilityScore: number,
  pace: PaceType,
  advantageHorses: { style: RunningStyle }[],
  valueHorse: { horseName: string } | null,
  distanceM: number | null,
  grade: string | null,
  frontCount: number,
  axisName: string | null,
  axisType: AxisType,
): string[] {
  const lines: string[] = []

  // Line 1: グレード × 距離カテゴリ × ペース
  const distLabel =
    distanceM == null  ? '' :
    distanceM <= 1400  ? 'スプリント〜マイル' :
    distanceM <= 2000  ? 'マイル〜中距離' :
    distanceM <= 2400  ? '中距離〜クラシック距離' : '長距離'
  const gradeLabel = grade === 'G1' ? 'G1' : grade === 'G2' ? 'G2' : grade === 'G3' ? 'G3' : null
  const raceChar = [gradeLabel, distLabel ? `${distLabel}戦` : null].filter(Boolean).join('の')
  lines.push(`${raceChar ? raceChar + '。' : ''}${PACE_INFO[pace].label}が想定され、${
    pace === 'fast'     ? 'ペースが上がりやすく後半での脚の使い方が鍵になる。' :
    pace === 'slow'     ? 'スローになりやすく瞬発力勝負になりやすい。' :
    pace === 'balanced' ? '平均的なペースで実力が出やすい展開。' :
    'ペース読みが難しいレース。'
  }`)

  // Line 2: 逃げ馬頭数 × 展開有利脚質
  const frontNote =
    frontCount === 0 ? '逃げ馬不在で先行馬同士の駆け引きが焦点。' :
    frontCount === 1 ? '逃げ馬が1頭で主導権を握りやすく、ペースが読みやすい。' :
    frontCount === 2 ? '逃げ馬が2頭おり、前半から流れやすい。' :
                       `逃げ馬が${frontCount}頭いる乱ペースになりやすい展開。`
  const styleNote = advantageHorses.length > 0 ? (() => {
    const s = advantageHorses[0].style
    return s === 'front'       ? '逃げ・先行馬が恵まれる展開になりそう。' :
           s === 'stalker'     ? '好位から運べる先行馬に有利な流れ。' :
           s === 'closer'      ? '差し馬に展開が向く可能性が高い。' :
           s === 'deep_closer' ? '追込馬が台頭しやすい展開。' : ''
  })() : (
    stabilityScore >= 61 ? '展開の有利不利は少なく実力通りの結果になりやすい。' :
    stabilityScore >= 41 ? '波乱の可能性も残るため広めに構えたい。' :
                           '荒れやすいレースでヒモを広めに取りたい。'
  )
  lines.push(frontNote + (styleNote ? ' ' + styleNote : ''))

  // Line 3: 軸信頼度
  if (axisName) {
    const axisComment =
      axisType === '軸強い' ? `軸は${axisName}で信頼度が高く、1頭軸でのフォーメーションが有効。` :
      axisType === '標準'   ? `軸候補は${axisName}だが混戦気味のため相手を手広く取りたい。` :
                              `混戦模様のため${axisName}を中心に軸を2〜3頭に広げた買い方を推奨。`
    lines.push(axisComment)
  }

  // Line 4: 穴馬
  if (valueHorse) {
    lines.push(`配当妙味が期待できる穴候補として ${valueHorse.horseName} に注目。`)
  }

  return lines
}

// ─── Shared card style ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#13141F',
  borderRadius: 12,
  padding: '20px 20px',
  border: '1px solid rgba(255,255,255,0.08)',
  marginBottom: 10,
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#9898B0',
  marginBottom: 14,
  paddingBottom: 10,
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}

const circled = (n: number | null | undefined) =>
  n != null && n >= 1 && n <= 20 ? String.fromCharCode(0x245f + n) : null

// ─── HorseRow component ───────────────────────────────────────────────────────

function HorseRow({
  rank,
  name,
  horseNumber,
  role,
  paceTag,
  styleTag,
  popularityRank,
  gapBadge,
}: {
  rank: number
  name: string
  horseNumber?: number | null
  role: 'axis' | 'himo' | 'other'
  paceTag?: 'up' | 'down' | null
  styleTag?: { label: string; color: string } | null
  popularityRank?: number | null
  gapBadge?: 'ai_pick' | 'market_lead' | null
}) {
  const isAxis = role === 'axis'
  const isOther = role === 'other'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isAxis ? '11px 14px' : '9px 14px',
        borderRadius: 6,
        background: isAxis ? 'rgba(20,184,166,0.08)' : 'transparent',
        borderLeft: `3px solid ${isAxis ? '#14B8A6' : 'rgba(255,255,255,0.08)'}`,
        marginBottom: 4,
        opacity: isOther ? 0.55 : 1,
      }}
    >
      {/* Rank number */}
      <span
        style={{
          width: isAxis ? 28 : 22,
          height: isAxis ? 28 : 22,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isAxis ? 13 : 10,
          fontWeight: 800,
          flexShrink: 0,
          background: isAxis ? '#14B8A6' : 'rgba(255,255,255,0.08)',
          color: isAxis ? '#fff' : '#9898B0',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {rank}
      </span>

      {/* Horse name + popularity rank */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontWeight: isAxis ? 700 : 500,
            fontSize: isAxis ? 15 : 13,
            color: isAxis ? '#EEEEF5' : '#9898B0',
            letterSpacing: isAxis ? '0.01em' : 0,
          }}
        >
          {circled(horseNumber) != null && (
            <span style={{ fontSize: 13, color: '#62627A', marginRight: 5 }}>
              {circled(horseNumber)}
            </span>
          )}
          {name}
        </span>
        {popularityRank != null && (
          <span style={{ fontSize: 10, color: '#9898B0', marginTop: 2, display: 'block', fontVariantNumeric: 'tabular-nums' }}>
            {popularityRank}番人気
          </span>
        )}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
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
        {gapBadge === 'ai_pick' && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(22,101,52,0.08)', color: '#166534', border: '1px solid rgba(22,101,52,0.25)' }}>
            AI注目
          </span>
        )}
        {gapBadge === 'market_lead' && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.10)' }}>
            人気先行
          </span>
        )}
        {!isOther && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: isAxis ? '#14B8A6' : 'transparent',
              color: isAxis ? '#fff' : '#9898B0',
              border: `1px solid ${isAxis ? '#14B8A6' : 'rgba(255,255,255,0.10)'}`,
              letterSpacing: '0.04em',
            }}
          >
            {isAxis ? '軸' : '相手'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Formation v2 (検証レース専用) ───────────────────────────────────────────
//
// 既存の compute_formation_for_race RPC 結果をベースに、
// ヒモを「実力ヒモ」と「穴ヒモ」に分けた新しいフォーメーションを返す。
//
// 選定ルール:
//   軸      : AI順位 1位
//   実力ヒモ : AI順位 2〜4位
//   穴ヒモ  : 残馬から穴スコア上位 2頭（軸・実力ヒモを除外）
//
// 穴スコア = pace_fit_score * 0.5 + (1 / popularity_rank) * 0.3 + (1 - stability_score) * 0.2
//   - pace_fit_score  : getPaceAdjustment を [0,1] に正規化
//   - popularity_rank : entries から取得（欠損時は出走頭数+1 を仮置き）
//   - stability_score : 0〜100 (computeRaceStabilityScore の戻り値そのまま。式内で /100 して正規化)
//
// 本番レース（is_test=false）には呼び出されない。

// デバッグパネル用: 馬ごとのスコア内訳
type FormationV2DebugRow = {
  horseName: string
  role: '軸' | '実力ヒモ' | '穴ヒモ' | '穴候補（落選）'
  aiRank: number | null       // 軸・実力ヒモのみ
  paceFitScore: number        // [0,1] 正規化済み
  popularityRank: number      // entries 実測値（欠損時は出走頭数+1）
  holeScore: number           // 穴スコア（軸・実力ヒモも参考値として算出）
}

type FormationV2Result = {
  formation: FormationResponse
  debug: {
    // raceStabilityScore（0〜100）はレース全体の安定度。馬ごとの値ではない。
    stabilityScore: number
    pace: PaceType
    rows: FormationV2DebugRow[]
  }
}

function computeFormationV2(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,       // raceStabilityScore 0–100（レース共通値）
): FormationV2Result {
  const allByAiRank = [...formation.axis_horses, ...formation.himo_horses]

  const axisV2 = allByAiRank.slice(0, 1)
  const jitsuryokuHimo = allByAiRank.slice(1, 4)

  const usedSet = new Set(allByAiRank.slice(0, 4))
  const remaining = entries.map((e) => e.horse_id).filter((id) => !usedSet.has(id))

  const totalHorses = entries.length

  // 穴スコア計算（残馬のみ選定に使うが、全馬分を計算してデバッグ表示に使う）
  const scoreOf = (horseId: string) => {
    const horse = horses.find((h) => h.id === horseId)
    const entry = entries.find((e) => e.horse_id === horseId)
    const popularityRank = entry?.popularity_rank ?? totalHorses + 1
    const rawAdj = getPaceAdjustment(horse?.style ?? null, pace)
    const paceFitScore = (rawAdj + 0.08) / 0.18
    const holeScore =
      paceFitScore * 0.5
      + (1.0 / popularityRank) * 0.3
      + (1 - stabilityScore / 100) * 0.2
    return { popularityRank, paceFitScore, holeScore }
  }

  const scoredRemaining = remaining
    .map((horseId) => ({ horseId, ...scoreOf(horseId) }))
    .sort((a, b) => b.holeScore - a.holeScore)

  const anaHimo = scoredRemaining.slice(0, 2).map((s) => s.horseId)
  const anaHimoSet = new Set(anaHimo)

  // デバッグ行を組み立て（軸 → 実力ヒモ → 穴ヒモ → 落選候補の順）
  const rows: FormationV2DebugRow[] = []

  axisV2.forEach((id, i) => {
    const { popularityRank, paceFitScore, holeScore } = scoreOf(id)
    rows.push({
      horseName: horses.find((h) => h.id === id)?.name ?? id,
      role: '軸',
      aiRank: i + 1,
      paceFitScore, popularityRank, holeScore,
    })
  })
  jitsuryokuHimo.forEach((id, i) => {
    const { popularityRank, paceFitScore, holeScore } = scoreOf(id)
    rows.push({
      horseName: horses.find((h) => h.id === id)?.name ?? id,
      role: '実力ヒモ',
      aiRank: i + 2,
      paceFitScore, popularityRank, holeScore,
    })
  })
  scoredRemaining.forEach(({ horseId, popularityRank, paceFitScore, holeScore }) => {
    rows.push({
      horseName: horses.find((h) => h.id === horseId)?.name ?? horseId,
      role: anaHimoSet.has(horseId) ? '穴ヒモ' : '穴候補（落選）',
      aiRank: null,
      paceFitScore, popularityRank, holeScore,
    })
  })

  return {
    formation: {
      ...formation,
      axis_count: 1,
      axis_horses: axisV2,
      himo_horses: [...jitsuryokuHimo, ...anaHimo],
    },
    debug: { stabilityScore, pace, rows },
  }
}

// ─── Formation v3 (検証レース専用) ───────────────────────────────────────────
//
// v2 の stability 項（レース共通値）を廃止し、馬ごとに差が出る3成分に変更。
//
// hole_score_v3 =
//   pace_fit_score      * 0.45
//   + popularity_component * 0.35   = min(popularity_rank / 16.0, 1.0)
//   + axis_gap_component   * 0.20   = 1 - normalized_prediction_axis_score
//
// prediction_axis_score（生値）= AI ランキング位置から 1/(rank+1) で算出。
// 残馬プール内で min-max 正規化。
// → AI 下位・非選出馬ほど axis_gap が高くなり穴らしさが上がる。
//
// 軸・実力ヒモの選定は v2 と同じ（AI順位 1位 / 2〜4位）。
// 穴ヒモは残馬から hole_score_v3 上位2頭。

type FormationV3DebugRow = {
  horseName: string
  selected: boolean            // 穴ヒモ v3 に選ばれたか
  paceFitScore: number
  popularityRank: number
  popularityComponent: number  // min(pop_rank / 16, 1.0)
  predAxisScoreRaw: number     // 1/(AI rank index + 1)。非選出馬は 0
  predAxisScoreNorm: number    // 残馬プール内 min-max 正規化
  axisGapComponent: number     // 1 - predAxisScoreNorm
  holeScoreV3: number
}

type FormationV3Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    rows: FormationV3DebugRow[]
  }
}

function computeFormationV3(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
): FormationV3Result {
  const allByAiRank = [...formation.axis_horses, ...formation.himo_horses]
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  const axisV3 = allByAiRank.slice(0, 1)
  const jitsuryokuHimo = allByAiRank.slice(1, 4)

  const usedSet = new Set(allByAiRank.slice(0, 4))
  const remaining = entries.map((e) => e.horse_id).filter((id) => !usedSet.has(id))

  const totalHorses = entries.length

  // prediction_axis_score（生値）: AI ランキングにいる馬は 1/(index+1)、それ以外は 0
  const rawAxisScores = remaining.map((id) => {
    const idx = aiRankIndexMap.get(id)
    return idx !== undefined ? 1 / (idx + 1) : 0
  })

  // 残馬プール内で min-max 正規化
  const minRaw = Math.min(...rawAxisScores)
  const maxRaw = Math.max(...rawAxisScores)
  const rangeRaw = maxRaw - minRaw
  const normalizeAxis = (raw: number) => (rangeRaw > 0 ? (raw - minRaw) / rangeRaw : 0)

  // hole_score_v3 を計算
  const scored = remaining.map((horseId, i) => {
    const horse = horses.find((h) => h.id === horseId)
    const entry = entries.find((e) => e.horse_id === horseId)
    const popularityRank = entry?.popularity_rank ?? totalHorses + 1

    const rawAdj = getPaceAdjustment(horse?.style ?? null, pace)
    const paceFitScore = (rawAdj + 0.08) / 0.18

    const popularityComponent = Math.min(popularityRank / 16.0, 1.0)

    const predAxisScoreRaw = rawAxisScores[i]
    const predAxisScoreNorm = normalizeAxis(predAxisScoreRaw)
    const axisGapComponent = 1 - predAxisScoreNorm

    const holeScoreV3 =
      paceFitScore * 0.45
      + popularityComponent * 0.35
      + axisGapComponent * 0.20

    return { horseId, paceFitScore, popularityRank, popularityComponent, predAxisScoreRaw, predAxisScoreNorm, axisGapComponent, holeScoreV3 }
  })

  scored.sort((a, b) => b.holeScoreV3 - a.holeScoreV3)
  const anaHimo = scored.slice(0, 2).map((s) => s.horseId)
  const anaHimoSet = new Set(anaHimo)

  const rows: FormationV3DebugRow[] = scored.map((s) => ({
    horseName: horses.find((h) => h.id === s.horseId)?.name ?? s.horseId,
    selected: anaHimoSet.has(s.horseId),
    paceFitScore: s.paceFitScore,
    popularityRank: s.popularityRank,
    popularityComponent: s.popularityComponent,
    predAxisScoreRaw: s.predAxisScoreRaw,
    predAxisScoreNorm: s.predAxisScoreNorm,
    axisGapComponent: s.axisGapComponent,
    holeScoreV3: s.holeScoreV3,
  }))

  return {
    formation: {
      ...formation,
      axis_count: 1,
      axis_horses: axisV3,
      himo_horses: [...jitsuryokuHimo, ...anaHimo],
    },
    debug: { pace, rows },
  }
}

// ─── Formation v4 (検証レース専用) ───────────────────────────────────────────
//
// v3 から「実力ヒモ枠削減 + 人気相手1頭を明示的に確保」に変更。
//
// 選定ルール:
//   軸       : AI順位 1位
//   実力ヒモ : AI順位 2〜3位（2頭）
//   人気相手 : popularity_rank 1〜2 位のうち未採用の先頭1頭
//   穴ヒモ   : 残馬から hole_score_v3 上位2頭（未採用）
//
// 人気相手が全員採用済みの場合はスキップ（軸が1番人気など）。

type FormationV4DebugRow = {
  horseName: string
  role: '軸' | '実力ヒモ' | '人気相手' | '穴ヒモ（v4）' | '穴候補（v4落選）'
  popularityRank: number
  paceFitScore: number
  popularityComponent: number
  predAxisScoreRaw: number
  predAxisScoreNorm: number
  axisGapComponent: number
  holeScoreV3: number          // v3 式をそのまま流用
}

type FormationV4Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    ninkiAiteName: string | null   // 人気相手として選ばれた馬名
    himoV3Names: string[]          // v3 の himo_horses（比較用）
    himoV4Names: string[]          // v4 の himo_horses
    rows: FormationV4DebugRow[]    // 穴ヒモ候補のスコア内訳
  }
}

function computeFormationV4(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
): FormationV4Result {
  const allByAiRank = [...formation.axis_horses, ...formation.himo_horses]
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id

  // 軸 + 実力ヒモ（2頭に絞る）
  const axisV4 = allByAiRank.slice(0, 1)
  const jitsuryokuHimo = allByAiRank.slice(1, 3)
  const usedSet = new Set([...axisV4, ...jitsuryokuHimo])

  // 人気相手: popularity_rank 1〜2 位のうち未採用の先頭1頭
  const sortedByPop = [...entries]
    .filter((e) => e.popularity_rank !== null && e.popularity_rank <= 2)
    .sort((a, b) => (a.popularity_rank ?? 99) - (b.popularity_rank ?? 99))
  let ninkiAiteId: string | null = null
  for (const e of sortedByPop) {
    if (!usedSet.has(e.horse_id)) { ninkiAiteId = e.horse_id; break }
  }
  if (ninkiAiteId) usedSet.add(ninkiAiteId)

  // 残馬プールで穴スコア計算（v3 式を流用）
  const totalHorses = entries.length
  const remaining = entries.map((e) => e.horse_id).filter((id) => !usedSet.has(id))

  const rawAxisScores = remaining.map((id) => {
    const idx = aiRankIndexMap.get(id)
    return idx !== undefined ? 1 / (idx + 1) : 0
  })
  const minRaw = Math.min(...rawAxisScores)
  const maxRaw = Math.max(...rawAxisScores)
  const rangeRaw = maxRaw - minRaw
  const normalizeAxis = (raw: number) => (rangeRaw > 0 ? (raw - minRaw) / rangeRaw : 0)

  const scored = remaining.map((horseId, i) => {
    const horse = horses.find((h) => h.id === horseId)
    const entry = entries.find((e) => e.horse_id === horseId)
    const popularityRank = entry?.popularity_rank ?? totalHorses + 1
    const rawAdj = getPaceAdjustment(horse?.style ?? null, pace)
    const paceFitScore = (rawAdj + 0.08) / 0.18
    const popularityComponent = Math.min(popularityRank / 16.0, 1.0)
    const predAxisScoreRaw = rawAxisScores[i]
    const predAxisScoreNorm = normalizeAxis(predAxisScoreRaw)
    const axisGapComponent = 1 - predAxisScoreNorm
    const holeScoreV3 = paceFitScore * 0.45 + popularityComponent * 0.35 + axisGapComponent * 0.20
    return { horseId, popularityRank, paceFitScore, popularityComponent, predAxisScoreRaw, predAxisScoreNorm, axisGapComponent, holeScoreV3 }
  })

  scored.sort((a, b) => b.holeScoreV3 - a.holeScoreV3)
  const anaHimo = scored.slice(0, 2).map((s) => s.horseId)
  const anaHimoSet = new Set(anaHimo)

  const himoV4 = [...jitsuryokuHimo, ...(ninkiAiteId ? [ninkiAiteId] : []), ...anaHimo]

  // v3 の himo（比較用）: AI 2〜4位 + 残から穴 2頭
  const usedV3 = new Set(allByAiRank.slice(0, 4))
  const remainingV3 = entries.map((e) => e.horse_id).filter((id) => !usedV3.has(id))
  const rawV3 = remainingV3.map((id) => {
    const idx = aiRankIndexMap.get(id); return idx !== undefined ? 1 / (idx + 1) : 0
  })
  const minV3 = Math.min(...rawV3); const maxV3 = Math.max(...rawV3); const rV3 = maxV3 - minV3
  const normV3 = (r: number) => rV3 > 0 ? (r - minV3) / rV3 : 0
  const scoredV3 = remainingV3.map((id, i) => {
    const entry = entries.find((e) => e.horse_id === id)
    const pop = entry?.popularity_rank ?? totalHorses + 1
    const rawAdj = getPaceAdjustment(horses.find((h) => h.id === id)?.style ?? null, pace)
    const pf = (rawAdj + 0.08) / 0.18
    const pc = Math.min(pop / 16, 1)
    const ag = 1 - normV3(rawV3[i])
    return { id, score: pf * 0.45 + pc * 0.35 + ag * 0.20 }
  }).sort((a, b) => b.score - a.score)
  const himoV3 = [...allByAiRank.slice(1, 4), ...scoredV3.slice(0, 2).map((s) => s.id)]

  const rows: FormationV4DebugRow[] = [
    ...axisV4.map((id) => {
      const entry = entries.find((e) => e.horse_id === id)
      const pop = entry?.popularity_rank ?? totalHorses + 1
      const rawAdj = getPaceAdjustment(horses.find((h) => h.id === id)?.style ?? null, pace)
      const pf = (rawAdj + 0.08) / 0.18
      return { horseName: resolveName(id), role: '軸' as const, popularityRank: pop, paceFitScore: pf, popularityComponent: Math.min(pop / 16, 1), predAxisScoreRaw: 1, predAxisScoreNorm: 1, axisGapComponent: 0, holeScoreV3: 0 }
    }),
    ...jitsuryokuHimo.map((id, i) => {
      const entry = entries.find((e) => e.horse_id === id)
      const pop = entry?.popularity_rank ?? totalHorses + 1
      const rawAdj = getPaceAdjustment(horses.find((h) => h.id === id)?.style ?? null, pace)
      const pf = (rawAdj + 0.08) / 0.18
      return { horseName: resolveName(id), role: '実力ヒモ' as const, popularityRank: pop, paceFitScore: pf, popularityComponent: Math.min(pop / 16, 1), predAxisScoreRaw: 1 / (i + 2), predAxisScoreNorm: 1, axisGapComponent: 0, holeScoreV3: 0 }
    }),
    ...(ninkiAiteId ? [{
      horseName: resolveName(ninkiAiteId),
      role: '人気相手' as const,
      popularityRank: entries.find((e) => e.horse_id === ninkiAiteId)?.popularity_rank ?? 0,
      paceFitScore: 0, popularityComponent: 0, predAxisScoreRaw: 0, predAxisScoreNorm: 0, axisGapComponent: 0, holeScoreV3: 0,
    }] : []),
    ...scored.map((s) => ({
      horseName: resolveName(s.horseId),
      role: anaHimoSet.has(s.horseId) ? '穴ヒモ（v4）' as const : '穴候補（v4落選）' as const,
      popularityRank: s.popularityRank,
      paceFitScore: s.paceFitScore,
      popularityComponent: s.popularityComponent,
      predAxisScoreRaw: s.predAxisScoreRaw,
      predAxisScoreNorm: s.predAxisScoreNorm,
      axisGapComponent: s.axisGapComponent,
      holeScoreV3: s.holeScoreV3,
    })),
  ]

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV4, himo_horses: himoV4 },
    debug: {
      pace,
      ninkiAiteName: ninkiAiteId ? resolveName(ninkiAiteId) : null,
      himoV3Names: himoV3.map(resolveName),
      himoV4Names: himoV4.map(resolveName),
      rows,
    },
  }
}

// ─── Formation V5 ─────────────────────────────────────────────────────────────
// 軸: AI1位 / candidate_pool: axis_gap 上位6頭 / ヒモ: himo_score_v5 上位5頭
// himo_score_v5 = pace_fit*0.50 + distance_fit*0.35 + (1-stability/100)*0.15
// popularity_rank はロジックで一切使用しない

type FormationV5DebugRow = {
  horseName: string
  axisGap: number
  paceFit: number
  distanceFit: number
  stabilityComponent: number
  himoScoreV5: number
  isHimo: boolean
}

type FormationV5Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    rows: FormationV5DebugRow[]
  }
}

function computeFormationV5(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
): FormationV5Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id

  // AI rank order from formation
  const allByAiRank: string[] = formation.axis_horses.length > 0
    ? [...formation.axis_horses, ...formation.himo_horses]
    : formation.himo_horses
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  // Axis = AI rank 1
  const axisId = allByAiRank[0]
  const axisV5 = axisId ? [axisId] : formation.axis_horses

  // axis_gap = abs(prediction_axis_score - 1.0)
  // prediction_axis_score for rank i = 1/(i+1); axis horse (i=0) = 1.0
  // Non-ranked horses: score=0, gap=1.0
  const getAxisGap = (id: string): number => {
    const idx = aiRankIndexMap.get(id)
    if (idx === undefined) return 1.0
    if (idx === 0) return 0.0
    return Math.abs(1 / (idx + 1) - 1.0)
  }

  // candidate_pool: all non-axis horses, top 6 by smallest axis_gap
  const nonAxisIds = entries.map((e) => e.horse_id).filter((id) => id !== axisId)
  const candidatePool = nonAxisIds
    .map((id) => ({ id, axisGap: getAxisGap(id) }))
    .sort((a, b) => a.axisGap - b.axisGap)
    .slice(0, 6)
    .map((c) => c.id)

  // Compute himo_score_v5 for each candidate
  const stabilityComp = 1 - stabilityScore / 100

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const himoScoreV5 = paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
    return { id, axisGap: getAxisGap(id), paceFit, distanceFit, himoScoreV5 }
  })

  scored.sort((a, b) => b.himoScoreV5 - a.himoScoreV5)
  const himoV5 = scored.slice(0, 5).map((s) => s.id)
  const himoSet = new Set(himoV5)

  const rows: FormationV5DebugRow[] = [
    ...scored.map((s) => ({
      horseName: resolveName(s.id),
      axisGap: s.axisGap,
      paceFit: s.paceFit,
      distanceFit: s.distanceFit,
      stabilityComponent: stabilityComp,
      himoScoreV5: s.himoScoreV5,
      isHimo: himoSet.has(s.id),
    })),
  ]

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV5, himo_horses: himoV5 },
    debug: { pace, rows },
  }
}

// ─── Formation V6 ─────────────────────────────────────────────────────────────
// v5 ベースに axis_confidence を導入してヒモ頭数を可変化
//
// axis_confidence = v5スコア(AI1位) − v5スコア(AI2位)
//   ※ prediction_axis_score = 1/(rank_index+1) は全レース固定値(差=0.50)なので
//     v5式(pace_fit*0.50 + distance_fit*0.35 + stability*0.15)を両馬に適用した差を使う
//
// 軸タイプ:
//   >= 0.08 → 軸強い (ヒモ4頭)
//   >= 0.04 → 標準   (ヒモ5頭)
//   <  0.04 → 混戦   (ヒモ6頭)

type AxisType = '軸強い' | '標準' | '混戦'

type FormationV6DebugRow = {
  horseName: string
  axisGap: number
  paceFit: number
  distanceFit: number
  stabilityComponent: number
  himoScoreV5: number
  isHimo: boolean
}

type FormationV6Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    axisConfidence: number
    axisType: AxisType
    himoCount: number
    axisHorseName: string
    rank2HorseName: string
    axisHorseScore: number
    rank2HorseScore: number
    rows: FormationV6DebugRow[]
  }
}

function computeFormationV6(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
): FormationV6Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id

  // AI rank order from formation
  const allByAiRank: string[] = formation.axis_horses.length > 0
    ? [...formation.axis_horses, ...formation.himo_horses]
    : formation.himo_horses
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  const axisId = allByAiRank[0]
  const rank2Id = allByAiRank[1] ?? null
  const axisV6 = axisId ? [axisId] : formation.axis_horses

  // axis_gap for candidate scoring
  const getAxisGap = (id: string): number => {
    const idx = aiRankIndexMap.get(id)
    if (idx === undefined) return 1.0
    if (idx === 0) return 0.0
    return Math.abs(1 / (idx + 1) - 1.0)
  }

  // v5式スコアをどの馬にも適用できるヘルパー
  const stabilityComp = 1 - stabilityScore / 100
  const computeV5Score = (id: string): number => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    return paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
  }

  // axis_confidence = v5スコア(AI1位) − v5スコア(AI2位)
  const axisHorseScore = axisId ? computeV5Score(axisId) : 0
  const rank2HorseScore = rank2Id ? computeV5Score(rank2Id) : 0
  const axisConfidence = axisHorseScore - rank2HorseScore

  const axisType: AxisType =
    axisConfidence >= 0.08 ? '軸強い' :
    axisConfidence >= 0.04 ? '標準' :
    '混戦'

  const himoCount = axisType === '軸強い' ? 4 : axisType === '標準' ? 5 : 6

  // candidate_pool: 軸以外の全馬から axis_gap 上位6頭
  const nonAxisIds = entries.map((e) => e.horse_id).filter((id) => id !== axisId)
  const candidatePool = nonAxisIds
    .map((id) => ({ id, axisGap: getAxisGap(id) }))
    .sort((a, b) => a.axisGap - b.axisGap)
    .slice(0, 6)
    .map((c) => c.id)

  // himo_score_v5 でスコアリング
  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const himoScoreV5 = paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
    return { id, axisGap: getAxisGap(id), paceFit, distanceFit, himoScoreV5 }
  })

  scored.sort((a, b) => b.himoScoreV5 - a.himoScoreV5)
  const himoV6 = scored.slice(0, himoCount).map((s) => s.id)
  const himoSet = new Set(himoV6)

  const rows: FormationV6DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    axisGap: s.axisGap,
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    stabilityComponent: stabilityComp,
    himoScoreV5: s.himoScoreV5,
    isHimo: himoSet.has(s.id),
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV6, himo_horses: himoV6 },
    debug: {
      pace,
      axisConfidence,
      axisType,
      himoCount,
      axisHorseName: axisId ? resolveName(axisId) : '—',
      rank2HorseName: rank2Id ? resolveName(rank2Id) : '—',
      axisHorseScore,
      rank2HorseScore,
      rows,
    },
  }
}

// ─── Formation V7 ─────────────────────────────────────────────────────────────
// v6 の axis_confidence を改善: 上位4頭のスプレッドも加味
//
// axis_confidence_v7 =
//   (top1_v5score - top2_v5score) * 0.7
// + (top1_v5score - top4_v5score) * 0.3
//   ※ top4 が存在しない場合は top1-top2 のみで代用
//
// 軸タイプ・ヒモ頭数はv6と同じ閾値

type FormationV7DebugRow = {
  horseName: string
  axisGap: number
  paceFit: number
  distanceFit: number
  stabilityComponent: number
  himoScoreV5: number
  isHimo: boolean
}

type FormationV7Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    top1Score: number
    top2Score: number
    top4Score: number | null
    axisConfidenceV6: number
    axisConfidenceV7: number
    axisTypeV6: AxisType
    axisTypeV7: AxisType
    himoCountV6: number
    himoCountV7: number
    axisHorseName: string
    rank2HorseName: string
    rank4HorseName: string | null
    rows: FormationV7DebugRow[]
  }
}

function computeFormationV7(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
): FormationV7Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id

  const allByAiRank: string[] = formation.axis_horses.length > 0
    ? [...formation.axis_horses, ...formation.himo_horses]
    : formation.himo_horses
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  const axisId   = allByAiRank[0] ?? null
  const rank2Id  = allByAiRank[1] ?? null
  const rank4Id  = allByAiRank[3] ?? null   // index 3 = AI 4位
  const axisV7   = axisId ? [axisId] : formation.axis_horses

  const getAxisGap = (id: string): number => {
    const idx = aiRankIndexMap.get(id)
    if (idx === undefined) return 1.0
    if (idx === 0) return 0.0
    return Math.abs(1 / (idx + 1) - 1.0)
  }

  const stabilityComp = 1 - stabilityScore / 100
  const computeV5Score = (id: string): number => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    return paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
  }

  const top1Score = axisId  ? computeV5Score(axisId)  : 0
  const top2Score = rank2Id ? computeV5Score(rank2Id) : 0
  const top4Score = rank4Id ? computeV5Score(rank4Id) : null

  // v6 confidence（比較用）
  const axisConfidenceV6 = top1Score - top2Score

  // v7 confidence: top4 があれば加重平均、なければ top1-top2 のみ
  const axisConfidenceV7 = top4Score !== null
    ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
    : top1Score - top2Score

  const classifyAxisType = (conf: number): AxisType =>
    conf >= 0.08 ? '軸強い' : conf >= 0.04 ? '標準' : '混戦'
  const himoFromType = (t: AxisType): number =>
    t === '軸強い' ? 4 : t === '標準' ? 5 : 6

  const axisTypeV6  = classifyAxisType(axisConfidenceV6)
  const axisTypeV7  = classifyAxisType(axisConfidenceV7)
  const himoCountV6 = himoFromType(axisTypeV6)
  const himoCountV7 = himoFromType(axisTypeV7)

  // candidate_pool: 軸以外の全馬から axis_gap 上位6頭
  const nonAxisIds = entries.map((e) => e.horse_id).filter((id) => id !== axisId)
  const candidatePool = nonAxisIds
    .map((id) => ({ id, axisGap: getAxisGap(id) }))
    .sort((a, b) => a.axisGap - b.axisGap)
    .slice(0, 6)
    .map((c) => c.id)

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const himoScoreV5 = paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
    return { id, axisGap: getAxisGap(id), paceFit, distanceFit, himoScoreV5 }
  })

  scored.sort((a, b) => b.himoScoreV5 - a.himoScoreV5)
  const himoV7  = scored.slice(0, himoCountV7).map((s) => s.id)
  const himoSet = new Set(himoV7)

  const rows: FormationV7DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    axisGap: s.axisGap,
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    stabilityComponent: stabilityComp,
    himoScoreV5: s.himoScoreV5,
    isHimo: himoSet.has(s.id),
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV7, himo_horses: himoV7 },
    debug: {
      pace,
      top1Score,
      top2Score,
      top4Score,
      axisConfidenceV6,
      axisConfidenceV7,
      axisTypeV6,
      axisTypeV7,
      himoCountV6,
      himoCountV7,
      axisHorseName:  axisId  ? resolveName(axisId)  : '—',
      rank2HorseName: rank2Id ? resolveName(rank2Id) : '—',
      rank4HorseName: rank4Id ? resolveName(rank4Id) : null,
      rows,
    },
  }
}

// ─── Formation V8 ─────────────────────────────────────────────────────────────
// v7 ベースに jockey_place_score をヒモ側だけに追加
// 軸選定・axis_confidence・軸タイプ・ヒモ頭数は v7 を引き継ぐ
//
// himo_score_v8 =
//   pace_fit_score    * 0.40
// + distance_fit_score* 0.30
// + jockey_place_score* 0.20
// + (1-stability/100) * 0.10

type FormationV8DebugRow = {
  horseName: string
  axisGap: number
  paceFit: number
  distanceFit: number
  rawJockeyName: string   // DB上の表記そのまま
  jockeyScore: number
  stabilityComponent: number
  himoScoreV8: number
  himoScoreV7: number   // 比較用
  isHimo: boolean
}

type FormationV8Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    axisConfidenceV7: number
    axisTypeV7: AxisType
    himoCount: number
    rows: FormationV8DebugRow[]
  }
}

function computeFormationV8(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
  jockeyScoreMap: Record<string, number> = {},
): FormationV8Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id

  const allByAiRank: string[] = formation.axis_horses.length > 0
    ? [...formation.axis_horses, ...formation.himo_horses]
    : formation.himo_horses
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  const axisId  = allByAiRank[0] ?? null
  const rank2Id = allByAiRank[1] ?? null
  const rank4Id = allByAiRank[3] ?? null
  const axisV8  = axisId ? [axisId] : formation.axis_horses

  const getAxisGap = (id: string): number => {
    const idx = aiRankIndexMap.get(id)
    if (idx === undefined) return 1.0
    if (idx === 0) return 0.0
    return Math.abs(1 / (idx + 1) - 1.0)
  }

  const stabilityComp = 1 - stabilityScore / 100

  // v5スコア（axis_confidence 算出に使用）
  const computeV5Score = (id: string): number => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    return paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
  }

  // axis_confidence_v7 を引き継ぐ
  const top1Score = axisId  ? computeV5Score(axisId)  : 0
  const top2Score = rank2Id ? computeV5Score(rank2Id) : 0
  const top4Score = rank4Id ? computeV5Score(rank4Id) : null
  const axisConfidenceV7 = top4Score !== null
    ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
    : top1Score - top2Score
  const axisTypeV7: AxisType =
    axisConfidenceV7 >= 0.08 ? '軸強い' : axisConfidenceV7 >= 0.04 ? '標準' : '混戦'
  const himoCount = axisTypeV7 === '軸強い' ? 4 : axisTypeV7 === '標準' ? 5 : 6

  // candidate_pool: 軸以外の全馬から axis_gap 上位6頭（v7と同一）
  const nonAxisIds = entries.map((e) => e.horse_id).filter((id) => id !== axisId)
  const candidatePool = nonAxisIds
    .map((id) => ({ id, axisGap: getAxisGap(id) }))
    .sort((a, b) => a.axisGap - b.axisGap)
    .slice(0, 6)
    .map((c) => c.id)

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)

    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE

    const himoScoreV7 = paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
    const himoScoreV8 = paceFit * 0.40 + distanceFit * 0.30 + jockeyScore * 0.20 + stabilityComp * 0.10

    return { id, axisGap: getAxisGap(id), paceFit, distanceFit, rawJockeyName, jockeyScore, himoScoreV7, himoScoreV8 }
  })

  scored.sort((a, b) => b.himoScoreV8 - a.himoScoreV8)
  const himoV8  = scored.slice(0, himoCount).map((s) => s.id)
  const himoSet = new Set(himoV8)

  const rows: FormationV8DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    axisGap: s.axisGap,
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    rawJockeyName: s.rawJockeyName || '—',
    jockeyScore: s.jockeyScore,
    stabilityComponent: stabilityComp,
    himoScoreV8: s.himoScoreV8,
    himoScoreV7: s.himoScoreV7,
    isHimo: himoSet.has(s.id),
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV8, himo_horses: himoV8 },
    debug: { pace, axisConfidenceV7, axisTypeV7, himoCount, rows },
  }
}

// ─── Formation V9 ─────────────────────────────────────────────────────────────
// v8 ベースに「レースタイプ別騎手重み」を導入
// 3歳戦: jockey 0.25 (フレッシュな騎手起用が結果に直結しやすい)
// 古馬戦: jockey 0.10 (経験・コース適性の影響が大きく騎手依存度が下がる)
//
// レースタイプ判定: race_name に特定キーワードを含む → 3歳戦、それ以外 → 古馬戦

type RaceType3 = '3歳戦' | '古馬戦'

const RACE_3YO_KEYWORDS = [
  '弥生賞', 'スプリング', '皐月賞', 'ダービー', '菊花賞',
  'ホープフル', '共同通信杯', '京成杯',
]

function classifyRaceType(raceName: string | null | undefined): RaceType3 {
  if (!raceName) return '古馬戦'
  return RACE_3YO_KEYWORDS.some((kw) => raceName.includes(kw)) ? '3歳戦' : '古馬戦'
}

type FormationV9DebugRow = {
  horseName: string
  paceFit: number
  distanceFit: number
  jockeyScore: number
  stabilityComponent: number
  himoScoreV8: number
  himoScoreV9: number
  isHimo: boolean
  wasHimoV8: boolean   // v8 でヒモだったか（入れ替わり検出用）
}

type FormationV9Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    raceType: RaceType3
    axisTypeV7: AxisType
    himoCount: number
    rows: FormationV9DebugRow[]
  }
}

function computeFormationV9(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
  raceName: string | null | undefined,
  jockeyScoreMap: Record<string, number> = {},
): FormationV9Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id
  const raceType = classifyRaceType(raceName)

  const allByAiRank: string[] = formation.axis_horses.length > 0
    ? [...formation.axis_horses, ...formation.himo_horses]
    : formation.himo_horses
  const aiRankIndexMap = new Map(allByAiRank.map((id, i) => [id, i]))

  const axisId  = allByAiRank[0] ?? null
  const rank2Id = allByAiRank[1] ?? null
  const rank4Id = allByAiRank[3] ?? null
  const axisV9  = axisId ? [axisId] : formation.axis_horses

  const getAxisGap = (id: string): number => {
    const idx = aiRankIndexMap.get(id)
    if (idx === undefined) return 1.0
    if (idx === 0) return 0.0
    return Math.abs(1 / (idx + 1) - 1.0)
  }

  const stabilityComp = 1 - stabilityScore / 100

  // axis_confidence (v7 引き継ぎ)
  const computeV5Score = (id: string): number => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    return paceFit * 0.50 + distanceFit * 0.35 + stabilityComp * 0.15
  }
  const top1Score = axisId  ? computeV5Score(axisId)  : 0
  const top2Score = rank2Id ? computeV5Score(rank2Id) : 0
  const top4Score = rank4Id ? computeV5Score(rank4Id) : null
  const axisConfidenceV7 = top4Score !== null
    ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
    : top1Score - top2Score
  const axisTypeV7: AxisType =
    axisConfidenceV7 >= 0.08 ? '軸強い' : axisConfidenceV7 >= 0.04 ? '標準' : '混戦'
  const himoCount = axisTypeV7 === '軸強い' ? 4 : axisTypeV7 === '標準' ? 5 : 6

  // candidate_pool: axis_gap 上位6頭（v7/v8 と同一）
  const nonAxisIds = entries.map((e) => e.horse_id).filter((id) => id !== axisId)
  const candidatePool = nonAxisIds
    .map((id) => ({ id, axisGap: getAxisGap(id) }))
    .sort((a, b) => a.axisGap - b.axisGap)
    .slice(0, 6)
    .map((c) => c.id)

  // レースタイプ別の重み
  const W = raceType === '3歳戦'
    ? { pace: 0.40, dist: 0.25, jockey: 0.25, stability: 0.10 }
    : { pace: 0.45, dist: 0.35, jockey: 0.10, stability: 0.10 }

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE

    const himoScoreV8 = paceFit * 0.40 + distanceFit * 0.30 + jockeyScore * 0.20 + stabilityComp * 0.10
    const himoScoreV9 = paceFit * W.pace + distanceFit * W.dist + jockeyScore * W.jockey + stabilityComp * W.stability

    return { id, axisGap: getAxisGap(id), paceFit, distanceFit, jockeyScore, himoScoreV8, himoScoreV9 }
  })

  // v8 でのヒモ集合（比較用）
  const scoredByV8 = [...scored].sort((a, b) => b.himoScoreV8 - a.himoScoreV8)
  const himoV8Set = new Set(scoredByV8.slice(0, himoCount).map((s) => s.id))

  scored.sort((a, b) => b.himoScoreV9 - a.himoScoreV9)
  const himoV9  = scored.slice(0, himoCount).map((s) => s.id)
  const himoSet = new Set(himoV9)

  const rows: FormationV9DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    jockeyScore: s.jockeyScore,
    stabilityComponent: stabilityComp,
    himoScoreV8: s.himoScoreV8,
    himoScoreV9: s.himoScoreV9,
    isHimo: himoSet.has(s.id),
    wasHimoV8: himoV8Set.has(s.id),
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV9, himo_horses: himoV9 },
    debug: { pace, raceType, axisTypeV7, himoCount, rows },
  }
}

// ─── Formation V9.1 ───────────────────────────────────────────────────────────
// v9 思想を維持しつつ jockey 重み差を圧縮
// v9  3歳戦: jockey 0.25 / 古馬戦: jockey 0.10  → 差 0.15
// v9.1 3歳戦: jockey 0.22 / 古馬戦: jockey 0.15  → 差 0.07（圧縮）

type FormationV9_1DebugRow = {
  horseName: string
  paceFit: number
  distanceFit: number
  jockeyScore: number
  closingScore: number
  stabilityComponent: number
  himoScoreV9: number    // 比較用
  himoScoreV9_1: number
  bloodlineBonus: number
  weightAdj: number
  groundStrength: number
  isHimo: boolean
  wasHimoV9: boolean     // v9 でヒモだったか
}

type AxisDebugRow = {
  horseName: string
  axisScore: number
  paceFit: number
  distanceFit: number
  jockeyScore: number
  closingScore: number
  bloodlineBonus: number
  weightAdj: number
  groundStrength: number
  isSelected: boolean  // 実際に軸として選ばれたか
}

type FormationV9_1Result = {
  formation: FormationResponse
  debug: {
    pace: PaceType
    raceType: RaceType3
    jockeyWeight: number   // 今バージョンの jockey 重み
    axisTypeV7: AxisType
    himoCount: number
    rows: FormationV9_1DebugRow[]
    axisScore: number
    axisName: string
    axisRows: AxisDebugRow[]
  }
}

function computeFormationV9_1(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
  raceName: string | null | undefined,
  venue: string | null | undefined = null,
  jockeyScoreMap: Record<string, number> = {},
  horseFormRecords: HorseFormRecord[] = [],
  applyDiversity = false,
): FormationV9_1Result {
  if (entries.length === 0) return { formation: { race_id: '', race_structure_score: 0, axis_count: 0, axis_horses: [], himo_horses: [], ticket_count: 0 }, debug: { pace, raceType: '古馬戦', jockeyWeight: 0.13, axisTypeV7: '混戦', himoCount: 6, rows: [], axisScore: 0, axisName: '—', axisRows: [] } }
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id
  const raceType = classifyRaceType(raceName)
  const stabilityComp = 1 - stabilityScore / 100

  // v9.1 では RPC の軸順に依存せず、独自スコアで全馬をランキングして軸を決定
  // paceFit は 0.5 + rawAdj*2 で正規化（deep_closer が fast で 1.0 固定になるのを防ぐ）
  // 騎手は小さい重みで補助的に加味（同脚質内の優劣をつけるため）
  const computeAxisDetail = (id: string) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = 0.5 + rawAdj * 2                          // 0.34〜0.70 の範囲に圧縮
    const distanceFit = getDistanceFitScore(style, distanceM)
    const venueAdj = getVenueStyleAdjustment(venue, style, distanceM)
    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE
    const closingScore = getClosingSpeedScore(entry?.last3f_1 ?? null, entry?.last3f_2 ?? null, entry?.last3f_3 ?? null)
    const horse = horses.find((h) => h.id === id)
    const bloodlineBonus = getBloodlineFitBonus(horse?.father_line ?? null, horse?.damsire_line ?? null, distanceM)
    const weightAdj = getWeightAdjustment(entry?.weight_kg ?? null)
    const groundStrength = getGroundStrengthScore(id, horseFormRecords, distanceM)
    const axisScore = paceFit * 0.35 + distanceFit * 0.35 + jockeyScore * 0.10 + closingScore * 0.10 + venueAdj + stabilityComp * 0.10 + bloodlineBonus + weightAdj + groundStrength
    return { id, axisScore, paceFit, distanceFit, jockeyScore, closingScore, bloodlineBonus, weightAdj, groundStrength }
  }

  const allSorted = entries
    .map((e) => computeAxisDetail(e.horse_id))
    .sort((a, b) => b.axisScore - a.axisScore)

  const axisId    = allSorted[0]?.id ?? null
  const top1Score = allSorted[0]?.axisScore ?? 0
  const top2Score = allSorted[1]?.axisScore ?? 0
  const top4Score = allSorted[3]?.axisScore ?? null

  const axisConfidenceV7 = top4Score !== null
    ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
    : top1Score - top2Score
  const axisTypeV7: AxisType =
    axisConfidenceV7 >= 0.08 ? '軸強い' : axisConfidenceV7 >= 0.04 ? '標準' : '混戦'
  const himoCount = axisTypeV7 === '軸強い' ? 4 : axisTypeV7 === '標準' ? 5 : 6

  const axisV9_1 = axisId ? [axisId] : formation.axis_horses

  // ヒモ候補 = 軸以外の全馬（RPC の axis_gap フィルタ不要）
  const candidatePool = entries.map((e) => e.horse_id).filter((id) => id !== axisId)

  // v9 の重み（比較スコア算出用）
  const Wv9 = raceType === '3歳戦'
    ? { pace: 0.40, dist: 0.25, jockey: 0.25, stability: 0.10 }
    : { pace: 0.45, dist: 0.35, jockey: 0.10, stability: 0.10 }

  // v9.1 の重み（closing speed 追加・再配分後）
  const W = raceType === '3歳戦'
    ? { pace: 0.35, dist: 0.25, jockey: 0.20, closing: 0.10, stability: 0.10 }
    : { pace: 0.38, dist: 0.29, jockey: 0.13, closing: 0.10, stability: 0.10 }

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE
    const closingScore = getClosingSpeedScore(entry?.last3f_1 ?? null, entry?.last3f_2 ?? null, entry?.last3f_3 ?? null)

    const himoScoreV9   = paceFit * Wv9.pace + distanceFit * Wv9.dist + jockeyScore * Wv9.jockey + stabilityComp * Wv9.stability
    const venueAdj = getVenueStyleAdjustment(venue, style, distanceM)
    const horse = horses.find((h) => h.id === id)
    const bloodlineBonus = getBloodlineFitBonus(horse?.father_line ?? null, horse?.damsire_line ?? null, distanceM)
    const weightAdj = getWeightAdjustment(entry?.weight_kg ?? null)
    const groundStrength = getGroundStrengthScore(id, horseFormRecords, distanceM)
    const himoScoreV9_1 = paceFit * W.pace + distanceFit * W.dist + jockeyScore * W.jockey + closingScore * W.closing + stabilityComp * W.stability + venueAdj + bloodlineBonus + weightAdj + groundStrength

    return { id, paceFit, distanceFit, jockeyScore, closingScore, himoScoreV9, himoScoreV9_1, bloodlineBonus, weightAdj, groundStrength }
  })

  // v9 でのヒモ集合（比較用）
  const scoredByV9 = [...scored].sort((a, b) => b.himoScoreV9 - a.himoScoreV9)
  const himoV9Set = new Set(scoredByV9.slice(0, himoCount).map((s) => s.id))

  scored.sort((a, b) => b.himoScoreV9_1 - a.himoScoreV9_1)
  const himoV9_1 = applyDiversity
    ? selectHimoDiverse(
        scored.map((s) => ({ id: s.id, score: s.himoScoreV9_1 })),
        himoCount,
        (id) => horses.find((h) => h.id === id)?.style ?? null,
      )
    : scored.slice(0, himoCount).map((s) => s.id)
  const himoSet  = new Set(himoV9_1)

  const rows: FormationV9_1DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    jockeyScore: s.jockeyScore,
    closingScore: s.closingScore,
    stabilityComponent: stabilityComp,
    himoScoreV9: s.himoScoreV9,
    himoScoreV9_1: s.himoScoreV9_1,
    bloodlineBonus: s.bloodlineBonus,
    weightAdj: s.weightAdj,
    groundStrength: s.groundStrength,
    isHimo: himoSet.has(s.id),
    wasHimoV9: himoV9Set.has(s.id),
  }))

  const axisRows: AxisDebugRow[] = allSorted.slice(0, 3).map((s) => ({
    horseName: resolveName(s.id),
    axisScore: s.axisScore,
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    jockeyScore: s.jockeyScore,
    closingScore: s.closingScore,
    bloodlineBonus: s.bloodlineBonus,
    weightAdj: s.weightAdj,
    groundStrength: s.groundStrength,
    isSelected: s.id === axisId,
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV9_1, himo_horses: himoV9_1 },
    debug: { pace, raceType, jockeyWeight: W.jockey, axisTypeV7, himoCount, rows, axisScore: top1Score, axisName: resolveName(axisId ?? ''), axisRows },
  }
}

// ─── v9.2: 脚質別上がり補正版 ─────────────────────────────────────────────────
// v9.1との差分: closingScore → getStyleAdjustedClosingScore（逃げ・先行の下限0.5）

function computeFormationV9_2(
  formation: FormationResponse,
  horses: Horse[],
  entries: Entry[],
  pace: PaceType,
  stabilityScore: number,
  distanceM: number | null,
  raceName: string | null | undefined,
  venue: string | null | undefined = null,
  jockeyScoreMap: Record<string, number> = {},
  horseFormRecords: HorseFormRecord[] = [],
  applyDiversity = false,
): FormationV9_1Result {
  const resolveName = (id: string) => horses.find((h) => h.id === id)?.name ?? id
  const raceType = classifyRaceType(raceName)
  const stabilityComp = 1 - stabilityScore / 100

  const computeAxisDetail = (id: string) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = 0.5 + rawAdj * 2
    const distanceFit = getDistanceFitScore(style, distanceM)
    const venueAdj = getVenueStyleAdjustment(venue, style, distanceM)
    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE
    const closingScore = getStyleAdjustedClosingScore(entry?.last3f_1 ?? null, entry?.last3f_2 ?? null, entry?.last3f_3 ?? null, style)
    const horse = horses.find((h) => h.id === id)
    const bloodlineBonus = getBloodlineFitBonus(horse?.father_line ?? null, horse?.damsire_line ?? null, distanceM)
    const weightAdj = getWeightAdjustment(entry?.weight_kg ?? null)
    const groundStrength = getGroundStrengthScore(id, horseFormRecords, distanceM)
    const axisScore = paceFit * 0.35 + distanceFit * 0.35 + jockeyScore * 0.10 + closingScore * 0.10 + venueAdj + stabilityComp * 0.10 + bloodlineBonus + weightAdj + groundStrength
    return { id, axisScore, paceFit, distanceFit, jockeyScore, closingScore, bloodlineBonus, weightAdj, groundStrength }
  }

  const allSorted = entries
    .map((e) => computeAxisDetail(e.horse_id))
    .sort((a, b) => b.axisScore - a.axisScore)

  const axisId    = allSorted[0]?.id ?? null
  const top1Score = allSorted[0]?.axisScore ?? 0
  const top2Score = allSorted[1]?.axisScore ?? 0
  const top4Score = allSorted[3]?.axisScore ?? null

  const axisConfidence = top4Score !== null
    ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
    : top1Score - top2Score
  const axisTypeV7: AxisType =
    axisConfidence >= 0.08 ? '軸強い' : axisConfidence >= 0.04 ? '標準' : '混戦'
  const himoCount = axisTypeV7 === '軸強い' ? 4 : axisTypeV7 === '標準' ? 5 : 6

  const axisV9_2 = axisId ? [axisId] : formation.axis_horses
  const candidatePool = entries.map((e) => e.horse_id).filter((id) => id !== axisId)

  const Wv9_1 = raceType === '3歳戦'
    ? { pace: 0.35, dist: 0.25, jockey: 0.20, closing: 0.10, stability: 0.10 }
    : { pace: 0.38, dist: 0.29, jockey: 0.13, closing: 0.10, stability: 0.10 }

  const scored = candidatePool.map((id) => {
    const style = horses.find((h) => h.id === id)?.style ?? null
    const rawAdj = getPaceAdjustment(style, pace)
    const paceFit = (rawAdj + 0.08) / 0.18
    const distanceFit = getDistanceFitScore(style, distanceM)
    const entry = entries.find((e) => e.horse_id === id)
    const rawJockeyName = entry?.jockey_name ?? ''
    const jockeyScore = rawJockeyName ? (jockeyScoreMap[rawJockeyName] ?? JOCKEY_DEFAULT_SCORE) : JOCKEY_DEFAULT_SCORE
    const closingRaw = getClosingSpeedScore(entry?.last3f_1 ?? null, entry?.last3f_2 ?? null, entry?.last3f_3 ?? null)
    const closingScore = getStyleAdjustedClosingScore(entry?.last3f_1 ?? null, entry?.last3f_2 ?? null, entry?.last3f_3 ?? null, style)
    const venueAdj = getVenueStyleAdjustment(venue, style, distanceM)

    const horse = horses.find((h) => h.id === id)
    const bloodlineBonus = getBloodlineFitBonus(horse?.father_line ?? null, horse?.damsire_line ?? null, distanceM)
    const weightAdj = getWeightAdjustment(entry?.weight_kg ?? null)
    const groundStrength = getGroundStrengthScore(id, horseFormRecords, distanceM)
    const himoScoreV9_1 = paceFit * Wv9_1.pace + distanceFit * Wv9_1.dist + jockeyScore * Wv9_1.jockey + closingRaw * Wv9_1.closing + stabilityComp * Wv9_1.stability + venueAdj
    const himoScoreV9_2 = paceFit * Wv9_1.pace + distanceFit * Wv9_1.dist + jockeyScore * Wv9_1.jockey + closingScore * Wv9_1.closing + stabilityComp * Wv9_1.stability + venueAdj + bloodlineBonus + weightAdj + groundStrength

    return { id, paceFit, distanceFit, jockeyScore, closingScore, himoScoreV9: himoScoreV9_1, himoScoreV9_1: himoScoreV9_2, bloodlineBonus, weightAdj, groundStrength, isHimo: false, wasHimoV9: false }
  })

  const scoredByV9_1 = [...scored].sort((a, b) => b.himoScoreV9 - a.himoScoreV9)
  const himoV9_1Set = new Set(scoredByV9_1.slice(0, himoCount).map((s) => s.id))

  scored.sort((a, b) => b.himoScoreV9_1 - a.himoScoreV9_1)
  const himoV9_2 = applyDiversity
    ? selectHimoDiverse(
        scored.map((s) => ({ id: s.id, score: s.himoScoreV9_1 })),
        himoCount,
        (id) => horses.find((h) => h.id === id)?.style ?? null,
      )
    : scored.slice(0, himoCount).map((s) => s.id)
  const himoSet  = new Set(himoV9_2)

  const rows: FormationV9_1DebugRow[] = scored.map((s) => ({
    horseName: resolveName(s.id),
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    jockeyScore: s.jockeyScore,
    closingScore: s.closingScore,
    stabilityComponent: stabilityComp,
    himoScoreV9: s.himoScoreV9,
    himoScoreV9_1: s.himoScoreV9_1,
    bloodlineBonus: s.bloodlineBonus,
    weightAdj: s.weightAdj,
    groundStrength: s.groundStrength,
    isHimo: himoSet.has(s.id),
    wasHimoV9: himoV9_1Set.has(s.id),
  }))

  const axisRows: AxisDebugRow[] = allSorted.slice(0, 3).map((s) => ({
    horseName: resolveName(s.id),
    axisScore: s.axisScore,
    paceFit: s.paceFit,
    distanceFit: s.distanceFit,
    jockeyScore: s.jockeyScore,
    closingScore: s.closingScore,
    bloodlineBonus: s.bloodlineBonus,
    weightAdj: s.weightAdj,
    groundStrength: s.groundStrength,
    isSelected: s.id === axisId,
  }))

  return {
    formation: { ...formation, axis_count: 1, axis_horses: axisV9_2, himo_horses: himoV9_2 },
    debug: { pace, raceType, jockeyWeight: Wv9_1.jockey, axisTypeV7, himoCount, rows, axisScore: top1Score, axisName: resolveName(axisId ?? ''), axisRows },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RaceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ debug?: string }>
}) {
  const { id } = await params
  const { debug } = await searchParams
  const showDebug = debug === '1'

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  const currentUserId = user?.id ?? ''
  const currentUserEmail = user?.email ?? ''

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? key
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  let race: Race | null = null
  let formation: FormationResponse | null = null
  let horses: Horse[] = []
  let raceResults: RaceResult[] = []
  let entries: Entry[] = []
  let jockeyScoreMap: Record<string, number> = {}
  let horseFormRecords: HorseFormRecord[] = []
  let errorMessage = ''

  try {
    const raceRes = await fetch(
      `${baseUrl}/rest/v1/races?id=eq.${id}&select=id,race_name,date`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
    )
    if (!raceRes.ok) throw new Error(`レース取得失敗: ${raceRes.status}`)
    const raceData = await raceRes.json()
    race = raceData[0] ?? null

    // Fetch extended race metadata (venue, grade, surface, distance_m, start_time).
    // These columns may not exist yet — silently ignore if the request fails.
    if (race) {
      try {
        const extRes = await fetch(
          `${baseUrl}/rest/v1/races?id=eq.${id}&select=venue,grade,surface,distance_m,start_time,is_test,pace_override,description`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
        )
        if (extRes.ok) {
          const extData = await extRes.json()
          race = { ...race, ...(extData[0] ?? {}) }
        }
      } catch { /* extended info is optional */ }
    }

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

    const horseRes = await fetch(`${baseUrl}/rest/v1/horses?select=id,name,father_line,damsire_line`, {
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
    const [resultsRes, entriesRes, jockeyStatsRes] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/race_results?race_id=eq.${id}&select=horse_id,finish_pos`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      }),
      fetch(`${baseUrl}/rest/v1/entries?race_id=eq.${id}&select=horse_id,horse_number,popularity_rank,jockey_name,last3f_1,last3f_2,last3f_3,finish_position,weight_kg`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      }),
      fetch(`${baseUrl}/rest/v1/jockey_stats?select=jockey_name,place3_rate`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store',
      }),
    ])
    if (resultsRes.ok) raceResults = await resultsRes.json()
    if (entriesRes.ok) entries = await entriesRes.json()
    if (jockeyStatsRes.ok) {
      const stats: JockeyStat[] = await jockeyStatsRes.json()
      jockeyScoreMap = Object.fromEntries(stats.map((s) => [s.jockey_name, s.place3_rate]))
    }

    // Fetch running style from horse_style_profiles and merge into horses array
    const raceHorseIdList = entries.map((e) => e.horse_id)
    if (raceHorseIdList.length > 0) {
      const [styleRes, formRes] = await Promise.all([
        fetch(
          `${baseUrl}/rest/v1/horse_style_profiles?horse_id=in.(${raceHorseIdList.join(',')})&select=horse_id,style`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
        ),
        fetch(
          `${baseUrl}/rest/v1/horse_past_results?horse_id=in.(${raceHorseIdList.join(',')})&select=horse_id,finish_pos,grade,distance_m,field_size`,
          { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' }
        ),
      ])
      if (styleRes.ok) {
        const profiles: { horse_id: string; style: RunningStyle }[] = await styleRes.json()
        const styleMap = new Map(profiles.map((p) => [p.horse_id, p.style]))
        horses = horses.map((h) => ({ ...h, style: styleMap.get(h.id) ?? null }))
      }
      if (formRes.ok) {
        horseFormRecords = await formRes.json()
      }
    }
  } catch {
    // results/entries are optional — page renders without them
  }

  const getHorseName = (horseId: string) =>
    horses.find((h) => h.id === horseId)?.name ?? horseId

  // 枠順（馬番）が1頭以上確定していれば確定済みとみなす
  const isDrawComplete = entries.some((e) => e.horse_number !== null)

  // Full race field: use all entered horses for pace calculation.
  // Fall back to formation horses only when entries haven't loaded.
  const raceHorseIds = entries.length > 0
    ? entries.map((e) => e.horse_id)
    : [...(formation?.axis_horses ?? []), ...(formation?.himo_horses ?? [])]

  // Compute pace and stability once so they can be shared across ranking, v2 logic, etc.
  const paceInfo = computePaceOutlook(raceHorseIds, horses, race?.distance_m ?? null)
  const computedPace: PaceType = formation ? paceInfo.pace : 'balanced'
  const pace: PaceType = (race?.pace_override as PaceType | null) ?? computedPace
  const earlyStabilityScore = computeRaceStabilityScore(
    paceInfo.frontCount, paceInfo.stalkerCount, paceInfo.closerCount, paceInfo.deepCloserCount, raceHorseIds.length,
  )

  // 検証レース（is_test=true）のみ v2/v3/v4/v5 を実行。本番レースは不変。
  // v2〜v5 はデバッグ比較用に残し、実際の表示には v6 を使用する。
  let formationV2Debug: FormationV2Result['debug'] | null = null
  let formationV3Debug: FormationV3Result['debug'] | null = null
  let formationV4Debug: FormationV4Result['debug'] | null = null
  let formationV5Debug: FormationV5Result['debug'] | null = null
  let formationV6Debug: FormationV6Result['debug'] | null = null
  let formationV7Debug: FormationV7Result['debug'] | null = null
  let formationV8Debug: FormationV8Result['debug'] | null = null
  let formationV9Debug: FormationV9Result['debug'] | null = null
  let formationV9_1Debug: FormationV9_1Result['debug'] | null = null
  let formationV9_2Debug: FormationV9_1Result['debug'] | null = null
  if ((race?.is_test || showDebug) && formation) {
    const origFormation = formation  // v2〜v9.1 すべて同じ RPC 結果から計算
    const v2Result = computeFormationV2(origFormation, horses, entries, pace, earlyStabilityScore)
    formationV2Debug = v2Result.debug
    const v3Result = computeFormationV3(origFormation, horses, entries, pace)
    formationV3Debug = v3Result.debug
    const v4Result = computeFormationV4(origFormation, horses, entries, pace)
    formationV4Debug = v4Result.debug
    const v5Result = computeFormationV5(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null)
    formationV5Debug = v5Result.debug
    const v6Result = computeFormationV6(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null)
    formationV6Debug = v6Result.debug
    const v7Result = computeFormationV7(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null)
    formationV7Debug = v7Result.debug
    const v8Result = computeFormationV8(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null, jockeyScoreMap)
    formationV8Debug = v8Result.debug
    const v9Result = computeFormationV9(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null, race?.race_name ?? null, jockeyScoreMap)
    formationV9Debug = v9Result.debug
    const applyDiv = (race?.date ?? '') >= DIVERSITY_RULE_START_DATE
    const v9_1Result = computeFormationV9_1(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null, race?.race_name ?? null, race?.venue ?? null, jockeyScoreMap, horseFormRecords, applyDiv)
    formationV9_1Debug = v9_1Result.debug
    formation = v9_1Result.formation  // v9.1 を実際の表示に使用
    const v9_2Result = computeFormationV9_2(origFormation, horses, entries, pace, earlyStabilityScore, race?.distance_m ?? null, race?.race_name ?? null, race?.venue ?? null, jockeyScoreMap, horseFormRecords, applyDiv)
    formationV9_2Debug = v9_2Result.debug
  }

  // 本番レース（is_test=false）でも 2026-03-16 以降はv9.1を適用
  if (!race?.is_test && race?.date != null && race.date >= '2026-03-16' && formation) {
    const applyDiv = race.date >= DIVERSITY_RULE_START_DATE
    const v9_1Result = computeFormationV9_1(formation, horses, entries, pace, earlyStabilityScore, race.distance_m ?? null, race.race_name ?? null, race.venue ?? null, jockeyScoreMap, horseFormRecords, applyDiv)
    formation = v9_1Result.formation
  }

  // みんなの予想ピックを取得
  type RacePick = { id: string; user_email: string; horse_ids: string[] }
  let racePicks: RacePick[] = []
  try {
    const picksRes = await fetch(
      `${baseUrl}/rest/v1/race_picks?race_id=eq.${id}&select=id,user_email,horse_ids`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' }
    )
    if (picksRes.ok) racePicks = await picksRes.json()
  } catch {}

  // ヒモは v9.1 のヒモスコア順（選出順）をそのまま使う
  // ※ 旧: getPaceAdjustment で再ソートしていたが、pace が既にスコアに織り込み済みのため不要
  const paceAdjustedHimo = formation?.himo_horses ?? []

  const formationHorseIds = new Set([
    ...(formation?.axis_horses ?? []),
    ...(formation?.himo_horses ?? []),
  ])
  const otherRaceHorses = entries
    .map((e) => e.horse_id)
    .filter((id) => !formationHorseIds.has(id))
    .sort((a, b) => {
      const adjA = getPaceAdjustment(horses.find((h) => h.id === a)?.style ?? null, pace)
      const adjB = getPaceAdjustment(horses.find((h) => h.id === b)?.style ?? null, pace)
      return adjB - adjA
    })

  const allRankedHorses = [
    ...(formation?.axis_horses ?? []).map((id) => ({ id, role: 'axis' as const })),
    ...paceAdjustedHimo.map((id) => ({ id, role: 'himo' as const })),
    ...otherRaceHorses.map((id) => ({ id, role: 'other' as const })),
  ]

  // Race info chip helpers
  const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']
  const raceDateFmt = race
    ? (() => {
        const d = new Date(race.date + 'T12:00:00')
        const dow = DAY_NAMES[d.getDay()]
        const dowColor = d.getDay() === 0 ? '#F87171' : d.getDay() === 6 ? '#60A5FA' : '#62627A'
        return { label: `${d.getMonth() + 1}/${d.getDate()}`, dow, dowColor }
      })()
    : null
  const raceGradeColor = !race?.grade ? null
    : race.grade === 'G1' ? '#FBBF24'
    : race.grade === 'G2' ? '#C0C8D0'
    : race.grade === 'G3' ? '#14B8A6'
    : '#14B8A6'
  const normalizeSurface = (s: string) =>
    s === 'turf' ? '芝' : s === 'dirt' ? 'ダート' : s
  const raceSurfaceColor = !race?.surface ? null
    : (race.surface === '芝' || race.surface === 'turf') ? '#166534'
    : (race.surface === 'ダート' || race.surface === 'dirt') ? '#FB923C'
    : null

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0C0D14',
        color: '#EEEEF5',
        fontFamily: 'var(--font-geist-sans), -apple-system, Inter, Arial, sans-serif',
      }}
    >
      {/* ── Hero header ───────────────────────────────────────────────── */}
      {/* ── Top bar ────────────────────────────────────────────────── */}
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
        <a href="/" className="back-link" style={{ color: '#9A9591' }}>
          <ChevronLeft size={14} strokeWidth={2} />
          レース一覧
        </a>
        {race && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: '#C8C4C0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {race.race_name}
            </span>
          </>
        )}
      </div>

      {/* ── Race hero ────────────────────────────────────────────────── */}
      {race && (
        <div style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '32px 20px 28px',
          maxWidth: 720,
          margin: '0 auto',
        }}>
          <p style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#14B8A6',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            Race Analysis
          </p>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            color: '#EEEEF5',
            letterSpacing: '-0.02em',
          }}>
            {race.race_name}
          </h1>
          <p style={{ color: '#9898B0', marginTop: 6, marginBottom: 14, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {raceDateFmt?.label}<span style={{ color: raceDateFmt?.dowColor }}>({raceDateFmt?.dow})</span>
          </p>

          {/* ── Race info chips ─────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {race.grade && raceGradeColor && (
              <span style={{
                padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                background: `${raceGradeColor}1A`, color: raceGradeColor,
                border: `1px solid ${raceGradeColor}55`,
              }}>
                {race.grade}
              </span>
            )}
            {race.venue && (
              <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.10)' }}>
                {race.venue}
              </span>
            )}
            {race.surface && (
              <span style={{
                padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                background: raceSurfaceColor ? `${raceSurfaceColor}14` : 'rgba(255,255,255,0.05)',
                color: raceSurfaceColor ?? '#9898B0',
                border: `1px solid ${raceSurfaceColor ? raceSurfaceColor + '44' : 'rgba(255,255,255,0.10)'}`,
              }}>
                {normalizeSurface(race.surface)}
              </span>
            )}
            {race.distance_m && (
              <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.10)' }}>
                {race.distance_m}m
              </span>
            )}
            {race.start_time && (
              <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.10)' }}>
                {race.start_time.slice(0, 5)}発走
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── レース紹介文 ─────────────────────────────────────────────── */}
        {race?.description && (
          <p style={{ fontSize: 13, color: '#9898B0', lineHeight: 1.85, margin: '0 0 24px' }}>
            {race.description}
          </p>
        )}

        {errorMessage && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#DC2626',
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
            'AI予想':     <Brain size={15} color="#14B8A6" strokeWidth={2} />,
            'AIの見解':   <Brain size={15} color="#14B8A6" strokeWidth={2} />,
            'レース展開': <TrendingUp size={15} color="#14B8A6" strokeWidth={2} />,
            '期待値分析': <Gem size={15} color="#14B8A6" strokeWidth={2} />,
          }
          const chapterHeader = (label: string) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 32, marginBottom: 16 }}>
              {CHAPTER_ICONS[label] && (
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {CHAPTER_ICONS[label]}
                </span>
              )}
              <span style={{ fontSize: 16, fontWeight: 700, color: '#EEEEF5', letterSpacing: '-0.02em' }}>
                {label}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
          )

          // ── Pre-computed shared values ──────────────────────────────────────
          const paceInfo = computePaceOutlook(raceHorseIds, horses, race?.distance_m ?? null)
          const paceMeta = PACE_INFO[paceInfo.pace]
          const paceCounts: { label: string; count: number; style: RunningStyle }[] = [
            { label: '逃げ', count: paceInfo.frontCount,      style: 'front' },
            { label: '先行', count: paceInfo.stalkerCount,    style: 'stalker' },
            { label: '差し', count: paceInfo.closerCount,     style: 'closer' },
            { label: '追込', count: paceInfo.deepCloserCount, style: 'deep_closer' },
          ]
          const raceStabilityScore = computeRaceStabilityScore(
            paceInfo.frontCount,
            paceInfo.stalkerCount,
            paceInfo.closerCount,
            paceInfo.deepCloserCount,
            raceHorseIds.length,
          )
          const stabilityLevel = getLevel(raceStabilityScore)
          const stabilityStrategy = getStrategy(raceStabilityScore)

          const { betType } = getBetPlanInfo(formation, horses, pct)
          const himoHorses = formation.himo_horses.map((hid, i) => ({
            id: hid,
            name: horses.find((h) => h.id === hid)?.name ?? hid,
            number: entries.find((e) => e.horse_id === hid)?.horse_number ?? null,
            aiEval: Math.max(10, Math.round(22 - i * 2)),
          }))
          const top3HorseIds = raceResults.length > 0
            ? raceResults
                .filter((r) => r.finish_pos >= 1 && r.finish_pos <= 3)
                .sort((a, b) => a.finish_pos - b.finish_pos)
                .map((r) => r.horse_id)
            : []
          // axis_confidence を軸説明文に使うため簡易計算
          const allAxisIds = allRankedHorses.map((h) => h.id)
          const computeV5ForReason = (id: string): number => {
            const h = horses.find((hh) => hh.id === id)
            const s = h?.style ?? null
            const rawAdj = getPaceAdjustment(s, pace)
            const paceFit = (rawAdj + 0.08) / 0.18
            const distFit = getDistanceFitScore(s, race?.distance_m ?? null)
            const stabilityComp = 1 - raceStabilityScore / 100
            return paceFit * 0.50 + distFit * 0.35 + stabilityComp * 0.15
          }
          const top1Score = allAxisIds[0] ? computeV5ForReason(allAxisIds[0]) : 0
          const top2Score = allAxisIds[1] ? computeV5ForReason(allAxisIds[1]) : 0
          const top4Score = allAxisIds[3] ? computeV5ForReason(allAxisIds[3]) : null
          const axisConf = top4Score !== null
            ? (top1Score - top2Score) * 0.7 + (top1Score - top4Score) * 0.3
            : top1Score - top2Score
          const axisConfLevel: AxisType = axisConf >= 0.08 ? '軸強い' : axisConf >= 0.04 ? '標準' : '混戦'

          const axisDetails = formation.axis_horses.map((id, i) => {
            const horse = horses.find((h) => h.id === id)
            const style = horse?.style ?? null
            const distanceFitScore = getDistanceFitScore(style, race?.distance_m ?? null)
            return {
              name: horse?.name ?? id,
              horseNumber: entries.find((e) => e.horse_id === id)?.horse_number ?? null,
              styleLabel: style ? STYLE_LABELS[style] : null,
              styleColor: style ? STYLE_COLORS[style] : null,
              aiEval: Math.max(15, Math.round(25 + pct * 0.15 - i * 3)),
              reason: buildAxisReason(style, pace, raceStabilityScore, i, distanceFitScore, axisConfLevel),
            }
          })

          const advantageHorses = getPaceAdvantageHorses(raceHorseIds, horses, pace)
          const { candidate: valueHorse, nextBest: valueNextBest } = getValueOpportunity(formation, horses, pace, allRankedHorses, entries)
          const aiSummaryLines = buildAiSummary(
            raceStabilityScore, pace, advantageHorses, valueHorse,
            race?.distance_m ?? null, race?.grade ?? null,
            paceInfo.frontCount,
            axisDetails[0]?.name ?? null, axisConfLevel,
          )

          const favoredStyles = [...new Set(advantageHorses.map((h) => STYLE_LABELS[h.style]))]

          return (
            <>
              {/* ── Chapter 1: AI予想 ────────────────────────────────────── */}
              {chapterHeader('AI予想')}

              <BetPlanPanel
                betType={betType}
                allHimoHorses={himoHorses}
                axisCount={formation.axis_count}
                stabilityScore={raceStabilityScore}
                pace={pace}
                axisDetails={axisDetails}
                axisHorseIds={formation.axis_horses}
                top3HorseIds={top3HorseIds}
                isDrawComplete={isDrawComplete}
              />

              {/* ── DEBUGパネル（?debug=1 で表示） ──────────────────────── */}
              {showDebug && formationV2Debug && (() => {
                const ROLE_COLOR: Record<string, string> = {
                  '軸':           '#14B8A6',
                  '実力ヒモ':     '#166534',
                  '穴ヒモ':       '#92400E',
                  '穴候補（落選）': '#62627A',
                }
                return (
                  <div style={{
                    marginTop: 12,
                    background: 'rgba(251,191,36,0.04)',
                    border: '1px solid rgba(251,191,36,0.15)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v2 穴スコア内訳
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 12px', lineHeight: 1.6 }}>
                      stabilityScore = <strong style={{ color: '#EEEEF5' }}>{formationV2Debug.stabilityScore}</strong>（レース共通・0〜100）
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV2Debug.pace}</strong>
                    </p>
                    {/* ヘッダー行 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 72px', gap: 4, padding: '4px 6px', marginBottom: 4 }}>
                      {['馬名', 'pace_fit', 'pop_rank', 'stability', 'hole_score'].map((h) => (
                        <span key={h} style={{ fontSize: 10, color: '#62627A', fontWeight: 600, textAlign: 'right' }}>{h}</span>
                      ))}
                    </div>
                    {formationV2Debug.rows.map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 60px 60px 60px 72px',
                          gap: 4,
                          padding: '5px 6px',
                          borderRadius: 6,
                          background: row.role === '穴ヒモ' ? 'rgba(251,191,36,0.07)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: 12, color: ROLE_COLOR[row.role] ?? '#9898B0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.horseName}
                          {row.aiRank !== null && (
                            <span style={{ fontSize: 10, color: '#62627A', marginLeft: 5 }}>AI{row.aiRank}位</span>
                          )}
                          <span style={{ fontSize: 10, color: ROLE_COLOR[row.role] ?? '#62627A', marginLeft: 5 }}>[{row.role}]</span>
                        </span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {row.paceFitScore.toFixed(3)}
                        </span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {row.popularityRank}
                        </span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {(1 - formationV2Debug.stabilityScore / 100).toFixed(3)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: row.role === '穴ヒモ' ? 700 : 400, color: row.role === '穴ヒモ' ? '#92400E' : '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {row.holeScore.toFixed(4)}
                        </span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      hole_score = pace_fit×0.5 + (1/pop_rank)×0.3 + stability×0.2
                    </p>
                  </div>
                )
              })()}

              {/* ── v3 デバッグパネル（検証レースのみ表示） ─────────────── */}
              {showDebug && formationV3Debug && (() => {
                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(52,211,153,0.03)',
                    border: '1px solid rgba(52,211,153,0.15)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v3 穴スコア内訳
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 12px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV3Debug.pace}</strong>
                      　　stability 項を廃止し popularity_component + axis_gap_component に変更
                    </p>
                    {/* ヘッダー行 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 60px 60px 60px 72px 44px', gap: 3, padding: '4px 6px', marginBottom: 4 }}>
                      {['馬名', 'pace_fit', 'pop', 'pop_comp', 'axis_raw', 'axis_gap', 'score_v3', '穴'].map((h) => (
                        <span key={h} style={{ fontSize: 10, color: '#62627A', fontWeight: 600, textAlign: 'right' }}>{h}</span>
                      ))}
                    </div>
                    {formationV3Debug.rows.map((row, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 52px 52px 60px 60px 60px 72px 44px',
                          gap: 3,
                          padding: '5px 6px',
                          borderRadius: 6,
                          background: row.selected ? 'rgba(52,211,153,0.07)' : 'transparent',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: 12, color: row.selected ? '#166534' : '#9898B0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.horseName}
                        </span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFitScore.toFixed(3)}</span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.popularityRank}</span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.popularityComponent.toFixed(3)}</span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.predAxisScoreRaw.toFixed(3)}</span>
                        <span style={{ fontSize: 11, color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.axisGapComponent.toFixed(3)}</span>
                        <span style={{ fontSize: 12, fontWeight: row.selected ? 700 : 400, color: row.selected ? '#166534' : '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                          {row.holeScoreV3.toFixed(4)}
                        </span>
                        <span style={{ fontSize: 11, color: row.selected ? '#166534' : '#62627A', textAlign: 'right' }}>
                          {row.selected ? '◎穴' : '—'}
                        </span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      score_v3 = pace_fit×0.45 + pop_comp×0.35 + axis_gap×0.20　／　pop_comp = min(pop/16, 1)　／　axis_gap = 1 − norm(1/(AI rank))
                    </p>
                  </div>
                )
              })()}

              {/* ── v4 デバッグパネル（検証レースのみ表示） ─────────────── */}
              {showDebug && formationV4Debug && (() => {
                const ROLE_COLOR: Record<FormationV4DebugRow['role'], string> = {
                  '軸':             '#14B8A6',
                  '実力ヒモ':       '#166534',
                  '人気相手':       '#2563EB',
                  '穴ヒモ（v4）':   '#92400E',
                  '穴候補（v4落選）': '#62627A',
                }
                // v3 と v4 の himo を比較（名前の集合差）
                const v3Set = new Set(formationV4Debug.himoV3Names)
                const v4Set = new Set(formationV4Debug.himoV4Names)
                const addedInV4   = formationV4Debug.himoV4Names.filter((n) => !v3Set.has(n))
                const removedInV4 = formationV4Debug.himoV3Names.filter((n) => !v4Set.has(n))

                // 1〜3着確認用
                const top3Ids = raceResults
                  .filter((r) => r.finish_pos <= 3)
                  .sort((a, b) => a.finish_pos - b.finish_pos)
                  .map((r) => r.horse_id)
                const v4AllIds = new Set([
                  ...(formation?.axis_horses ?? []),
                  ...(formation?.himo_horses ?? []),
                ])

                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(96,165,250,0.03)',
                    border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v4 相手選定（改）
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 14px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV4Debug.pace}</strong>
                      　　実力ヒモ 2頭 + 人気相手 1頭 + 穴ヒモ 2頭
                    </p>

                    {/* ── v3 vs v4 比較 ─────────────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      相手一覧の比較
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {(['v3', 'v4'] as const).map((ver) => {
                        const names = ver === 'v3' ? formationV4Debug.himoV3Names : formationV4Debug.himoV4Names
                        const otherSet = ver === 'v3' ? v4Set : v3Set
                        return (
                          <div key={ver} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: ver === 'v3' ? '#166534' : '#2563EB', margin: '0 0 8px', letterSpacing: '0.04em' }}>
                              {ver.toUpperCase()} 相手（{names.length}頭）
                            </p>
                            {names.map((n, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{
                                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                  background: otherSet.has(n) ? 'rgba(255,255,255,0.15)' : (ver === 'v3' ? '#DC2626' : '#2563EB'),
                                }} />
                                <span style={{ fontSize: 12, color: otherSet.has(n) ? '#9898B0' : '#EEEEF5' }}>{n}</span>
                                {!otherSet.has(n) && (
                                  <span style={{ fontSize: 10, color: ver === 'v3' ? '#DC2626' : '#2563EB' }}>
                                    {ver === 'v3' ? '→削除' : '→追加'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                    {(addedInV4.length > 0 || removedInV4.length > 0) && (
                      <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 14px', lineHeight: 1.7 }}>
                        {removedInV4.length > 0 && <span style={{ color: '#DC2626' }}>削除: {removedInV4.join('、')}　</span>}
                        {addedInV4.length > 0 && <span style={{ color: '#2563EB' }}>追加: {addedInV4.join('、')}</span>}
                        {formationV4Debug.ninkiAiteName && <span style={{ color: '#62627A' }}>　（人気相手: {formationV4Debug.ninkiAiteName}）</span>}
                      </p>
                    )}

                    {/* ── 1〜3着チェック ─────────────────── */}
                    {top3Ids.length > 0 && (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                          着順チェック（v4 フォーメーションに含まれるか）
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                          {top3Ids.map((hid, i) => {
                            const name = horses.find((h) => h.id === hid)?.name ?? hid
                            const inFormation = v4AllIds.has(hid)
                            return (
                              <div key={hid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#92400E' : i === 1 ? '#C0C8D0' : '#14B8A6', width: 20, flexShrink: 0 }}>{i + 1}着</span>
                                <span style={{ fontSize: 13, color: '#EEEEF5' }}>{name}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                                  background: inFormation ? 'rgba(22,101,52,0.08)' : 'rgba(248,113,113,0.08)',
                                  color: inFormation ? '#166534' : '#DC2626',
                                  border: `1px solid ${inFormation ? 'rgba(22,101,52,0.25)' : 'rgba(248,113,113,0.2)'}`,
                                }}>
                                  {inFormation ? '✓ 含む' : '✗ なし'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* ── 穴ヒモ候補スコア内訳 ──────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      フォーメーション構成
                    </p>
                    {formationV4Debug.rows.map((row, i) => {
                      const isAna = row.role === '穴ヒモ（v4）' || row.role === '穴候補（v4落選）'
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px',
                          borderRadius: 6, borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: row.role === '穴ヒモ（v4）' ? 'rgba(251,191,36,0.06)' : row.role === '人気相手' ? 'rgba(96,165,250,0.06)' : 'transparent',
                        }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: `${ROLE_COLOR[row.role]}18`, color: ROLE_COLOR[row.role], flexShrink: 0, minWidth: 68, textAlign: 'center' }}>
                            {row.role}
                          </span>
                          <span style={{ fontSize: 12, color: ROLE_COLOR[row.role], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row.horseName}
                          </span>
                          <span style={{ fontSize: 11, color: '#9898B0', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                            {row.popularityRank}番人気
                          </span>
                          {isAna && (
                            <span style={{ fontSize: 11, color: '#9898B0', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                              {row.holeScoreV3.toFixed(4)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      穴スコア（v4 も v3 式を流用）: pace_fit×0.45 + pop_comp×0.35 + axis_gap×0.20
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v5 ─────────────────────────────────────── */}
              {showDebug && formationV5Debug && (() => {
                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(167,139,250,0.03)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v5 ヒモスコア内訳
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 14px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV5Debug.pace}</strong>
                      　　candidate_pool: axis_gap 上位6頭 → himo_score_v5 上位5頭をヒモ採用
                    </p>

                    {/* ── スコア一覧テーブル ─────────────── */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'axis_gap', 'pace_fit', 'distance_fit', 'stability', 'himo_score_v5'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {h}
                              </th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV5Debug.rows.map((row, i) => (
                            <tr key={i} style={{
                              borderBottom: '1px solid rgba(255,255,255,0.04)',
                              background: row.isHimo ? 'rgba(167,139,250,0.06)' : 'transparent',
                            }}>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#A78BFA' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>
                                {row.horseName}
                              </td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.axisGap.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#A78BFA' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV5.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                {row.isHimo && (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)' }}>
                                    ◎ヒモ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      himo_score_v5 = pace_fit×0.50 + distance_fit×0.35 + (1-stability/100)×0.15
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v6: axis_confidence ────────────────────── */}
              {showDebug && formationV6Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = {
                  '軸強い': '#166534',
                  '標準':   '#92400E',
                  '混戦':   '#DC2626',
                }
                const typeColor = AXIS_TYPE_COLOR[formationV6Debug.axisType] ?? '#9898B0'
                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(52,211,153,0.03)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v6 axis_confidence（可変ヒモ頭数）
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 14px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV6Debug.pace}</strong>
                      　　v5スコアを軸馬・AI2位馬にも適用し差をconfidenceとして算出
                    </p>

                    {/* ── confidence サマリ ─────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {/* axis_confidence */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#9898B0', margin: '0 0 4px' }}>axis_confidence</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: typeColor, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                          {formationV6Debug.axisConfidence >= 0 ? '+' : ''}{formationV6Debug.axisConfidence.toFixed(4)}
                        </p>
                      </div>
                      {/* 軸タイプ */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#9898B0', margin: '0 0 4px' }}>軸タイプ</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: typeColor, margin: 0 }}>
                          {formationV6Debug.axisType}
                        </p>
                      </div>
                      {/* ヒモ頭数 */}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#9898B0', margin: '0 0 4px' }}>ヒモ頭数</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#9898B0', margin: 0 }}>
                          {formationV6Debug.himoCount}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>頭</span>
                        </p>
                      </div>
                    </div>

                    {/* ── v5スコア比較（軸 vs AI2位） ──── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      confidence 算出元
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                      {[
                        { label: '軸 (AI1位)', name: formationV6Debug.axisHorseName, score: formationV6Debug.axisHorseScore, highlight: true },
                        { label: 'AI2位', name: formationV6Debug.rank2HorseName, score: formationV6Debug.rank2HorseScore, highlight: false },
                      ].map((row) => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: row.highlight ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: row.highlight ? '#166534' : '#62627A', flexShrink: 0, minWidth: 50 }}>{row.label}</span>
                          <span style={{ fontSize: 12, color: '#EEEEF5', flex: 1 }}>{row.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.highlight ? '#166534' : '#9898B0', fontVariantNumeric: 'tabular-nums' }}>{row.score.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── ヒモスコアテーブル ─────────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      ヒモ候補スコア一覧
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'axis_gap', 'pace_fit', 'dist_fit', 'stability', 'score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV6Debug.rows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: row.isHimo ? 'rgba(52,211,153,0.05)' : 'transparent' }}>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#166534' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>{row.horseName}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.axisGap.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#166534' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV5.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                {row.isHimo && (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(52,211,153,0.15)', color: '#166534', border: '1px solid rgba(52,211,153,0.3)' }}>
                                    ◎ヒモ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      confidence = v5スコア(AI1位) − v5スコア(AI2位) / ヒモ頭数: 軸強い=4, 標準=5, 混戦=6
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v7: axis_confidence 改善版 ─────────────── */}
              {showDebug && formationV7Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = {
                  '軸強い': '#166534',
                  '標準':   '#92400E',
                  '混戦':   '#DC2626',
                }
                const v6Color = AXIS_TYPE_COLOR[formationV7Debug.axisTypeV6] ?? '#9898B0'
                const v7Color = AXIS_TYPE_COLOR[formationV7Debug.axisTypeV7] ?? '#9898B0'
                const changed = formationV7Debug.axisTypeV6 !== formationV7Debug.axisTypeV7
                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(251,191,36,0.03)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#92400E', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v7 axis_confidence（上位4頭スプレッド加味）
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 14px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV7Debug.pace}</strong>
                      　　(top1−top2)×0.7 + (top1−top4)×0.3
                      {formationV7Debug.top4Score === null && <span style={{ color: '#DC2626', marginLeft: 6 }}>※ top4なし → top1−top2のみ</span>}
                    </p>

                    {/* ── top1/2/4 スコア ───────────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      スコア算出元（AI順位別）
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                      {[
                        { label: 'AI1位 (top1)', name: formationV7Debug.axisHorseName,  score: formationV7Debug.top1Score, accent: true },
                        { label: 'AI2位 (top2)', name: formationV7Debug.rank2HorseName, score: formationV7Debug.top2Score, accent: false },
                        { label: 'AI4位 (top4)', name: formationV7Debug.rank4HorseName ?? '—', score: formationV7Debug.top4Score, accent: false },
                      ].map((row) => (
                        <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: row.accent ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: row.accent ? '#92400E' : '#62627A', flexShrink: 0, minWidth: 80 }}>{row.label}</span>
                          <span style={{ fontSize: 12, color: '#EEEEF5', flex: 1 }}>{row.name}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: row.accent ? '#92400E' : '#9898B0', fontVariantNumeric: 'tabular-nums' }}>
                            {row.score !== null ? row.score.toFixed(4) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ── v6 vs v7 比較表 ──────────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      v6 vs v7 比較
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {(['v6', 'v7'] as const).map((ver) => {
                        const conf  = ver === 'v6' ? formationV7Debug.axisConfidenceV6 : formationV7Debug.axisConfidenceV7
                        const type  = ver === 'v6' ? formationV7Debug.axisTypeV6       : formationV7Debug.axisTypeV7
                        const count = ver === 'v6' ? formationV7Debug.himoCountV6      : formationV7Debug.himoCountV7
                        const col   = ver === 'v6' ? v6Color : v7Color
                        return (
                          <div key={ver} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: `1px solid ${changed ? col + '55' : 'rgba(255,255,255,0.05)'}` }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: ver === 'v6' ? '#166534' : '#92400E', margin: '0 0 8px', letterSpacing: '0.04em' }}>{ver.toUpperCase()}</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: '#9898B0' }}>confidence</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: col, fontVariantNumeric: 'tabular-nums' }}>
                                  {conf >= 0 ? '+' : ''}{conf.toFixed(4)}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: '#9898B0' }}>軸タイプ</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{type}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, color: '#9898B0' }}>ヒモ頭数</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#9898B0' }}>{count}頭</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {changed && (
                      <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(146,64,14,0.07)', border: '1px solid rgba(251,191,36,0.25)', marginBottom: 14 }}>
                        <p style={{ fontSize: 11, color: '#92400E', margin: 0 }}>
                          ⚡ v6 → v7 で軸タイプが変化: <strong>{formationV7Debug.axisTypeV6}</strong> → <strong>{formationV7Debug.axisTypeV7}</strong>（ヒモ {formationV7Debug.himoCountV6}頭 → {formationV7Debug.himoCountV7}頭）
                        </p>
                      </div>
                    )}

                    {/* ── ヒモスコアテーブル ─────────────── */}
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#62627A', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                      ヒモ候補スコア一覧（v7ヒモ頭数={formationV7Debug.himoCountV7}）
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'axis_gap', 'pace_fit', 'dist_fit', 'stability', 'score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV7Debug.rows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: row.isHimo ? 'rgba(251,191,36,0.05)' : 'transparent' }}>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#92400E' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>{row.horseName}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.axisGap.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                              <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', color: row.isHimo ? '#92400E' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV5.toFixed(4)}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                {row.isHimo && (
                                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(251,191,36,0.15)', color: '#92400E', border: '1px solid rgba(251,191,36,0.3)' }}>
                                    ◎ヒモ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      confidence_v7 = (top1−top2)×0.7 + (top1−top4)×0.3 / 軸強い=4頭, 標準=5頭, 混戦=6頭
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v8: 騎手スコア追加 ────────────────────────── */}
              {showDebug && formationV8Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = {
                  '軸強い': '#166534', '標準': '#92400E', '混戦': '#DC2626',
                }
                const typeColor = AXIS_TYPE_COLOR[formationV8Debug.axisTypeV7] ?? '#9898B0'

                // v7 と v8 でヒモが変わった馬を検出
                const v8Names = new Set(formationV8Debug.rows.filter((r) => r.isHimo).map((r) => r.horseName))
                // v7 のヒモは formationV7Debug から取得
                const v7HimoNames = formationV7Debug
                  ? new Set(formationV7Debug.rows.filter((r) => r.isHimo).map((r) => r.horseName))
                  : new Set<string>()
                const addedInV8   = [...v8Names].filter((n) => !v7HimoNames.has(n))
                const removedInV8 = [...v7HimoNames].filter((n) => !v8Names.has(n))

                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(249,115,22,0.03)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#FB923C', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v8 騎手スコア追加
                    </p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 4px', lineHeight: 1.6 }}>
                      pace = <strong style={{ color: '#EEEEF5' }}>{formationV8Debug.pace}</strong>
                      　　軸タイプ:
                      <span style={{ color: typeColor, fontWeight: 700, marginLeft: 4 }}>{formationV8Debug.axisTypeV7}</span>
                      　ヒモ: <strong style={{ color: '#EEEEF5' }}>{formationV8Debug.himoCount}頭</strong>
                    </p>
                    <p style={{ fontSize: 10, color: '#62627A', margin: '0 0 14px', lineHeight: 1.6 }}>
                      himo_score_v8 = pace_fit×0.40 + distance_fit×0.30 + jockey×0.20 + stability×0.10
                    </p>

                    {/* ── v7 vs v8 ヒモ差分 ─────────────── */}
                    {(addedInV8.length > 0 || removedInV8.length > 0) && (
                      <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 6, background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.25)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#FB923C', margin: '0 0 6px', letterSpacing: '0.04em' }}>v7 → v8 ヒモ変更</p>
                        {addedInV8.length > 0 && (
                          <p style={{ fontSize: 11, color: '#6EE7B7', margin: '0 0 2px' }}>
                            ＋ {addedInV8.join('、')}
                          </p>
                        )}
                        {removedInV8.length > 0 && (
                          <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>
                            － {removedInV8.join('、')}
                          </p>
                        )}
                      </div>
                    )}
                    {addedInV8.length === 0 && removedInV8.length === 0 && (
                      <p style={{ fontSize: 11, color: '#62627A', marginBottom: 14 }}>v7 と v8 のヒモ構成は同一です</p>
                    )}

                    {/* ── スコアテーブル ─────────────────── */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'pace_fit', 'dist_fit', 'jockey_name', 'jockey', 'stability', 'v7 score', 'v8 score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV8Debug.rows.map((row, i) => {
                            const rankChanged = row.isHimo !== v7HimoNames.has(row.horseName)
                            return (
                              <tr key={i} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: row.isHimo ? 'rgba(249,115,22,0.06)' : 'transparent',
                              }}>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#FB923C' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>
                                  {row.horseName}
                                  {rankChanged && (
                                    <span style={{ marginLeft: 4, fontSize: 9, color: row.isHimo ? '#166534' : '#DC2626' }}>
                                      {row.isHimo ? '↑' : '↓'}
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#62627A', textAlign: 'right', whiteSpace: 'nowrap', fontSize: 10 }}>{row.rawJockeyName}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV7.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#FB923C' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV8.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                  {row.isHimo && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(249,115,22,0.18)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.35)' }}>
                                      ◎ヒモ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      騎手未登録の場合はデフォルト {JOCKEY_DEFAULT_SCORE.toFixed(2)} を使用 / マスタは jockey_stats テーブルで管理（place3_rate を使用）
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v9: レースタイプ別騎手重み ─────────────── */}
              {showDebug && formationV9Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = {
                  '軸強い': '#166534', '標準': '#92400E', '混戦': '#DC2626',
                }
                const raceTypeColor = formationV9Debug.raceType === '3歳戦' ? '#6D28D9' : '#2563EB'

                // v8→v9 入れ替わり
                const addedInV9   = formationV9Debug.rows.filter((r) =>  r.isHimo && !r.wasHimoV8)
                const removedInV9 = formationV9Debug.rows.filter((r) => !r.isHimo &&  r.wasHimoV8)

                // v9 の重み表示用
                const W = formationV9Debug.raceType === '3歳戦'
                  ? { pace: '0.40', dist: '0.25', jockey: '0.25', stability: '0.10' }
                  : { pace: '0.45', dist: '0.35', jockey: '0.10', stability: '0.10' }

                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(167,139,250,0.03)',
                    border: '1px solid rgba(167,139,250,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v9 レースタイプ別騎手重み
                    </p>

                    {/* ── レースタイプ + 重み ───────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: `${raceTypeColor}18`, color: raceTypeColor, border: `1px solid ${raceTypeColor}44` }}>
                        {formationV9Debug.raceType}
                      </span>
                      <span style={{ fontSize: 11, color: '#9898B0' }}>
                        pace×{W.pace} + dist×{W.dist} + jockey×{W.jockey} + stability×{W.stability}
                      </span>
                      <span style={{ fontSize: 11, color: '#9898B0', marginLeft: 'auto' }}>
                        軸タイプ: <span style={{ color: AXIS_TYPE_COLOR[formationV9Debug.axisTypeV7], fontWeight: 700 }}>{formationV9Debug.axisTypeV7}</span>　ヒモ <strong style={{ color: '#EEEEF5' }}>{formationV9Debug.himoCount}頭</strong>
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', margin: '0 0 14px' }}>
                      v8 との差: pace {formationV9Debug.raceType === '3歳戦' ? '同' : '+0.05'} / dist {formationV9Debug.raceType === '3歳戦' ? '-0.05' : '+0.05'} / jockey {formationV9Debug.raceType === '3歳戦' ? '+0.05' : '-0.10'}
                    </p>

                    {/* ── v8→v9 入れ替わり ──────────────── */}
                    {(addedInV9.length > 0 || removedInV9.length > 0) ? (
                      <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 6, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.25)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', margin: '0 0 6px', letterSpacing: '0.04em' }}>v8 → v9 ヒモ変更</p>
                        {addedInV9.length > 0 && (
                          <p style={{ fontSize: 11, color: '#6EE7B7', margin: '0 0 2px' }}>
                            ＋ {addedInV9.map((r) => r.horseName).join('、')}
                          </p>
                        )}
                        {removedInV9.length > 0 && (
                          <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>
                            － {removedInV9.map((r) => r.horseName).join('、')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 11, color: '#62627A', marginBottom: 14 }}>v8 と v9 のヒモ構成は同一です</p>
                    )}

                    {/* ── スコアテーブル ─────────────────── */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'pace_fit', 'dist_fit', 'jockey', 'stability', 'v8 score', 'v9 score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV9Debug.rows.map((row, i) => {
                            const added   =  row.isHimo && !row.wasHimoV8
                            const removed = !row.isHimo &&  row.wasHimoV8
                            return (
                              <tr key={i} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: row.isHimo ? 'rgba(167,139,250,0.06)' : 'transparent',
                              }}>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#A78BFA' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>
                                  {row.horseName}
                                  {added   && <span style={{ marginLeft: 4, fontSize: 9, color: '#6EE7B7' }}>↑</span>}
                                  {removed && <span style={{ marginLeft: 4, fontSize: 9, color: '#DC2626' }}>↓</span>}
                                </td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV8.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#A78BFA' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV9.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                  {row.isHimo && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(167,139,250,0.18)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.35)' }}>
                                      ◎ヒモ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      3歳戦キーワード: {RACE_3YO_KEYWORDS.join(' / ')}
                    </p>
                  </div>
                )
              })()}

              {/* ── 検証パネル v9.1: jockey重み圧縮 ──────────────────────── */}
              {showDebug && formationV9_1Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = {
                  '軸強い': '#166534', '標準': '#92400E', '混戦': '#DC2626',
                }
                const raceTypeColor = formationV9_1Debug.raceType === '3歳戦' ? '#6D28D9' : '#2563EB'

                const addedInV9_1   = formationV9_1Debug.rows.filter((r) =>  r.isHimo && !r.wasHimoV9)
                const removedInV9_1 = formationV9_1Debug.rows.filter((r) => !r.isHimo &&  r.wasHimoV9)

                const W    = formationV9_1Debug.raceType === '3歳戦'
                  ? { pace: '0.40', dist: '0.28', jockey: '0.22', stability: '0.10' }
                  : { pace: '0.43', dist: '0.32', jockey: '0.15', stability: '0.10' }
                const Wv9  = formationV9_1Debug.raceType === '3歳戦'
                  ? { jockey: '0.25' } : { jockey: '0.10' }

                return (
                  <div style={{
                    marginTop: 8,
                    background: 'rgba(96,165,250,0.03)',
                    border: '1px solid rgba(96,165,250,0.2)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      検証 — v9.1 jockey重み圧縮
                    </p>

                    {/* ── レースタイプ + 重み ───────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6, background: `${raceTypeColor}18`, color: raceTypeColor, border: `1px solid ${raceTypeColor}44` }}>
                        {formationV9_1Debug.raceType}
                      </span>
                      <span style={{ fontSize: 11, color: '#9898B0' }}>
                        pace×{W.pace} + dist×{W.dist} + jockey×{W.jockey} + stability×{W.stability}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', margin: '0 0 8px' }}>
                      jockey重み: v9 {Wv9.jockey} → v9.1 {W.jockey}
                      （{formationV9_1Debug.raceType === '3歳戦' ? '3歳戦: −0.03' : '古馬戦: +0.05'}）
                    </p>

                    {/* ── v9/v9.1 重み比較表 ─────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'v9', weights: formationV9_1Debug.raceType === '3歳戦' ? { pace: '0.40', dist: '0.25', jockey: '0.25', stab: '0.10' } : { pace: '0.45', dist: '0.35', jockey: '0.10', stab: '0.10' }, color: '#A78BFA' },
                        { label: 'v9.1', weights: formationV9_1Debug.raceType === '3歳戦' ? { pace: '0.40', dist: '0.28', jockey: '0.22', stab: '0.10' } : { pace: '0.43', dist: '0.32', jockey: '0.15', stab: '0.10' }, color: '#2563EB' },
                      ].map(({ label, weights, color }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color, margin: '0 0 6px' }}>{label}</p>
                          {[
                            { k: 'pace', v: weights.pace },
                            { k: 'dist', v: weights.dist },
                            { k: 'jockey', v: weights.jockey },
                            { k: 'stability', v: weights.stab },
                          ].map(({ k, v }) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontSize: 10, color: '#9898B0' }}>{k}</span>
                              <span style={{ fontSize: 11, fontWeight: k === 'jockey' ? 700 : 400, color: k === 'jockey' ? color : '#9898B0' }}>×{v}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    {/* ── v9→v9.1 入れ替わり ─────────────── */}
                    {(addedInV9_1.length > 0 || removedInV9_1.length > 0) ? (
                      <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 6, background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.25)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', margin: '0 0 6px' }}>v9 → v9.1 ヒモ変更</p>
                        {addedInV9_1.length > 0 && (
                          <p style={{ fontSize: 11, color: '#6EE7B7', margin: '0 0 2px' }}>
                            ＋ {addedInV9_1.map((r) => r.horseName).join('、')}
                          </p>
                        )}
                        {removedInV9_1.length > 0 && (
                          <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>
                            － {removedInV9_1.map((r) => r.horseName).join('、')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: 11, color: '#62627A', marginBottom: 14 }}>v9 と v9.1 のヒモ構成は同一です</p>
                    )}

                    {/* ── 軸候補上位3頭 ─────────────────── */}
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6', margin: '0 0 6px', letterSpacing: '0.08em' }}>AXIS CANDIDATES TOP 3</p>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              {['', '馬名', 'pace_fit', 'dist_fit', 'jockey', 'closing', 'blood', 'weight', 'ground', 'axis score'].map((h) => (
                                <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {formationV9_1Debug.axisRows.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: r.isSelected ? 'rgba(20,184,166,0.06)' : 'transparent' }}>
                                <td style={{ padding: '5px 6px', textAlign: 'center', width: 20 }}>
                                  {r.isSelected && <span style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6' }}>◎</span>}
                                  {!r.isSelected && <span style={{ fontSize: 10, color: '#62627A' }}>{i + 1}</span>}
                                </td>
                                <td style={{ padding: '5px 6px', color: r.isSelected ? '#14B8A6' : '#9898B0', fontWeight: r.isSelected ? 700 : 400, whiteSpace: 'nowrap' }}>{r.horseName}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.paceFit.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.closingScore.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.bloodlineBonus > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.bloodlineBonus > 0 ? `+${r.bloodlineBonus.toFixed(3)}` : r.bloodlineBonus.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.weightAdj < 0 ? '#F87171' : r.weightAdj > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.weightAdj > 0 ? `+${r.weightAdj.toFixed(3)}` : r.weightAdj.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.groundStrength > 0 ? '#FBBF24' : r.groundStrength < 0 ? '#F87171' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.groundStrength > 0 ? `+${r.groundStrength.toFixed(3)}` : r.groundStrength.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.isSelected ? '#14B8A6' : '#9898B0', fontWeight: r.isSelected ? 700 : 400, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.axisScore.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ── スコアテーブル ─────────────────── */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'pace_fit', 'dist_fit', 'jockey', 'stability', 'blood bonus', 'weight adj', 'ground', 'v9 score', 'v9.1 score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV9_1Debug.rows.map((row, i) => {
                            const added   =  row.isHimo && !row.wasHimoV9
                            const removed = !row.isHimo &&  row.wasHimoV9
                            return (
                              <tr key={i} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: row.isHimo ? 'rgba(96,165,250,0.06)' : 'transparent',
                              }}>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#60A5FA' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>
                                  {row.horseName}
                                  {added   && <span style={{ marginLeft: 4, fontSize: 9, color: '#6EE7B7' }}>↑</span>}
                                  {removed && <span style={{ marginLeft: 4, fontSize: 9, color: '#DC2626' }}>↓</span>}
                                </td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.stabilityComponent.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.bloodlineBonus > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.bloodlineBonus > 0 ? `+${row.bloodlineBonus.toFixed(4)}` : row.bloodlineBonus.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.weightAdj < 0 ? '#F87171' : row.weightAdj > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.weightAdj > 0 ? `+${row.weightAdj.toFixed(4)}` : row.weightAdj.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.groundStrength > 0 ? '#FBBF24' : row.groundStrength < 0 ? '#F87171' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.groundStrength > 0 ? `+${row.groundStrength.toFixed(4)}` : row.groundStrength.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV9.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#60A5FA' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV9_1.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                  {row.isHimo && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(96,165,250,0.18)', color: '#2563EB', border: '1px solid rgba(96,165,250,0.35)' }}>
                                      ◎ヒモ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      軸タイプ: <span style={{ color: AXIS_TYPE_COLOR[formationV9_1Debug.axisTypeV7] }}>{formationV9_1Debug.axisTypeV7}</span>　ヒモ {formationV9_1Debug.himoCount}頭　jockey重み(v9.1)={formationV9_1Debug.jockeyWeight}
                    </p>
                  </div>
                )
              })()}

              {/* ── v9.2 debug ── */}
              {showDebug && formationV9_2Debug && (() => {
                const AXIS_TYPE_COLOR: Record<string, string> = { '軸強い': '#14B8A6', '標準': '#60A5FA', '混戦': '#F87171' }
                return (
                  <div style={{ ...card, fontSize: 11 }}>
                    <p style={{ ...sectionLabel }}>v9.2 DEBUG — 脚質別上がり補正（逃げ・先行フロア0.5）</p>
                    <p style={{ fontSize: 11, color: '#9898B0', margin: '0 0 10px', lineHeight: 1.7 }}>
                      v9.1との差分: 逃げ・先行の上がりスコアを下限0.5に設定。遅い上がりでも減点しない。差し・追込はそのまま。
                    </p>
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6', margin: '0 0 6px', letterSpacing: '0.08em' }}>AXIS CANDIDATES TOP 3</p>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              {['', '馬名', 'pace_fit', 'dist_fit', 'jockey', 'closing', 'blood', 'weight', 'ground', 'axis score'].map((h) => (
                                <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {formationV9_2Debug.axisRows.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: r.isSelected ? 'rgba(20,184,166,0.06)' : 'transparent' }}>
                                <td style={{ padding: '5px 6px', textAlign: 'center', width: 20 }}>
                                  {r.isSelected && <span style={{ fontSize: 10, fontWeight: 700, color: '#14B8A6' }}>◎</span>}
                                  {!r.isSelected && <span style={{ fontSize: 10, color: '#62627A' }}>{i + 1}</span>}
                                </td>
                                <td style={{ padding: '5px 6px', color: r.isSelected ? '#14B8A6' : '#9898B0', fontWeight: r.isSelected ? 700 : 400, whiteSpace: 'nowrap' }}>{r.horseName}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.paceFit.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.closingScore.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.bloodlineBonus > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.bloodlineBonus > 0 ? `+${r.bloodlineBonus.toFixed(3)}` : r.bloodlineBonus.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.weightAdj < 0 ? '#F87171' : r.weightAdj > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.weightAdj > 0 ? `+${r.weightAdj.toFixed(3)}` : r.weightAdj.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.groundStrength > 0 ? '#FBBF24' : r.groundStrength < 0 ? '#F87171' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.groundStrength > 0 ? `+${r.groundStrength.toFixed(3)}` : r.groundStrength.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: r.isSelected ? '#14B8A6' : '#9898B0', fontWeight: r.isSelected ? 700 : 400, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.axisScore.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['馬名', 'pace_fit', 'dist_fit', 'jockey', 'closing(補正後)', 'blood bonus', 'weight adj', 'ground', 'v9.1 score', 'v9.2 score'].map((h) => (
                              <th key={h} style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                            <th style={{ padding: '4px 6px', color: '#9898B0', fontWeight: 600, textAlign: 'center' }}>採用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formationV9_2Debug.rows.map((row, i) => {
                            const added   =  row.isHimo && !row.wasHimoV9
                            const removed = !row.isHimo &&  row.wasHimoV9
                            return (
                              <tr key={i} style={{
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: row.isHimo ? 'rgba(251,191,36,0.06)' : 'transparent',
                              }}>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#FBBF24' : '#9898B0', fontWeight: row.isHimo ? 700 : 400, whiteSpace: 'nowrap' }}>
                                  {row.horseName}
                                  {added   && <span style={{ marginLeft: 4, fontSize: 9, color: '#6EE7B7' }}>↑新規</span>}
                                  {removed && <span style={{ marginLeft: 4, fontSize: 9, color: '#DC2626' }}>↓除外</span>}
                                </td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.paceFit.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.distanceFit.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.jockeyScore.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', color: row.closingScore >= 0.5 ? '#FBBF24' : '#9898B0', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.closingScore.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', color: row.bloodlineBonus > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.bloodlineBonus > 0 ? `+${row.bloodlineBonus.toFixed(4)}` : row.bloodlineBonus.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.weightAdj < 0 ? '#F87171' : row.weightAdj > 0 ? '#34D399' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.weightAdj > 0 ? `+${row.weightAdj.toFixed(4)}` : row.weightAdj.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.groundStrength > 0 ? '#FBBF24' : row.groundStrength < 0 ? '#F87171' : '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.groundStrength > 0 ? `+${row.groundStrength.toFixed(4)}` : row.groundStrength.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: '#62627A', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV9.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', color: row.isHimo ? '#FBBF24' : '#9898B0', textAlign: 'right', fontWeight: row.isHimo ? 700 : 400, fontVariantNumeric: 'tabular-nums' }}>{row.himoScoreV9_1.toFixed(4)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                                  {row.isHimo && (
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'rgba(251,191,36,0.15)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.35)' }}>
                                      ◎ヒモ
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: 10, color: '#62627A', marginTop: 10, lineHeight: 1.7 }}>
                      軸タイプ: <span style={{ color: AXIS_TYPE_COLOR[formationV9_2Debug.axisTypeV7] }}>{formationV9_2Debug.axisTypeV7}</span>　ヒモ {formationV9_2Debug.himoCount}頭
                    </p>
                  </div>
                )
              })()}

              <div style={{ ...card, background: '#13141F', border: '1px solid rgba(20,184,166,0.15)' }}>
                <p style={{ ...sectionLabel, color: '#9898B0', borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  AIの予想まとめ
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {aiSummaryLines.map((line, i) => (
                    <p key={i} style={{ color: '#9898B0', fontSize: 13, lineHeight: 1.8, margin: 0 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* ── Chapter 2: レース展開 ───────────────────────────────── */}
              {chapterHeader('レース展開')}

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
                          borderRadius: 10,
                          padding: '4px 10px',
                          minWidth: 36,
                          border: `1px solid ${STYLE_COLORS[rs]}30`,
                        }}
                      >
                        <span style={{ color: STYLE_COLORS[rs], fontSize: 10, fontWeight: 700 }}>{label}</span>
                        <span style={{ color: '#EEEEF5', fontSize: 15, fontWeight: 700 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9898B0', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      展開予想
                    </span>
                    <span style={{ color: '#9898B0', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.explanation}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ color: '#9898B0', fontSize: 12, width: 68, flexShrink: 0, paddingTop: 1 }}>
                      AIコメント
                    </span>
                    <span style={{ color: '#9898B0', fontSize: 13, lineHeight: 1.6 }}>{paceMeta.aiComment}</span>
                  </div>
                </div>
              </div>

              {/* レース安定性スコア */}
              <div style={card}>
                <p style={sectionLabel}>レース安定性スコア</p>
                <p style={{ fontSize: 11, color: '#9898B0', marginBottom: 16 }}>
                  今回の出走馬の脚質構成から算出。展開の読みやすさ・軸の決めやすさ・混戦度を示します。
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 7 }}>
                      <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: stabilityLevel.color }}>
                        {raceStabilityScore}
                      </span>
                      <span style={{ color: '#9898B0', marginBottom: 6, fontSize: 15 }}>/100</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 2, height: 4, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${raceStabilityScore}%`, height: '100%', background: stabilityLevel.color, borderRadius: 9999 }} />
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${stabilityLevel.color}14`,
                        color: stabilityLevel.color,
                        border: `1px solid ${stabilityLevel.color}44`,
                      }}
                    >
                      {stabilityLevel.label}
                    </span>
                  </div>
                  <p style={{ color: '#9898B0', fontSize: 13, lineHeight: 1.7, flex: 1, minWidth: 180 }}>
                    {stabilityStrategy.comment}
                  </p>
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
                  <p style={{ color: '#62627A', fontSize: 13 }}>
                    平均ペース想定のため、展開による有利・不利はありません。
                  </p>
                )}
              </div>

              {/* 展開有利馬 */}
              {advantageHorses.length > 0 && (
                <div style={card}>
                  <p style={sectionLabel}>展開有利馬</p>
                  <p style={{ color: '#9898B0', fontSize: 11, marginBottom: 14 }}>
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
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#EEEEF5' }}>{name}</span>
                        </div>
                        <p style={{ color: '#9898B0', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Chapter 3: 期待値分析 ──────────────────────────────── */}
              {chapterHeader('期待値分析')}

              {/* AI注目の穴馬 — 候補がいない場合も空状態として常に表示 */}
              <div style={card}>
                <p style={sectionLabel}>AI注目の穴馬</p>
                {valueHorse ? (
                  <>
                    <p style={{ color: '#EEEEF5', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                      {valueHorse.horseName}
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(20,184,166,0.12)', color: '#14B8A6', border: '1px solid rgba(20,184,166,0.3)' }}>
                        AI順位 {valueHorse.aiRank}位
                      </span>
                      {valueHorse.popularityRank != null && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#9898B0', border: '1px solid rgba(255,255,255,0.10)' }}>
                          {valueHorse.popularityRank}番人気
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#9898B0', fontSize: 12, lineHeight: 1.7 }}>{valueHorse.reason}</p>
                  </>
                ) : (
                  /* 空状態: 穴馬条件を満たす候補なし */
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#62627A', margin: '0 0 6px' }}>
                      今回は該当なし
                    </p>
                    <p style={{ fontSize: 12, color: '#62627A', lineHeight: 1.7, margin: '0 0 12px' }}>
                      AI評価と人気のバランスが近く、回収率の観点で妙味のある穴馬は見つかりませんでした。
                    </p>
                    {/* 次点候補: 穴条件は満たさないが formation内でvalueIndexが最も高い馬 */}
                    {valueNextBest && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: '#62627A', border: '1px solid rgba(255,255,255,0.08)' }}>
                          比較的妙味あり
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#9898B0' }}>
                          {valueNextBest.horseName}
                        </span>
                        <span style={{ fontSize: 11, color: '#62627A' }}>
                          {valueNextBest.popularityRank}番人気 / AI {valueNextBest.aiRank}位
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* TODO: 買いチャンス — race_structure_score が実データになったら復活させる
                  betScore = computeBetScore(pct, edge), betLevel = getBetLevel(betScore) */}

              {/* AI着順予測ランキング */}
              <div style={card}>
                <p style={sectionLabel}>AI着順予測ランキング</p>
                {allRankedHorses.slice(0, 10).map(({ id: horseId, role }, index) => {
                  const horse = horses.find((h) => h.id === horseId)
                  const adj = getPaceAdjustment(horse?.style ?? null, pace)
                  const paceTag = adj > 0 ? 'up' : adj < 0 ? 'down' : null
                  const styleTag = horse?.style
                    ? { label: STYLE_LABELS[horse.style], color: STYLE_COLORS[horse.style] }
                    : null
                  // AI評価 vs 市場人気
                  const entry = entries.find((e) => e.horse_id === horseId)
                  const popularityRank = entry?.popularity_rank ?? null
                  const aiRank = index + 1
                  const gap = popularityRank != null ? popularityRank - aiRank : null
                  const gapBadge = gap == null ? null : gap >= 3 ? 'ai_pick' as const : gap <= -3 ? 'market_lead' as const : null
                  return (
                    <HorseRow
                      key={horseId}
                      rank={aiRank}
                      name={getHorseName(horseId)}
                      horseNumber={entry?.horse_number ?? null}
                      role={role}
                      paceTag={paceTag}
                      styleTag={styleTag}
                      popularityRank={popularityRank}
                      gapBadge={gapBadge}
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
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  marginBottom: 4,
                }}
              >
                {['着順', '馬番', '馬名', 'AI順位', ''].map((h) => (
                  <span key={h} style={{ color: '#9898B0', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>

              {sorted.map(({ horse_id, finish_pos }) => {
                const name = horses.find((h) => h.id === horse_id)?.name ?? horse_id
                const horseNumber = entries.find((e) => e.horse_id === horse_id)?.horse_number ?? null
                const aiRank = allRankedHorses.findIndex((h) => h.id === horse_id) + 1
                const aiRankDisplay = aiRank > 0 ? `${aiRank}位` : '—'

                let hint: { label: string; color: string; bg: string } | null = null
                if (aiRank > 0 && aiRank <= 3 && finish_pos <= 3) {
                  hint = { label: 'AI上位', color: '#166534', bg: 'rgba(22,101,52,0.08)' }
                } else if (finish_pos <= 3 && (aiRank === 0 || aiRank > 3)) {
                  hint = { label: '想定外', color: '#DC2626', bg: 'rgba(248,113,113,0.1)' }
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
                      background: isTop3 ? 'rgba(20,184,166,0.04)' : 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 700 : 400,
                        color: isTop3 ? '#14B8A6' : '#9898B0',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {finish_pos}着
                    </span>
                    <span style={{ fontSize: 14, color: '#9898B0' }}>
                      {circled(horseNumber) ?? '—'}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isTop3 ? 600 : 400,
                        color: isTop3 ? '#EEEEF5' : '#9898B0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: '#9898B0', fontVariantNumeric: 'tabular-nums' }}>{aiRankDisplay}</span>
                    <span>
                      {hint && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
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

        {/* ── みんなの予想 ──────────────────────────────────────────── */}
        <PicksPanel
          raceId={id}
          userId={currentUserId}
          userEmail={currentUserEmail}
          raceDate={race?.date ?? ''}
          horses={horses
            .filter((h) => entries.some((e) => e.horse_id === h.id))
            .map((h) => {
              const entry = entries.find((e) => e.horse_id === h.id)
              return { id: h.id, name: h.name, number: entry?.horse_number ?? null }
            })
            .sort((a, b) => {
              if (a.number != null && b.number != null) return a.number - b.number
              if (a.number != null) return -1
              if (b.number != null) return 1
              return 0
            })}
          initialPicks={racePicks}
          top3={entries
            .filter((e) => e.finish_position != null && e.finish_position <= 3)
            .sort((a, b) => (a.finish_position ?? 0) - (b.finish_position ?? 0))
            .map((e) => e.horse_id)}
        />
      </div>
    </main>
  )
}

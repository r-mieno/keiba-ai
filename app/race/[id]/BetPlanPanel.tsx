'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

const HIMO_OPTIONS_1 = [3, 4, 5]
const HIMO_OPTIONS_2 = [3, 4]
const AI_RECOMMENDED_1 = 5
const AI_RECOMMENDED_2 = 4

function computeCombinations(axisCount: number, himoCount: number): number {
  if (axisCount >= 3) return 1
  if (axisCount === 2) return Math.max(0, himoCount)
  return himoCount >= 2 ? (himoCount * (himoCount - 1)) / 2 : 0
}

function aiEvalToStars(score: number): string {
  if (score >= 26) return '★★★★★'
  if (score >= 21) return '★★★★☆'
  if (score >= 16) return '★★★☆☆'
  if (score >= 11) return '★★☆☆☆'
  return '★☆☆☆☆'
}

function buildComment(axisCount: number, himoCount: number, stabilityScore: number): string {
  if (axisCount === 1) {
    if (stabilityScore >= 61) {
      return `安定したレースのため、軸馬1頭の信頼度は高い。相手を${himoCount}頭に絞ることで点数を抑えながら、AIが評価した上位馬を確実にカバーする。`
    } else if (stabilityScore >= 41) {
      return `やや読みにくいレースのため、相手${himoCount}頭でリスクを分散させる。波乱の可能性を考慮しつつ、軸の信頼度を維持した構成。`
    } else {
      return `荒れやすいレースのため、相手を${himoCount}頭に広げてミスリスクを最小化する。穴馬の台頭に備えたカバー範囲を優先した構成。`
    }
  } else if (axisCount === 2) {
    return `軸1頭目が外れても軸2頭目が3着内に来れば的中圏内。単軸リスクを分散した安全志向の構成。相手${himoCount}頭との組み合わせで${himoCount}点買い。`
  } else {
    return `AIが高く評価した${axisCount}頭を軸に、相手${himoCount}頭を組み合わせた網羅的なフォーメーション。高配当圏を狙いつつ、複数の的中パターンを確保する積極的な構成。`
  }
}

type AxisDetail = {
  name: string
  horseNumber: number | null
  styleLabel: string | null
  styleColor: string | null
  aiEval: number
  reason: string
}

type HimoHorse = {
  id: string
  name: string
  number: number | null
  aiEval: number
}

type Props = {
  betType: string
  allHimoHorses: HimoHorse[]
  axisCount: number
  stabilityScore: number
  pace: string
  axisDetails: AxisDetail[]
  axisHorseIds: string[]
  top3HorseIds: string[]    // 空配列 = 結果未投入
  isDrawComplete: boolean   // false = 馬番未確定（枠順確定前の暫定予想）
  axis2Details?: AxisDetail // 2頭軸モード用の軸2位情報
}

// 三連複フォーメーションの的中チェック
// 1軸: 軸1頭がtop3に含まれ、残り2頭が選択ヒモに含まれる
// 2軸: 両軸がtop3に含まれ、残り1頭が選択ヒモに含まれる
function checkFormationHit(
  top3: string[],
  axisIds: string[],
  selectedHimoIds: string[],
  axisCount: number,
): boolean {
  if (top3.length < 3) return false
  const top3Set = new Set(top3)
  const himoSet = new Set(selectedHimoIds)
  const axisSet = new Set(axisIds)
  const axisInTop3 = axisIds.filter((id) => top3Set.has(id))

  if (axisCount === 1) {
    if (axisInTop3.length < 1) return false
    const nonAxis = top3.filter((id) => !axisSet.has(id))
    return nonAxis.every((id) => himoSet.has(id))
  }
  if (axisCount === 2) {
    if (axisInTop3.length < Math.min(2, axisIds.length)) return false
    const nonAxis = top3.filter((id) => !axisSet.has(id))
    return nonAxis.every((id) => himoSet.has(id))
  }
  return top3.every((id) => axisSet.has(id))
}

function NumBadge({ num, isAxis }: { num: number | null; isAxis: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: '50%',
        fontSize: 11,
        fontWeight: 700,
        background: isAxis ? '#14B8A6' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {num ?? '?'}
    </span>
  )
}

export default function BetPlanPanel({
  betType,
  allHimoHorses,
  axisCount: _axisCount,
  stabilityScore,
  axisDetails,
  axisHorseIds,
  top3HorseIds,
  isDrawComplete,
  axis2Details,
}: Props) {
  const [axisMode, setAxisMode] = useState<'1' | '2'>('1')
  const [himo1Count, setHimo1Count] = useState(Math.min(AI_RECOMMENDED_1, allHimoHorses.length))
  const [himo2Count, setHimo2Count] = useState(Math.min(AI_RECOMMENDED_2, Math.max(0, allHimoHorses.length - 1)))
  const [showBetInfo, setShowBetInfo] = useState(false)

  const can2Axis = !!axis2Details && allHimoHorses.length >= 2
  const is2Axis = axisMode === '2' && can2Axis

  // 実効値: モードによって切り替え
  const effectiveAxisCount = is2Axis ? 2 : 1
  const effectiveAxisDetails = is2Axis ? [axisDetails[0], axis2Details!] : axisDetails
  const effectiveAxisHorseIds = is2Axis ? [axisHorseIds[0], allHimoHorses[0].id] : axisHorseIds
  const himoPool = is2Axis ? allHimoHorses.slice(1) : allHimoHorses
  const himoCount = is2Axis ? himo2Count : himo1Count
  const setHimoCount = is2Axis ? setHimo2Count : setHimo1Count
  const HIMO_OPTIONS = is2Axis ? HIMO_OPTIONS_2 : HIMO_OPTIONS_1
  const AI_RECOMMENDED = is2Axis ? AI_RECOMMENDED_2 : AI_RECOMMENDED_1

  const openModal = () => { document.body.style.overflow = 'hidden'; setShowBetInfo(true) }
  const closeModal = () => { document.body.style.overflow = ''; setShowBetInfo(false) }

  const selectedHimo = himoPool.slice(0, himoCount)

  const hasResult = top3HorseIds.length === 3
  const isHit = hasResult && checkFormationHit(
    top3HorseIds,
    effectiveAxisHorseIds,
    selectedHimo.map((h) => h.id),
    effectiveAxisCount,
  )
  const combinations = computeCombinations(effectiveAxisCount, himoCount)
  const comment = buildComment(effectiveAxisCount, himoCount, stabilityScore)

  const axisNums = effectiveAxisDetails.map((d) => d.horseNumber)
  const himoNums = selectedHimo.map((h) => h.number)
  const formationRows = [
    { label: '1頭目', nums: axisNums, numAxisItems: axisNums.length },
    { label: '2頭目', nums: himoNums, numAxisItems: 0 },
    { label: '3頭目', nums: himoNums, numAxisItems: 0 },
  ]

  return (
    <div
      style={{
        background: '#13141F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 10,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: '#9898B0',
          margin: 0,
        }}>
          AI買い目プラン
        </p>
        {isHit && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 5,
            background: 'rgba(239,68,68,0.12)',
            color: '#F87171',
            border: '1px solid rgba(239,68,68,0.30)',
            letterSpacing: '0.06em',
          }}>
            的中
          </span>
        )}
      </div>

      {/* 軸モード切替 */}
      {can2Axis && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['1', '2'] as const).map((mode) => {
            const active = axisMode === mode
            const label = mode === '1' ? '1頭軸（10点）' : '2頭軸（5点）'
            return (
              <motion.button
                key={mode}
                onClick={() => setAxisMode(mode)}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  border: active ? '1px solid rgba(20,184,166,0.50)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
                  color: active ? '#14B8A6' : '#9898B0',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* 枠順未確定バナー */}
      {!isDrawComplete && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '10px 12px',
          marginBottom: 16,
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.20)',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 13, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>⚠</span>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', margin: '0 0 3px', letterSpacing: '0.04em' }}>
              枠順確定前の暫定予想
            </p>
            <p style={{ fontSize: 11, color: '#9898B0', margin: 0, lineHeight: 1.6 }}>
              馬番は金曜に確定します。枠順確定後にページを再読み込みすると予想が更新されます。
            </p>
          </div>
        </div>
      )}

      {/* Bet type */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ color: '#62627A', fontSize: 11, marginBottom: 6 }}>買い方</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: 'rgba(20,184,166,0.12)',
              color: '#14B8A6',
              border: '1px solid rgba(20,184,166,0.30)',
            }}
          >
            {betType}
          </span>
          <motion.button
            onClick={openModal}
            whileTap={{ scale: 0.92 }}
            aria-label="三連複フォーメーションの説明を見る"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
              color: '#62627A', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              flexShrink: 0, lineHeight: 1,
            }}
          >
            i
          </motion.button>
        </div>
      </div>

      {/* Himo count selector */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: '#62627A', fontSize: 11, marginBottom: 8 }}>軸馬に対する相手の頭数を選択</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {HIMO_OPTIONS.map((n) => {
            const disabled = n > himoPool.length
            const active = himoCount === n
            const isRecommended = n === AI_RECOMMENDED
            return (
              <motion.button
                key={n}
                onClick={() => !disabled && setHimoCount(n)}
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 13px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: active ? '1px solid rgba(20,184,166,0.50)' : '1px solid rgba(255,255,255,0.08)',
                  background: active ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
                  color: disabled ? '#3C3C42' : active ? '#14B8A6' : '#9898B0',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {n}頭
                {isRecommended && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 9999,
                      background: active ? 'rgba(20,184,166,0.25)' : 'rgba(20,184,166,0.10)',
                      color: disabled ? '#3C3C42' : '#14B8A6',
                      letterSpacing: '0.03em',
                    }}
                  >
                    AI
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Total combinations */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 14,
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span style={{ color: '#62627A', fontSize: 13 }}>合計買い目点数</span>
        <span style={{ color: '#EEEEF5', fontSize: 19, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {combinations}
          <span style={{ color: '#62627A', fontSize: 13, marginLeft: 4 }}>点</span>
        </span>
      </div>

      {/* Formation summary */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ color: '#62627A', fontSize: 11, marginBottom: 8 }}>フォーメーション確認</p>
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {formationRows.map(({ label, nums, numAxisItems }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#62627A', fontSize: 10, width: 36, flexShrink: 0 }}>{label}</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {nums.map((num, i) => (
                  <NumBadge key={i} num={num} isAxis={i < numAxisItems} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ◎ 軸馬 */}
      <div
        style={{
          background: 'rgba(20,184,166,0.06)',
          borderRadius: 8,
          padding: '14px 16px',
          border: '1px solid rgba(20,184,166,0.15)',
          marginBottom: 10,
        }}
      >
        <p style={{ color: '#14B8A6', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>◎ 軸</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {effectiveAxisDetails.map((detail, i) => (
            <div
              key={detail.name}
              style={{
                paddingBottom: i < effectiveAxisDetails.length - 1 ? 14 : 0,
                borderBottom: i < effectiveAxisDetails.length - 1 ? '1px solid rgba(20,184,166,0.12)' : 'none',
              }}
            >
              {/* Horse number + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {detail.horseNumber !== null && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 24,
                      height: 24,
                      borderRadius: 9999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: '#14B8A6',
                      color: '#fff',
                      flexShrink: 0,
                      padding: '0 6px',
                    }}
                  >
                    {detail.horseNumber}
                  </span>
                )}
                <span style={{ color: '#EEEEF5', fontSize: 15, fontWeight: 700 }}>{detail.name}</span>
                {is2Axis && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#62627A',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 4,
                    padding: '1px 6px',
                    marginLeft: 2,
                  }}>
                    軸{i + 1}
                  </span>
                )}
              </div>

              {/* AI eval stars + style */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: '#62627A' }}>AI評価</span>
                  <span style={{ fontSize: 14, color: '#FBBF24', letterSpacing: 1 }}>
                    {aiEvalToStars(detail.aiEval)}
                  </span>
                </div>
                {detail.styleLabel && detail.styleColor && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: detail.styleColor,
                      background: `${detail.styleColor}14`,
                      border: `1px solid ${detail.styleColor}38`,
                      borderRadius: 4,
                      padding: '1px 8px',
                    }}
                  >
                    {detail.styleLabel}
                  </span>
                )}
              </div>

              {/* Reason */}
              <p style={{ fontSize: 11, color: '#9898B0', lineHeight: 1.6, margin: 0 }}>{detail.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ○ ヒモ馬 */}
      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 18,
        }}
      >
        <p style={{ color: '#9898B0', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>
          ○ 相手
          <span style={{ color: '#62627A', fontSize: 10, fontWeight: 400, marginLeft: 6 }}>({selectedHimo.length}頭)</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedHimo.map((horse) => (
            <div
              key={horse.name}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {horse.number !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 24,
                    height: 24,
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: 'rgba(255,255,255,0.12)',
                    color: '#EEEEF5',
                    flexShrink: 0,
                    padding: '0 6px',
                  }}
                >
                  {horse.number}
                </span>
              )}
              <span
                style={{
                  color: '#9898B0',
                  fontSize: 14,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {horse.name}
              </span>
              <span style={{ fontSize: 13, color: '#FBBF24', flexShrink: 0, letterSpacing: 1 }}>
                {aiEvalToStars(horse.aiEval)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI comment */}
      <p style={{ color: '#9898B0', fontSize: 12, lineHeight: 1.8 }}>{comment}</p>

      {/* ── みんなの予想へのアンカー ────────────────────────────────── */}
      <a
        href="#picks"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 14,
          padding: '11px 4px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#9898B0',
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(244,114,182,0.12)', color: '#F472B6',
          fontSize: 11, fontWeight: 800, lineHeight: 1,
        }}>♟</span>
        <span>みんなの予想をみる・投稿する</span>
        <span style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.4 }}>↓</span>
      </a>

      {/* ── ネット馬券ガイド導線 ────────────────────────────────────── */}
      <motion.a
        href="/how-to-buy"
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)', x: 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 14,
          padding: '13px 4px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: '#9898B0',
          fontSize: 13,
          textDecoration: 'none',
        }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.08)', color: '#9898B0',
          fontSize: 11, fontWeight: 800, lineHeight: 1,
        }}>i</span>
        <span>ネット馬券の買い方をみる</span>
        <span style={{ marginLeft: 'auto', fontSize: 14, opacity: 0.4 }}>›</span>
      </motion.a>

      {/* ── 三連複フォーメーション説明モーダル ─────────────────────── */}
      {showBetInfo && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)',
            zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#13141F', borderRadius: 20, padding: '24px 22px',
              maxWidth: 420, width: '100%',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#EEEEF5', margin: 0 }}>
                三連複フォーメーションとは？
              </p>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: '#62627A', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '2px 4px' }}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* Lead */}
            <p style={{ color: '#9898B0', fontSize: 13, lineHeight: 1.8, marginBottom: 16 }}>
              三連複は、1〜3着に入る3頭を<span style={{ color: '#EEEEF5', fontWeight: 600 }}>順不同</span>で当てる馬券です。
              三連単のように着順まで当てる必要がないため、比較的当てやすい買い方です。
            </p>

            {/* Slot breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {([
                { label: '1頭目（軸候補）', desc: '3着以内に入る可能性が高い馬。1〜2頭選びます。' },
                { label: '2頭目（相手候補）', desc: '上位に来る可能性がある馬。2〜4頭選びます。' },
                { label: '3頭目（穴・相手候補）', desc: '3着以内に入ればよい相手候補。4〜8頭ほど入れます。' },
              ] as const).map(({ label, desc }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#9898B0', lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <p style={{ fontSize: 12, color: '#62627A', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12, margin: 0 }}>
              軸を決めて相手を広めに拾うことで、本命と穴のバランスを取りながら買えるのが特徴です。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

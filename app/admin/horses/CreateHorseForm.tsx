'use client'

import { useState } from 'react'
import { createHorse } from './actions'
import SubmitButton from '../components/SubmitButton'

const SIRE_TO_LINE: Record<string, string> = {
  'ディープインパクト': 'sunday', 'キズナ': 'sunday', 'ハーツクライ': 'sunday',
  'ステイゴールド': 'sunday', 'ゴールドシップ': 'sunday', 'オルフェーヴル': 'sunday',
  'キタサンブラック': 'sunday', 'ブラックタイド': 'sunday', 'ジャスタウェイ': 'sunday',
  'リアルスティール': 'sunday', 'ドリームジャーニー': 'sunday', 'ゴールドアリュール': 'sunday',
  'アドマイヤムーン': 'sunday', 'マンハッタンカフェ': 'sunday', 'フェノーメノ': 'sunday',
  'ヴィクトワールピサ': 'sunday', 'ダノンバラード': 'sunday', 'シルバーステート': 'sunday',
  'ダイワメジャー': 'sunday', 'アグネスタキオン': 'sunday', 'スペシャルウィーク': 'sunday',
  'フジキセキ': 'sunday', 'ゼンノロブロイ': 'sunday', 'ネオユニヴァース': 'sunday',
  'ミッキーアイル': 'sunday', 'スワーヴリチャード': 'sunday', 'ワグネリアン': 'sunday',
  'コントレイル': 'sunday', 'シャフリヤール': 'sunday', 'イクイノックス': 'sunday',
  'サリオス': 'sunday', 'マカヒキ': 'sunday', 'ロジャーバローズ': 'sunday',
  'サトノアラジン': 'sunday', 'フィエールマン': 'sunday', 'ワールドプレミア': 'sunday',
  'イスラボニータ': 'sunday', 'サトノダイヤモンド': 'sunday', 'ダノンプレミアム': 'sunday',
  'レッドファルクス': 'sunday', 'ジョーカプチーノ': 'sunday', 'スカイダイヤモンズ': 'sunday',
  'キングカメハメハ': 'mrprospector', 'ロードカナロア': 'mrprospector', 'ドゥラメンテ': 'mrprospector',
  'ルーラーシップ': 'mrprospector', 'サートゥルナーリア': 'mrprospector', 'タスティエーラ': 'mrprospector',
  'エイシンフラッシュ': 'mrprospector', 'サトノクラウン': 'mrprospector',
  'アメリカンファラオ': 'mrprospector', 'American Pharoah': 'mrprospector',
  'ベンバトル': 'mrprospector', 'Benbatl': 'mrprospector',
  'Makfi': 'mrprospector', 'Candy Ride': 'mrprospector', 'パドトロワ': 'mrprospector',
  'ハービンジャー': 'northerndancer', 'フランケル': 'northerndancer',
  'ブリックスアンドモルタル': 'northerndancer', 'クロフネ': 'northerndancer',
  'フレンチデピュティ': 'northerndancer', 'ジオグリフ': 'northerndancer',
  'ガリレオ': 'northerndancer', 'Galileo': 'northerndancer', 'シーザスターズ': 'northerndancer',
  'ジャングルポケット': 'northerndancer', 'ダンスインザダーク': 'northerndancer',
  'タニノギムレット': 'northerndancer', 'ドレフォン': 'northerndancer',
  'ポエティックフレア': 'northerndancer', 'Singspiel': 'northerndancer',
  "Giant's Causeway": 'northerndancer',
  'Siyouni': 'northerndancer', 'Cape Cross': 'northerndancer',
  'コンデュイット': 'northerndancer', 'Conduit': 'northerndancer',
  'エピファネイア': 'roberto', 'スクリーンヒーロー': 'roberto', 'シンボリクリスエス': 'roberto',
  'グラスワンダー': 'roberto', 'モーリス': 'roberto', 'ブライアンズタイム': 'roberto',
  'エフフォーリア': 'roberto',
  'サンデーサイレンス': 'nasrullah', 'バゴ': 'nasrullah', 'Linamix': 'nasrullah',
  'ニューイヤーズデイ': 'mrprospector', 'エンパイアメーカー': 'mrprospector',
  'Dark Angel': 'other',
}

const BLOODLINE_OPTIONS = [
  { value: 'sunday',         label: 'サンデー系' },
  { value: 'mrprospector',   label: 'ミスプロ系' },
  { value: 'northerndancer', label: 'ノーザンダンサー系' },
  { value: 'roberto',        label: 'ロベルト系' },
  { value: 'nasrullah',      label: 'ナスルーラ系' },
  { value: 'other',          label: 'その他' },
]

function guessLine(name: string): string {
  return SIRE_TO_LINE[name.trim()] ?? ''
}

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

const BIRTH_YEARS = Array.from({ length: 14 }, (_, i) => 2010 + i)
const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function CreateHorseForm() {
  const [fatherLine, setFatherLine] = useState('')
  const [damsireLine, setDamsireLine] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')

  return (
    <form action={createHorse}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>馬名 *</label>
          <input name="name" required placeholder="ステレンボッシュ" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>父</label>
          <input
            name="sire_name"
            placeholder="エピファネイア"
            style={inputStyle}
            onChange={(e) => { const g = guessLine(e.target.value); if (g) setFatherLine(g) }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>母父</label>
          <input
            name="damsire_name"
            placeholder="ディープインパクト"
            style={inputStyle}
            onChange={(e) => { const g = guessLine(e.target.value); if (g) setDamsireLine(g) }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>
            父系統 {fatherLine && <span style={{ color: '#14B8A6', fontSize: 10 }}>✓ 自動判定</span>}
          </label>
          <select name="father_line" value={fatherLine} onChange={(e) => setFatherLine(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">未設定</option>
            {BLOODLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>
            母父系統 {damsireLine && <span style={{ color: '#14B8A6', fontSize: 10 }}>✓ 自動判定</span>}
          </label>
          <select name="damsire_line" value={damsireLine} onChange={(e) => setDamsireLine(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">未設定</option>
            {BLOODLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>脚質</label>
          <select name="style" style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">未設定</option>
            <option value="front">逃げ</option>
            <option value="stalker">先行</option>
            <option value="closer">差し</option>
            <option value="deep_closer">追い込み</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>3着内率</label>
          <input name="place3_rate" type="number" step="0.001" min="0" max="1" placeholder="0.350" style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>生年月日</label>
          <input type="hidden" name="birth_year" value={birthYear} />
          <input type="hidden" name="birth_month" value={birthMonth} />
          <input type="hidden" name="birth_day" value={birthDay} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} style={{ ...inputStyle, width: 100, cursor: 'pointer' }}>
              <option value="">年</option>
              {BIRTH_YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} style={{ ...inputStyle, width: 76, cursor: 'pointer' }}>
              <option value="">月</option>
              {BIRTH_MONTHS.map((m) => <option key={m} value={m}>{m}月</option>)}
            </select>
            <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} style={{ ...inputStyle, width: 76, cursor: 'pointer' }}>
              <option value="">日</option>
              {BIRTH_DAYS.map((d) => <option key={d} value={d}>{d}日</option>)}
            </select>
          </div>
        </div>
      </div>
      <SubmitButton label="登録" loadingLabel="登録中..." />
    </form>
  )
}

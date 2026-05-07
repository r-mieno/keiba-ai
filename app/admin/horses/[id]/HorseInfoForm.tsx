'use client'

import { useState } from 'react'
import { updateHorse } from '../actions'
import SubmitButton from '../../components/SubmitButton'

const BLOODLINE_OPTIONS = [
  { value: 'sunday',         label: 'サンデー系' },
  { value: 'mrprospector',   label: 'ミスプロ系' },
  { value: 'northerndancer', label: 'ノーザンダンサー系' },
  { value: 'roberto',        label: 'ロベルト系' },
  { value: 'nasrullah',      label: 'ナスルーラ系' },
  { value: 'other',          label: 'その他' },
]

// 父名 → 系統マッピング
const SIRE_TO_LINE: Record<string, string> = {
  // サンデー系
  'ディープインパクト': 'sunday', 'キズナ': 'sunday', 'ハーツクライ': 'sunday',
  'ステイゴールド': 'sunday', 'ゴールドシップ': 'sunday', 'オルフェーヴル': 'sunday',
  'キタサンブラック': 'sunday', 'ブラックタイド': 'sunday', 'ジャスタウェイ': 'sunday',
  'リアルスティール': 'sunday', 'ドリームジャーニー': 'sunday', 'ゴールドアリュール': 'sunday',
  'アドマイヤムーン': 'sunday', 'マンハッタンカフェ': 'sunday', 'フェノーメノ': 'sunday',
  'ヴィクトワールピサ': 'sunday', 'トーセンジョーダン': 'sunday', 'ワールドエース': 'sunday',
  'ディープブリランテ': 'sunday', 'スピルバーグ': 'sunday', 'サトノダイヤモンド': 'sunday',
  'リアルインパクト': 'sunday', 'トゥザグローリー': 'sunday', 'ショウナンマイティ': 'sunday',
  'ダノンバラード': 'sunday', 'レッドファルクス': 'sunday',
  'ファインニードル': 'sunday', 'ダノンプレミアム': 'sunday', 'シルバーステート': 'sunday',
  // サンデー系（ディープ世代の産駒・主要母父）
  'ダイワメジャー': 'sunday', 'アグネスタキオン': 'sunday', 'スペシャルウィーク': 'sunday',
  'フジキセキ': 'sunday', 'ゼンノロブロイ': 'sunday', 'ネオユニヴァース': 'sunday',
  'ミッキーアイル': 'sunday', 'スワーヴリチャード': 'sunday', 'ワグネリアン': 'sunday',
  'コントレイル': 'sunday', 'シャフリヤール': 'sunday', 'イクイノックス': 'sunday',
  'サリオス': 'sunday', 'マカヒキ': 'sunday', 'ロジャーバローズ': 'sunday',
  'サトノアラジン': 'sunday', 'ヒルノダムール': 'sunday', 'ナカヤマフェスタ': 'sunday',
  'イスラボニータ': 'sunday', 'フィエールマン': 'sunday', 'ワールドプレミア': 'sunday',
  'ポエティックフレア': 'northerndancer', 'ドレフォン': 'northerndancer',
  'パドトロワ': 'mrprospector',
  // ミスプロ系
  'キングカメハメハ': 'mrprospector', 'ロードカナロア': 'mrprospector', 'ドゥラメンテ': 'mrprospector',
  'ルーラーシップ': 'mrprospector', 'ラブリーデイ': 'mrprospector', 'サートゥルナーリア': 'mrprospector',
  'ヤマカツエース': 'mrprospector', 'ホッコータルマエ': 'mrprospector', 'エスポワールシチー': 'mrprospector',
  'カネヒキリ': 'mrprospector', 'アグネスデジタル': 'mrprospector',
  'エイシンフラッシュ': 'mrprospector', 'サトノクラウン': 'mrprospector', 'タスティエーラ': 'mrprospector',
  'アメリカンファラオ': 'mrprospector', 'American Pharoah': 'mrprospector',
  'ワークフォース': 'mrprospector', 'Workforce': 'mrprospector',
  'トゥザワールド': 'mrprospector', 'ジョーカプチーノ': 'sunday',
  'スカイダイヤモンズ': 'sunday',
  'ベンバトル': 'mrprospector', 'Benbatl': 'mrprospector',
  'Makfi': 'mrprospector', 'Candy Ride': 'mrprospector',
  // ノーザンダンサー系
  'ハービンジャー': 'northerndancer', 'ブリックスアンドモルタル': 'northerndancer',
  'フランケル': 'northerndancer', 'モズアスコット': 'northerndancer',
  'オペラハウス': 'northerndancer', 'メイショウサムソン': 'northerndancer',
  'ダンスインザダーク': 'northerndancer', 'タニノギムレット': 'northerndancer',
  'ジャングルポケット': 'northerndancer', 'ガリレオ': 'northerndancer', 'Galileo': 'northerndancer',
  'シーザスターズ': 'northerndancer', 'オーシャンブルー': 'northerndancer',
  'クロフネ': 'northerndancer', 'フレンチデピュティ': 'northerndancer',
  'ジオグリフ': 'northerndancer', 'ハードスパン': 'northerndancer',
  'スリゴーベイ': 'northerndancer', 'Sligo Bay': 'northerndancer',
  'Singspiel': 'northerndancer', 'Giant\'s Causeway': 'northerndancer',
  'Siyouni': 'northerndancer', 'Cape Cross': 'northerndancer',
  'コンデュイット': 'northerndancer', 'Conduit': 'northerndancer',
  // ロベルト系
  'エピファネイア': 'roberto', 'スクリーンヒーロー': 'roberto', 'シンボリクリスエス': 'roberto',
  'グラスワンダー': 'roberto', 'モーリス': 'roberto', 'ブライアンズタイム': 'roberto',
  'タイキシャトル': 'roberto', 'エフフォーリア': 'roberto',
  // ナスルーラ系
  'サンデーサイレンス': 'nasrullah', 'バゴ': 'nasrullah', 'Linamix': 'nasrullah',
  // ミスプロ系追加
  'ニューイヤーズデイ': 'mrprospector', 'エンパイアメーカー': 'mrprospector',
  // ノーザンダンサー系追加
  'Bated Breath': 'northerndancer', 'ベイテッドブレス': 'northerndancer',
  'Not For Sale': 'northerndancer', 'ノットフォーセール': 'northerndancer',
  'Hinchinbrook': 'northerndancer', 'ヒンチンブルック': 'northerndancer',
  'Snitzel': 'northerndancer', 'スニッツェル': 'northerndancer',
  'Lizard Island': 'northerndancer', 'リザードアイランド': 'northerndancer',
  "Medaglia d'Oro": 'northerndancer', 'メダグリアドーロ': 'northerndancer',
  // ミスプロ系追加
  'Swept Overboard': 'mrprospector', 'スウェプトオーヴァーボード': 'mrprospector',
  'Thewayyouare': 'mrprospector', 'ザウェイユーアー': 'mrprospector',
  // その他
  'Dark Angel': 'other',
}

function guessLine(sireName: string): string {
  if (!sireName) return ''
  return SIRE_TO_LINE[sireName.trim()] ?? ''
}

const BIRTH_YEARS = Array.from({ length: 14 }, (_, i) => 2010 + i)  // 2010-2023
const BIRTH_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const BIRTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

type Props = {
  horseId: string
  horse: {
    name: string
    sire_name?: string | null
    damsire_name?: string | null
    dam_name?: string | null
    father_line?: string | null
    damsire_line?: string | null
    place3_rate?: number | null
    race_count?: number | null
    birth_date?: string | null
  }
  derivedStyle: string | null
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

function parseBirthDate(birthDate: string | null | undefined) {
  if (!birthDate) return { year: '', month: '', day: '' }
  const [y, m, d] = birthDate.split('-')
  return { year: y ?? '', month: m ? String(Number(m)) : '', day: d ? String(Number(d)) : '' }
}

export default function HorseInfoForm({ horseId, horse, derivedStyle }: Props) {
  const [fatherLine, setFatherLine] = useState(horse.father_line ?? '')
  const [damsireLine, setDamsireLine] = useState(horse.damsire_line ?? '')
  const bd = parseBirthDate(horse.birth_date)
  const [birthYear, setBirthYear] = useState(bd.year)
  const [birthMonth, setBirthMonth] = useState(bd.month)
  const [birthDay, setBirthDay] = useState(bd.day)

  const updateAction = updateHorse.bind(null, horseId)

  const handleSireChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const guessed = guessLine(e.target.value)
    if (guessed) setFatherLine(guessed)
  }

  const handleDamsireChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const guessed = guessLine(e.target.value)
    if (guessed) setDamsireLine(guessed)
  }

  return (
    <form action={updateAction}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>馬名</label>
          <input name="name" defaultValue={horse.name ?? ''} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>父</label>
          <input name="sire_name" defaultValue={horse.sire_name ?? ''} placeholder="父名" style={inputStyle} onChange={handleSireChange} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>母父</label>
          <input name="damsire_name" defaultValue={horse.damsire_name ?? ''} placeholder="母父名" style={inputStyle} onChange={handleDamsireChange} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>母</label>
          <input name="dam_name" defaultValue={horse.dam_name ?? ''} placeholder="母名" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>
            父系統 {fatherLine && <span style={{ color: '#14B8A6', fontSize: 10 }}>✓ 自動判定</span>}
          </label>
          <select name="father_line" value={fatherLine} onChange={(e) => setFatherLine(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">—</option>
            {BLOODLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>
            母父系統 {damsireLine && <span style={{ color: '#14B8A6', fontSize: 10 }}>✓ 自動判定</span>}
          </label>
          <select name="damsire_line" value={damsireLine} onChange={(e) => setDamsireLine(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">—</option>
            {BLOODLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>3着内率</label>
          <input name="place3_rate" type="number" step="0.001" min="0" max="1" defaultValue={horse.place3_rate ?? ''} placeholder="0.350" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>出走数</label>
          <input name="race_count" type="number" step="1" min="0" defaultValue={horse.race_count ?? ''} placeholder="20" style={inputStyle} />
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
        <div>
          <label style={{ fontSize: 11, color: '#62627A', display: 'block', marginBottom: 4 }}>
            脚質 {derivedStyle && <span style={{ color: '#14B8A6', fontSize: 10 }}>✓ 自動判定</span>}
          </label>
          <div style={{ ...inputStyle, color: derivedStyle ? '#14B8A6' : '#62627A', display: 'flex', alignItems: 'center' }}>
            {derivedStyle ?? '走行データなし'}
          </div>
        </div>
      </div>
      <SubmitButton label="保存" />
    </form>
  )
}

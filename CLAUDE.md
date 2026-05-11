# keiba-ai 開発ルール

## デザインシステム（全ページ共通）

特別な目的（ランディングページ等）でない限り、全ページ以下のトークンを使うこと。

### カラートークン
| 用途 | 値 |
|------|----|
| ページ背景 | `#0C0D14` |
| カード背景 | `#13141F` |
| テキスト（高） | `#EEEEF5` |
| テキスト（中） | `#9898B0` |
| テキスト（低） | `#62627A` |
| アクセント（ティール） | `#14B8A6` |
| ボーダー | `rgba(255,255,255,0.07〜0.08)` |

### カードスタイル
```tsx
// 標準カード
{ background: '#13141F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }
// ガラスカード（TOPページ等）
{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24 }
```

### セクションラベル（小見出し）
```tsx
{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#62627A' }
```

### 展開トグルボタン（「もっと見る」系）
`GradeCalendar.tsx` の「翌月以降を見る」および `RaceList.tsx` の「過去のレースをもっと見る」で使用。
新たに折りたたみ展開ボタンを作る際はこのスタイルを使うこと。**ボタンは中央配置**。

```tsx
// ラッパーで中央寄せ（flexコンテナ内ではalignSelf: 'center'でも可）
<div style={{ display: 'flex', justifyContent: 'center' }}>
  <motion.button
    onClick={() => setOpen((v) => !v)}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 14px', borderRadius: 10,
      background: open ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(20,184,166,0.30)',
      color: '#14B8A6', fontSize: 12, fontWeight: 600,
      letterSpacing: '0.04em', cursor: 'pointer', fontFamily: 'inherit',
    }}
  >
    {open ? '閉じる' : 'もっと見る'}
    <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
  </motion.button>
</div>
```

---

## レイアウト

### ヘッダー（Topbar）は必ず固定（sticky）にする
新規ページを作成する場合、ヘッダーには必ず以下のスタイルを適用すること。
特別に目立たせたいページ（LP等）はこのルール外でも可。

```tsx
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
```

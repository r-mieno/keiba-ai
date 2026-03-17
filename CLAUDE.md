# keiba-ai 開発ルール

## レイアウト

### ヘッダー（Topbar）は必ず固定（sticky）にする
新規ページを作成する場合、ヘッダーには必ず以下のスタイルを適用すること。

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

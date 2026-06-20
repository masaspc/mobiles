# 設計書：詳細ページのリッチ化（C案）＋ 製品画像 ＋ カテゴリ控えめ配色

作成日: 2026-06-20 / 対象: `masaspc/mobiles` / 実装: Codex（PR）→ Claudeレビュー

## 1. 背景・目的
公開済みサイトの詳細ページが「殺風景」（テキストのdlのみ・画像なし・項目少）。
ブレインストーミングで **C案（画像＋スペック拡張）** ＋ **控えめなカテゴリ配色** に決定。
本設計に沿って、情報量とビジュアルの両面で“理想形”の詳細ページへ作り込む。

## 2. スコープ
**含む**：スキーマ拡張、派生スコア追加、詳細ページ全面改修、製品画像（公式URL直参照＋フォールバック）、
3機種のデータ拡充、Aboutのスコア説明追記、テスト/検証、トップ一覧のサムネイル（小）。
**含まない**：Cloudflare R2 構築、新規フィルタUI、30機種化（別ラウンド）。

## 3. スキーマ拡張（`src/data/schema.ts`）
既存のコア項目は維持し、以下を追加（特記なき新規は `nullable().optional()`）。
- identity: `imageUrl: z.string().url().nullable().optional()`（メーカー公式画像URL。既存`imageKey`は残置可）
- display 追加: `aspectRatio`(string), `refreshRateHz`(number), `brightnessNits`(number), `pen`(boolean)
- ports 拡張（**既存 `thunderbolt`/`usbPd` boolean はフィルタ用に維持**し、表示用に下記を追加）:
  - `usbC: { count:number, spec:string }` 例 spec: `Thunderbolt 4` / `USB4` / `USB 3.2 Gen2`
  - `usbA:number`（個数）, `hdmi:string|null`(版), `cardReader: 'SD'|'microSD'|null`, `audioJack:boolean`
- physical 追加: `chassisMaterial`(string)
- io（新グループ）:
  - `webcam: { resolution:string, ir:boolean, privacyShutter:boolean }`
  - `windowsHello: { face:boolean, fingerprint:boolean }`
  - `keyboard: { backlight:boolean, layout:string }`

> `coreModelSchema = modelSchema` の関係は維持（Content Collection と validate-data 双方で強制）。

## 4. 派生スコア（`deriveModel`）＝詳細ページの「主要スコア」5指標
すべて **0–100 の固定レンジ正規化**（機種が増えても基準不変、Aboutに明記）。
ベンチ尺度の混在は禁止（B4方針の踏襲：性能は Geekbench 6 Multi のみ）。
- `portabilityScore`（既存, 0–100）… 携帯性
- `performanceScore100` = clamp((geekbench6Multi − 5000) / 150)  … 性能（5000–20000→0–100）
- `batteryScore` = clamp((batteryDensity − 0.035) / 0.0004)  … バッテリー（既存 densityScore と同レンジ）
- `connectivityScore` … 通信：Wi‑Fi世代(7=70/6E=55/6=40基点) ＋ WWAN(5G=+30/LTE=+15/none=0) を 0–100 にクランプ
- `valueScore` = clamp((performancePerPrice − 0.03) / 0.0006)  … コスパ（performancePerPrice=GB6/円。0.03–0.09→0–100。実データを見て係数は微調整可、Aboutに明記）

> 既存 `performanceScore`(=生GB6) は一覧/比較で使用中のため残す。新規は上記 100点系を追加。

## 5. 詳細ページUI（`src/pages/models/[id].astro`）
単一カラム、上から：
1. **ヒーロー**：製品画像（§6）＋ 機種名 ＋ メーカー/シリーズ ＋ **バッジ** ＋ 価格(priceType併記)
   - バッジ（派生）例：Copilot+ PC / WWAN種別 / Thunderbolt / OLED / 顔認証 …。各バッジは対応カテゴリ色の**小ドット**のみ着色。
2. **主要スコア**：5指標カード（数値＋細いバー）。
3. **スペック詳細＝6グループ**（2カラム, モバイル1カラム）：
   ⚙性能 / 🖥ディスプレイ / 🔌接続・ポート / ⚖携帯性 / 🔋バッテリー / 📷入出力・認証
   - 値が `null` の項目は「—」。バッテリー駆動は**測定法を併記**（既存ratedLife）。
4. **構成・出典**（既存：基準価格・variants・sources・取得日）。
- JSON-LD(Product) に `image: imageUrl` を追加（既存のエスケープは維持）。

### 配色（控えめ・確定）
カテゴリ色は **見出しテキスト＋アイコン＋左ボーダー＋バッジのドット** のみ。**項目名(ラベル)は落ち着いた灰、値は標準色**。
- 性能=橙 `#f6a93b` / ディスプレイ=紫 `#b89bff` / 接続=シアン `#36cfe6` / 携帯性=緑 `#4fd394` / バッテリー=ライム `#b6e64f` / 入出力=ピンク `#f47bb0`
- ダーク/ライト両対応（彩度を抑えコントラスト確保、WCAG AA目安）。色トークンは `global.css` か小さなマップに集約。

## 6. 画像方針（メーカー公式URL直参照）
- データの `imageUrl` を `<img>` で参照。属性：`loading="lazy"` `decoding="async"` `referrerpolicy="no-referrer"` ＋ **縦横比固定**（CSS `aspect-ratio`）でCLS防止。
- **フォールバック必須**：画像の背後にプレースホルダ(`.placeholder`)を置き、`onerror="this.style.display='none'"` で割れたら自動的に代替表示（壊れアイコンを出さない）。`imageUrl` が null の場合もプレースホルダ。
- 画像の出典URLは `sources`（field: image）に記録。
- ※リスク（公式CDNのRefererブロック/リンク切れ）は上記フォールバックで吸収する前提。

## 7. トップ一覧のサムネイル（小・副次）
一覧のモバイルカード（および可能ならテーブル先頭列）に **小サムネ**（同 `imageUrl`＋同フォールバック, lazy, 縦横比固定）を追加し、トップの見栄えも底上げ。優先度は詳細ページの次。

## 8. データ拡充（`data/models/*.yaml` ×3 ＋ `data/MODEL-TEMPLATE.yaml`）
3機種（MacBook Air M4 / Surface Pro 11 / ThinkPad X1 Carbon Gen13）について、§3で追加した全項目を
**メーカー公式情報から人手確認で実値投入**（推測値禁止・不明は null）。`imageUrl` に公式画像URL、出典を `sources` に追記。
テンプレートも新スキーマに更新。

## 9. About（`src/pages/about.astro`）
新規5スコアの**正規化レンジと算出式**を明記（携帯性は既存記載を流用、性能/バッテリー/通信/コスパを追記）。

## 10. テスト・検証
- `schema.test.ts`：新フィールドのparse、派生スコアが 0–100 に収まること、性能スコアがGB6由来であること。
- `npm run validate` / `npm test` / `npm run build`(astro check) / `npm run check:links` すべて緑。
- ローカルプレビューで詳細ページの画像フォールバック・配色・モバイル1カラムを目視。

## 11. GitHubフロー
1. `git checkout main && git pull && git checkout -b feat/rich-detail-pages`
2. 実装＋データ拡充＋本設計書を同梱してコミット
3. main向けPR作成。PR本文に対応項目チェックリスト（§3–§10）。
4. CI（型/test/Zod/build/リンク検査）緑を確認 → 連絡
5. Claudeがレビュー（差分＋ローカルプレビューで画像フォールバック/配色/レスポンシブを実検証）→ マージ → デプロイ後ライブ確認

## 12. 受け入れ基準
- 詳細ページに ヒーロー画像（＋フォールバック）/5スコア/6カラー区分グループ/出典 が表示される。
- 画像URLが403/欠落でも壊れ表示にならずプレースホルダになる。
- 3機種すべてで新項目が（判明分）埋まり、出典付き。
- 配色は控えめ（ラベルは灰・値は標準）。ダークモードで可読。
- CI全チェック緑、主要導線の内部リンク200を維持。

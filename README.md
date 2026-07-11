# What’s Your Room Aesthetic?

Pinterestから訪れた米国のGen Zユーザー向けに、12問の回答から6種類の部屋スタイルを提案する無料診断MVPです。バックエンド、ログイン、データベース、個人情報収集はありません。Vite + React + TypeScript + Plain CSSで作られており、GitHub Pagesへそのまま公開できます。

## 実装内容

- Pinterest流入向けランディングページ
- 1問ずつ進む12問の診断（進捗、戻る、最初からやり直す機能付き）
- Cozy Minimalist / Clean Girl Room / Dark Academia / Soft Girl / Pastel Room / Modern Boho / Moody Maximalist の6結果
- 色、雰囲気、装飾、避けるもの、最初の3ステップの個別提案
- Room Aesthetic Starter Kit の自然な紹介とGumroad仮リンク
- `console.log`ベースの仮イベントトラッキング
- SEO、Open Graph、Twitter Cardメタデータ
- GitHub ActionsによるGitHub Pagesデプロイ
- Pinterest投稿案50件とCanva制作資料

## 必要な環境

- Node.js 20以上（推奨: Node.js 22）
- npm 10以上

## ローカルで起動

```bash
cd /Users/fukuharasota/Codex_test/room-aesthetic-quiz
npm install
npm run dev
```

ターミナルに表示されたローカルURL（通常は `http://localhost:5173`）をブラウザで開きます。

## ビルドと確認

```bash
npm run build
npm run preview
```

本番用ファイルは `dist/` に生成されます。`vite.config.ts` の `base: './'` により、GitHubのユーザー名やリポジトリ名に依存しない相対アセットURLを使います。

## コンテンツの編集場所

| 変更したい内容 | ファイル |
|---|---|
| 12問の質問、回答、配点 | `src/data/questions.ts` |
| 6結果の説明、色、装飾、3ステップ | `src/data/results.ts` |
| 商品紹介コピー、内容、価格表現 | `src/data/product.ts` |
| Gumroad URL、公開URL、商品名 | `src/config.ts` |
| イベント名 | `src/config.ts` の `TRACKING_EVENTS` |
| イベント送信処理 | `src/tracking.ts` |
| 色、余白、カード等のデザイン | `src/styles.css` の `:root` |
| SEO / SNSメタ情報 | `index.html` |

### 質問と配点

`src/data/questions.ts` の各回答には、次のような `scores` があります。

```ts
{
  id: 'warm-neutrals',
  emoji: '🥐',
  text: 'Cream, oatmeal & light wood',
  scores: { 'cozy-minimalist': 3, 'clean-girl': 1 }
}
```

1つの回答から1タイプだけでなく複数タイプへ加点できます。新しい質問を追加すると、進捗の総数は自動更新されます。

### 同点の処理

合計スコアが同点の場合は、`src/types.ts` の `aestheticIds` に書かれた順で先にあるタイプを採用します。現在の優先順は次の通りです。

1. Cozy Minimalist
2. Clean Girl Room
3. Dark Academia
4. Soft Girl / Pastel Room
5. Modern Boho
6. Moody Maximalist

判定は `src/App.tsx` の `calculateResult` にあります。比較が `>` のため、同点では既存の先順位が保持されます。

## Gumroadリンクの変更

`src/config.ts` の次の1行だけ変更します。

```ts
productUrl: 'https://gumroad.com/l/room-aesthetic-starter-kit',
```

ランディングページと全結果ページのCTAが同時に切り替わります。決済処理はサイト内に実装していません。

## 仮イベントトラッキング

次のイベントを `src/tracking.ts` がブラウザのコンソールへ出力します。

- `quiz_started`
- `quiz_completed`
- `result_viewed`
- `product_cta_clicked`
- `retake_quiz_clicked`
- `result_shared`

将来Google AnalyticsやPlausibleを入れる場合は、UI側ではなく `trackEvent()` の中身だけを差し替えます。イベントプロパティには結果IDやCTA位置だけを渡し、個人情報は収集しません。

## GitHub Pagesへの公開

1. GitHubで `room-aesthetic-quiz` という新しいリポジトリを作ります。
2. このフォルダをGitリポジトリとして初期化し、`main` ブランチへpushします。

```bash
git init
git add .
git commit -m "Build room aesthetic quiz MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/room-aesthetic-quiz.git
git push -u origin main
```

3. GitHubのリポジトリで **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に設定します。
4. `.github/workflows/deploy.yml` が自動的にビルドと公開を行います。
5. Actionsが完了したら `https://YOUR-USERNAME.github.io/room-aesthetic-quiz/` を確認します。
6. `src/config.ts` と `marketing/pinterest-pin-ideas.csv` にある `YOUR-USERNAME` を実際のGitHubユーザー名に置換します。

GitHub Pagesの画面構成は変更される場合があるため、設定名が異なる場合はGitHubのPages設定内で「GitHub Actions」を公開元に選んでください。

## marketingフォルダ

- `pinterest-content-plan.md`: 無料投稿から始める運用方針と最初の10枚のテスト設計
- `pinterest-pin-ideas.csv`: 50件のPin見出し、説明、CTA、キーワード、ボード案
- `canva-brief.md`: 1000×1500pxテンプレートの共通デザイン指示
- `canva-pin-template-prompts.md`: Canvaへ貼る10種類の英語プロンプト
- `launch-checklist.md`: Web、Pinterest、分析までの公開チェックリスト
- `competitive-review.md`: 競合比較、採用したパターン、守るべき差別化

CSVをGoogle SheetsやExcelへ読み込み、`target_url` のプレースホルダーを一括置換して運用できます。最初はP001–P003、P011、P016、P021、P036–P037、P041、P046の10件がテスト対象です。

## 次にやること

1. スマートフォン実機で全診断フローを確認する。
2. GitHub Pagesへ公開し、Pinterestから遷移する公開URLを確定する。
3. Canvaで最初の3テンプレートと10枚のPinを制作する。
4. Starter Kitの最小版を作り、Gumroad商品ページを正式公開する。
5. 30〜50枚の無料Pinを投稿し、保存とアウトバウンドクリックを比較する。
6. 反応の良い切り口が分かってから、分析ツールや広告を検討する。

## 注意

- アフィリエイトリンクはMVPに含めていません。将来追加する場合は、リンク付近と必要なページに広告・アフィリエイトであることを明示してください。
- 診断は娯楽とインテリア計画の補助を目的としており、心理診断ではありません。
- Google Fontsが読み込めない環境では、システムフォントとGeorgiaへ自動フォールバックします。

# きづきタイム for YouTube

**YouTubeをやめさせるのではなく、YouTubeを見ている自分に気づく。**

YouTubeを使っている間、一定の間隔で「今、何をしていますか？」「最初の目的を覚えていますか？」と問いかける、Chrome拡張機能＋Webアプリです。
利用の制限やロックは**しません**。閉じるか続けるかは、いつもあなたが決めます。

| 部品 | 役割 |
|---|---|
| `extension/` | Chrome拡張機能（Manifest V3）。YouTubeの検知、時間の計測、確認画面、記録の保存 |
| `web/` | Webアプリ（React + Vite + Tailwind）。ダッシュボード・設定・「記録について」 |
| `shared/` | 両方で使う型・質問文・初期値 |

```
YouTubeタブ ──(content script)──▶ background(service worker) ──▶ chrome.storage.local
                                         ▲
ダッシュボード(拡張内 app/) ──(直接)──────────┘\nWeb公開版 ──(postMessage)──▶ bridge.js ──┘   ※許可したドメインにだけ注入
```

---

## 1. 必要なソフト

- **Google Chrome**（Chromebookなら標準のChrome）
- すぐ試すだけなら、これだけで大丈夫です（`extension/dist` にビルド済みの拡張が入っています）
- 自分で変更・ビルドするなら **Node.js 20以上**（https://nodejs.org ）
  - Chromebookの場合は「設定 → デベロッパー → Linux開発環境」をオンにして、Linux側にNode.jsを入れます

## 2. インストール方法

プロジェクトのフォルダで、1回だけ実行します。

```bash
npm install
```

## 3. プロジェクトの起動方法（まとめ）

```bash
npm run dev          # （開発用）Webアプリを単体で起動（http://localhost:5173）
npm run build:ext    # Chrome拡張＋ダッシュボードをビルド（extension/dist ができる）
npm run build        # 拡張とWebアプリの両方をビルド
npm run typecheck    # 型チェック
npm test             # 動作ロジックのテスト
```

## 4. Chrome拡張機能のビルド方法

```bash
npm run build:ext
```

`extension/dist/` に拡張機能（ダッシュボード入り）が出来上がります。コードを直しながら試すときは、`cd extension && npm run watch` にすると自動でビルドし直します。

## 5. ChromebookのChromeに拡張機能を読み込む方法

1. Chromeのアドレスバーに `chrome://extensions` と入れて開く
2. 右上の **デベロッパー モード** をオンにする
3. **パッケージ化されていない拡張機能を読み込む** を押す
4. このプロジェクトの **`extension/dist`** フォルダを選ぶ
5. 「きづきタイム for YouTube」が表示されれば成功です。ツールバーのパズルのアイコンからピン留めできます

コードを変えてビルドし直したときは、`chrome://extensions` の拡張機能カードにある更新ボタン（⟳）を押してください。

## 6. ダッシュボード（Webアプリ）を開く方法

**拡張機能の中に入っているので、サーバーの起動は不要です。**
ツールバーの拡張機能アイコンをクリックし、**「ダッシュボードを開く」** を押すだけです（ChromeのタブでWebアプリが開きます）。

開発しながら画面を直したいときだけ、`npm run dev` で http://localhost:5173 を開けます（Linux開発環境が必要）。このときは拡張機能の「橋渡し」経由で記録を読みます。

## 7. 動作確認方法

1. 拡張機能を読み込む
2. 別のタブで https://www.youtube.com を開く → **「何のために開きましたか？」** が出る
3. 目的を選ぶ（「その他」は自由入力）
4. YouTubeを**画面に表示したまま**5分ほど待つ → **「YouTubeを使い始めて5分です。今、何をしていますか？」** が出る
   - 早く試したいときは、Webアプリの「設定」で間隔を `1` 分などに変えて保存します
5. 答えを選んで「このまま続ける」または「YouTubeを閉じる」を押す
6. 「別の動画を見ている」を選ぶと、最初の目的との違いが表示され、目的を更新できる
7. YouTubeのタブをすべて閉じる → セッション終了
8. 拡張機能アイコン →「ダッシュボードを開く」→ 今日の利用時間・セッション数・目的外・グラフ・各回の答えが表示される

ツールバーの拡張機能アイコンをクリックすると、現在のセッションの状態と、一時停止スイッチが見られます。

## 計測のルール（知っておいてほしいこと）

- **利用時間 = YouTubeのタブが画面に表示されていた時間**です。別タブで放置した時間は含みません。動画を実際に再生しているかどうかまでは見ていません（DOMを読まないための割り切りです）
- YouTubeが10分以上表示されなかったら、セッションは終了します
- 10秒未満のセッションは記録しません（誤クリック対策）
- **目的外の時間** = 確認に「最初の目的とは違う」と答えてから、次に「目的どおり」と答える（または目的を更新する、終了する）までの時間。AIによる判定はしていません
- 日をまたいだセッションは、開始した日にまとめて数えます
- 確認がたまっていても、出るのは一番大きい間隔の1回だけです
- 「YouTubeを閉じる」は、その確認が出ていたタブだけを閉じます

## 記録するデータ

`shared/types.ts` にあるとおり、`User` / `Session` / `CheckIn` の3つだけです。動画のタイトル・URL・検索語は保存しません。保存先は `chrome.storage.local`（そのChromeの中）です。サーバーには何も送りません。

将来、複数の端末で同期したくなったら、`extension/src/storage.ts` の読み書きを差し替える（Supabaseなど）だけで済む作りにしてあります。

## 8. 今後Web上に公開する方法

### Webアプリを Vercel に公開する

1. このフォルダをGitHubにアップロードする
2. https://vercel.com で「Add New → Project」から、そのリポジトリを選ぶ（ルートの `vercel.json` が設定を持っています）
3. Deployを押すと、`https://〇〇.vercel.app` が発行される

### 公開したWebアプリと拡張機能をつなぐ（任意）

拡張機能の中のダッシュボードだけで使うなら、この手順は不要です。他の人に公開URLで見せたいときだけ行います。

拡張機能は、**許可したドメインのページにしか**データを渡しません。公開したURLを `extension/config.json` に書きます。

```json
{
  "webAppUrl": "https://〇〇.vercel.app",
  "bridgeMatches": [
    "https://〇〇.vercel.app/*",
    "http://localhost:5173/*"
  ]
}
```

その後 `npm run build:ext` をして、拡張機能を更新（⟳）してください。

### Chrome Web Store に公開する（将来）

- 権限は `storage`・`alarms`・YouTubeのみ、外部へ通信するコードもありません（審査で説明しやすい構成です）
- `extension/dist` をzipにして、開発者アカウントからアップロードします
- 必要なもの：ストア用の説明文とスクリーンショット、プライバシーポリシー（「記録するデータ」の節が下書きになります）、`manifest.json` の名前・説明の最終確認
- 公開時は `bridgeMatches` から `localhost` を外すことをおすすめします

## MVPでまだやっていないこと

- 動画の内容の自動判定（やらない方針です）
- 複数端末での同期
- Webアプリ側でのログイン
- 日またぎセッションの分割集計

## フォルダ構成

```
kizuki-youtube/
├─ shared/            型・質問文・初期値
├─ extension/
│  ├─ src/background.ts   セッション管理・保存・メッセージ処理
│  ├─ src/session.ts      時間計算（テストあり）
│  ├─ src/storage.ts      保存（将来の同期の差し替え口）
│  ├─ src/content/        YouTube上の確認画面（Shadow DOM）
│  ├─ src/bridge.ts       Webアプリとの橋渡し
│  ├─ src/popup/          ツールバーのポップアップ
│  ├─ config.json         ダッシュボードのURL設定
│  └─ dist/               ビルド結果（ここをChromeに読み込む）
├─ web/                   ダッシュボード・設定
└─ vercel.json
```

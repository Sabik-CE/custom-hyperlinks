# Custom Hyperlinks

Googleスプレッドシートで管理する個人用リンク集を、GitHub Pages上でコンパクトなカード形式に表示する静的サイトです。

## ファイル構成

```text
custom-hyperlinks/
├── index.html
├── style.css
├── app.js
├── Code.gs
├── links_sample.csv
├── categories_sample.csv
├── robots.txt
└── README.md
```

## GitHub Pages

GitHub Pagesは次の設定を想定しています。

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## Googleスプレッドシート

1つのGoogleスプレッドシート内に、`links` と `categories` の2つのシートを作ります。

### links

必須列:

```text
active | pin | category | name | url | description | order
```

- `active`: `TRUE` の行だけ表示します。
- `pin`: `TRUE` の行は上部のピン留め欄に表示します。
- `category`: カテゴリキーです。`categories.category` と一致すると初期開閉状態と表示順が反映されます。
- `name`: カードに表示するリンク名です。
- `url`: リンク先URLです。
- `description`: メモ用です。現在の画面には表示しません。
- `order`: 同じカテゴリ内のリンク表示順です。小さい値が先に表示されます。

### categories

必須列:

```text
active | category | initial_state | order
```

- `active`: `TRUE` のカテゴリだけ有効です。
- `category`: `links.category` と対応するカテゴリ名です。画面にもこの値を表示します。
- `initial_state`: `open` または `hide` を指定します。それ以外は `open` になります。
- `order`: カテゴリ表示順です。小さい値が先に表示されます。

`categories` に存在しないカテゴリのリンクも表示されます。その場合は元のカテゴリ名を表示し、初期状態は `open`、表示順は設定済みカテゴリの後ろになります。

## CSVサンプル

- `links_sample.csv` をGoogleスプレッドシートにインポートし、シート名を `links` にします。
- `categories_sample.csv` をGoogleスプレッドシートにインポートし、シート名を `categories` にします。

## GASの設定

1. Google Apps Scriptに `Code.gs` の内容を貼り付けます。
2. スプレッドシートIDを使う場合は `SPREADSHEET_ID` に設定します。同じスプレッドシートに紐づくApps Scriptなら空のままで動作します。
3. Webアプリとしてデプロイします。
4. アクセス権は利用環境に合わせて設定し、発行されたWebアプリURLを `app.js` の `DATA_URL` に設定します。

Apps Scriptのトリガー設定は不要です。`links` と `categories` の内容はページ読み込み時に取得されます。

## JSON形式

GASは次の形式を返します。

```json
{
  "updatedAt": "2026-07-16T10:00:00+09:00",
  "categories": [
    {
      "category": "AI",
      "initialState": "open",
      "order": 30
    }
  ],
  "links": [
    {
      "active": true,
      "pin": false,
      "category": "AI",
      "name": "ChatGPT",
      "url": "https://chatgpt.com/",
      "description": "メインAI",
      "order": 10
    }
  ]
}
```

旧形式のリンク配列だけを返すGASにも引き続き対応しています。

## 表示仕様

- ピン留めリンクは上部に表示され、通常カテゴリには重複表示されません。
- すべてのカテゴリ見出しに開閉ボタンがあります。
- `open` のカテゴリは初期表示され、`hide` のカテゴリは初期状態で閉じます。
- 開閉状態は `localStorage` に保存しません。ページの再読み込み後はスプレッドシートの初期状態に戻ります。
- カードにはリンク名とドメインを表示します。`description` は表示しません。
- リンクは新しいタブで開き、`rel="noopener noreferrer"` を付けます。
- ダークモードは `prefers-color-scheme` に従います。

## 注意事項

このサイト自体はアクセス制限を持ちません。以下の情報は保存しないでください。

- パスワード
- APIキー
- アクセストークン
- Webhook URL
- 患者情報や個人情報を含むURL
- 機密システムの管理画面URL
- URLパラメータに認証情報を含むリンク

`robots.txt` と `noindex` は検索エンジンへの登録を抑制するための設定であり、アクセス制限ではありません。

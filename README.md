# Custom Hyperlinks

Googleスプレッドシートで管理する個人用リンク集を、GitHub Pages上にカード形式で表示するための静的サイトです。

## 初期ファイル

```text
custom-hyperlinks/
├── index.html
├── style.css
├── app.js
├── robots.txt
└── README.md
```

## 初期確認

リポジトリのルートへファイルを配置し、GitHubへPushしてください。

GitHub Pagesは以下の設定を使用します。

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## GAS未接続時

`app.js` の `DATA_URL` が空の場合、サンプルデータが表示されます。

```javascript
const DATA_URL = '';
```

## GAS接続時

GASをWebアプリとして公開した後、`app.js` の `DATA_URL` にURLを設定します。

```javascript
const DATA_URL =
  'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';
```

## 想定JSON形式

配列形式とオブジェクト形式の両方に対応しています。

### 配列形式

```json
[
  {
    "active": true,
    "pin": true,
    "category": "一時保存",
    "name": "GitHub",
    "url": "https://github.com/",
    "description": "コード管理",
    "order": 10
  }
]
```

### オブジェクト形式

```json
{
  "updatedAt": "2026-07-16T09:00:00+09:00",
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

## 注意事項

このサイトはアクセス制限を持ちません。

以下は保存しないでください。

- パスワード
- APIキー
- アクセストークン
- Webhook URL
- 患者情報や個人情報を含むURL
- 機密システムの管理画面URL
- URLパラメータに認証情報を含むリンク

`robots.txt` と `noindex` は検索エンジンへの登録を抑制するための設定であり、アクセス制限ではありません。

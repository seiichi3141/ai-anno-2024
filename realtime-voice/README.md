# テキスト読み上げ API サーバー

## 概要

このプロジェクトは、Cartesia API を使用したテキスト読み上げサービスを FastAPI で実装したものです。テキストを受け取り、音声合成を行い、PCM (s16le) 形式で提供する高効率な音声配信システムです。

## 機能

- テキストを音声に変換して PCM (s16le) 形式で提供
- PCMストリーミング配信によるリアルタイム音声再生
- 複数の音声パラメータ（速度、サンプルレートなど）のカスタマイズ

## 環境構築

### 必要条件

- Python 3.10 以上
- pyaudio
- Cartesia API キー

### セットアップ

1. 環境変数ファイルの作成

```bash
cp .env.example .env
```

2. `.env`ファイルに Cartesia API キーを設定

```
CARTESIA_API_KEY=your_api_key_here
```

3. 必要なパッケージのインストール

```bash
pip install -r requirements.txt
```

## 使い方

### ローカルでの実行

```bash
python app.py
```

サーバーは`http://localhost:8000`で起動します。

### コマンドラインデモ実行

```bash
python main.py
```

これにより、テキストを入力して音声合成を行うコマンドラインデモが起動します。

### Docker での実行

```bash
docker-compose up -d
```

### API エンドポイント（PCM専用・必要最小限）

#### PCM音声ストリーミング配信

```
POST /tts/stream
```

リクエスト本文:

```json
{
  "text": "こんにちは、世界！",
  "voice_id": "2334b692-d045-48b5-ac45-d7bf5785026f",
  "language": "ja",
  "speed": "normal",
  "sample_rate": 44100
}
```

#### PCMバイナリデータ取得

```
POST /tts/bytes
```

リクエスト本文:

```json
{
  "text": "こんにちは、世界！",
  "voice_id": "2334b692-d045-48b5-ac45-d7bf5785026f",
  "language": "ja",
  "speed": "slow",
  "sample_rate": 44100
}
```

## API ドキュメント

API サーバー起動後、以下の URL で Swagger UI による API ドキュメントにアクセスできます。

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## プロジェクト構造

```
├── app.py              # APIサーバー起動スクリプト
├── src/                # 共通コード
│   ├── __init__.py     # Pythonパッケージ化
│   ├── api.py          # FastAPI実装
│   ├── auth.py         # API認証
│   ├── config.py       # 設定管理
│   ├── models.py       # データモデル
│   ├── routers/        # APIルーター
│   │   └── tts_router.py
│   ├── services/       # ビジネスロジック
│   │   ├── audio_service.py
│   │   ├── streaming_service.py
│   │   └── text_service.py
│   └── utils/          # ユーティリティ
│       └── file_utils.py
├── web/                # フロントエンドアプリケーション
├── docs/               # ドキュメント
└── temp_audio/         # 一時ファイル保存用ディレクトリ
```

### コード構成

- **api.py**: FastAPIベースのHTTP API実装
- **streaming_service.py**: PCMストリーミング配信の実装
- **tts_router.py**: 必要最小限の2つのエンドポイント（stream, bytes）

これにより、PCM専用の高効率な音声配信システムとして最適化され、コードの再利用性と保守性を高めています。

---

## 📋 API簡素化記録

**旧構成（WebMサポート）** → **新構成（PCM専用）**

### 削除されたエンドポイント

- `POST /tts/save` - WebMファイル保存機能
- `GET /tts/download/{filename}` - WebMファイルダウンロード機能

### 現在のAPI

1. **`POST /tts/stream`** - PCMストリーミング配信（文単位処理で高品質）
2. **`POST /tts/bytes`** - PCMバイナリデータ直接取得

**結果**: WebM関連処理を完全削除し、シンプルで保守しやすいPCM専用システムが完成しました。

## API ドキュメント

API サーバー起動後、以下の URL で Swagger UI による API ドキュメントにアクセスできます。

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## プロジェクト構造

```
├── app.py              # APIサーバー起動スクリプト
├── main.py             # コマンドラインデモ実行スクリプト
├── src/                # 共通コード
│   ├── __init__.py     # Pythonパッケージ化
│   ├── api.py          # FastAPI実装
│   └── audio_utils.py  # 音声処理共通ユーティリティ
├── docs/               # ドキュメント
└── temp_audio/         # 一時ファイル保存用ディレクトリ
```

### コード構成

- **audio_utils.py**: 音声処理の共通機能を提供するモジュール（Cartesia API接続、音声データ処理など）
- **api.py**: FastAPIベースのHTTP API実装
- **main.py**: コマンドラインからの使用例を提供するインターフェース

これにより、機能の重複を排除し、コードの再利用性と保守性を高めています。

# 技術コンテキスト

## 使用されている技術

### バックエンド

1. **Python 3.12**

   - プログラミング言語
   - 型ヒント機能を活用した堅牢なコード構築

2. **FastAPI**

   - 高性能な非同期 Web フレームワーク API
   - 自動ドキュメント生成機能 (Swagger UI, ReDoc)
   - Pydantic を利用した入力バリデーション

3. **Cartesia API**

   - 日本語特化の高品質テキスト読み上げ API
   - リアルタイム音声合成エンジン

4. **GINZA & 日本語NLP**

   - ja-ginza-electra: 高精度日本語文分割
   - fugashi: 日本語形態素解析
   - ipadic: 形態素解析用辞書

5. **NumPy**

   - 科学計算ライブラリ
   - 音声データの数値処理と変換

6. **Uvicorn**

   - ASGI サーバー
   - FastAPI アプリケーションの実行環境

### フロントエンド

1. **Next.js 15**

   - React ベースのフレームワーク
   - サーバーサイドレンダリング対応
   - Turbopack による高速開発環境

2. **React 19**

   - UI ライブラリ
   - コンポーネントベースの開発

3. **Material UI 7**
   - React コンポーネントライブラリ HE
   - モダンでレスポンシブな UI コンポーネント群

### デプロイメント

1. **Docker**

   - コンテナ化技術
   - 一貫した実行環境の提供

2. **docker-compose**
   - マルチコンテナアプリケーション管理
   - API サーバーとデータベースの連携

## 開発環境のセットアップ

### 必要条件

1. **基本要件**

   - Python 3.10 以上
   - Node.js 18 以上（フロントエンド開発用）
   - Docker および docker-compose（推奨）

2. **システムライブラリ**
   - FFmpeg（音声・映像処理）
   - システム依存の音声ライブラリ（OS固有）

### セットアップ手順

1. **環境構築**

   ```bash
   # リポジトリのクローン
   git clone <repository-url>
   cd realtime-voice

   # 環境変数ファイルの作成
   cp .env.example .env

   # .envファイルを編集してCartesia APIキーを設定
   echo "CARTESIA_API_KEY=your_api_key_here" >> .env
   ```

2. **Python 依存ライブラリの準備**

   ```bash
   # 仮想環境の作成（オプション）
   python -m venv venv
   source venv/bin/activate  # macOSとLinux

   # 依存ライブラリのインストール
   pip install -e .
   ```

3. **Docker 環境での実行**

   ```bash
   # Dockerイメージのビルドと起動
   docker-compose up -d
   ```

4. **フロントエンド開発環境（オプション）**
   ```bash
   cd web
   npm install
   npm run dev
   ```

## 技術的制約

1. **Cartesia API 依存**

   - 外部 API に依存するため、サービス停止時の代替手段が限られる
   - API の仕様変更に追従する必要がある

2. **音声処理リソース要件**

   - 大量リクエスト時に CPU・メモリ使用量が増大
   - 長文処理時にはタイムアウトリスクあり（非同期処理で対応）

3. **ストレージ管理**

   - 生成音声ファイルのディスク容量管理
   - 自動クリーンアップ機能の信頼性確保

4. **セキュリティ考慮事項**
   - API キー管理の重要性
   - 入力テキストのバリデーション（長さ制限等）
   - ファイルダウンロードのアクセス制御

## 依存関係

### 外部サービス依存

1. **Cartesia API**
   - 重要度: 高（コア機能）
   - 代替案: 別の音声合成サービスへの切り替え（要実装変更）

### パッケージ依存

1. **cartesia >= 2.0.4**

   - Cartesia API クライアントライブラリ
   - TTS 機能の中核

2. **fastapi >= 0.115.12**

   - WebAPI フレームワーク
   - RESTful API の実装基盤

3. **ja-ginza >= 5.2.0, ja-ginza-electra >= 5.2.0**

   - 日本語自然言語処理
   - 高精度な文分割処理

4. **fugashi >= 1.4.3, ipadic >= 1.0.0**

   - 日本語形態素解析
   - 文分割の補助機能

5. **numpy >= 2.2.6**

   - 数値計算ライブラリ
   - 音声データ処理

6. **python-dotenv >= 1.1.0**

   - 環境変数管理
   - API キー等の設定情報管理

7. **uvicorn >= 0.34.2**

   - ASGI サーバー
   - API アプリケーション実行環境

### システムレベル依存

1. **コンテナ環境**
   - Docker
   - docker-compose

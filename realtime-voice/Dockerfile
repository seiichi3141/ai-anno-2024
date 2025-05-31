FROM python:3.12-slim

WORKDIR /app

# 必要なシステムパッケージをインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libasound-dev \
    portaudio19-dev \
    libportaudio2 \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 必要なPythonパッケージをインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# 環境変数を設定
ENV PYTHONUNBUFFERED=1

# ポートを公開
EXPOSE 8000

# アプリケーションを実行
CMD ["python", "app.py"]

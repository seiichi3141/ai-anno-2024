"""
アプリケーション設定
"""
import os
from dotenv import load_dotenv

load_dotenv()

# APIキー設定
ALLOWED_API_KEYS = os.getenv("ALLOWED_API_KEYS", "").split(",")

# 一時ファイル設定
TEMP_DIR = "temp_audio"

# ファイルクリーンアップ設定
FILE_CLEANUP_HOURS = 24  # 24時間でファイルを削除

# 音声設定
DEFAULT_VOICE_ID = os.getenv("VOICE_ID", "4ce21ad5-ff15-4adc-aee7-1166d9067991")
PCM_SAMPLE_RATE = 44100  # PCMサンプルレート
DEFAULT_LANGUAGE = "ja"

# CORS設定
ALLOWED_ORIGINS = ["http://localhost:3000"]

# アプリケーション情報
APP_TITLE = "テキスト読み上げAPI"
APP_DESCRIPTION = "CartesiaのAPIを使用したテキスト読み上げサービス"
APP_VERSION = "1.0.0"

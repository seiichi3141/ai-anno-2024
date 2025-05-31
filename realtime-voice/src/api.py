"""
リファクタリングされたメインAPI
各機能は適切なモジュールに分離されています
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import (
    APP_TITLE, APP_DESCRIPTION, APP_VERSION, 
    ALLOWED_ORIGINS
)
from src.routers.tts_router import router as tts_router

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION
)

# CORSミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを追加
app.include_router(tts_router)

@app.get("/")
def read_root():
    """ルートエンドポイント"""
    return {"message": "テキスト読み上げAPIへようこそ！", "version": APP_VERSION}

# 起動用
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

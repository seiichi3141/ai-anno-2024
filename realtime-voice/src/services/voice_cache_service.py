"""
音声キャッシュサービス
SQLiteを使用してテキストと音声データのペアを保存・取得し、同じテキストの音声合成を再利用する
"""
import sqlite3
import hashlib
import os
from typing import Optional
from src.config import TEMP_DIR

# SQLiteデータベースファイルのパス
DB_PATH = os.path.join(TEMP_DIR, "voice_cache.db")

def init_voice_cache_db():
    """音声キャッシュ用のSQLiteデータベースを初期化する"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # voice_cache テーブルを作成
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS voice_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text_hash TEXT UNIQUE NOT NULL,
                original_text TEXT NOT NULL,
                voice_id TEXT NOT NULL,
                language TEXT NOT NULL,
                speed TEXT NOT NULL,
                pcm_data BLOB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                access_count INTEGER DEFAULT 1
            )
        """)
        
        # インデックスを作成してパフォーマンスを向上
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_text_hash 
            ON voice_cache(text_hash)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_voice_params 
            ON voice_cache(voice_id, language, speed)
        """)
        
        conn.commit()
        print("音声キャッシュデータベースを初期化しました")

def generate_cache_key(text: str, voice_id: str, language: str, speed: str) -> str:
    """テキストと音声パラメータからキャッシュキーを生成する"""
    # テキストと音声パラメータを組み合わせてハッシュ化
    content = f"{text}|{voice_id}|{language}|{speed}"
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def get_cached_voice(text: str, voice_id: str, language: str, speed: str) -> Optional[bytes]:
    """キャッシュから音声データを取得する"""
    cache_key = generate_cache_key(text, voice_id, language, speed)
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # キャッシュされた音声データを検索
        cursor.execute("""
            SELECT pcm_data FROM voice_cache 
            WHERE text_hash = ?
        """, (cache_key,))
        
        result = cursor.fetchone()
        
        if result:
            # アクセス情報を更新
            cursor.execute("""
                UPDATE voice_cache 
                SET accessed_at = CURRENT_TIMESTAMP, 
                    access_count = access_count + 1
                WHERE text_hash = ?
            """, (cache_key,))
            conn.commit()
            
            print(f"キャッシュからボイスデータを取得しました: {text[:20]}...")
            return result[0]
    
    return None

def save_voice_to_cache(text: str, voice_id: str, language: str, speed: str, pcm_data: bytes):
    """音声データをキャッシュに保存する"""
    cache_key = generate_cache_key(text, voice_id, language, speed)
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        try:
            # 新しいキャッシュエントリを挿入
            cursor.execute("""
                INSERT OR REPLACE INTO voice_cache 
                (text_hash, original_text, voice_id, language, speed, pcm_data)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (cache_key, text, voice_id, language, speed, pcm_data))
            
            conn.commit()
            print(f"音声データをキャッシュに保存しました: {text[:20]}...")
            
        except sqlite3.Error as e:
            print(f"キャッシュ保存中にエラーが発生しました: {e}")

def clear_old_cache_entries(days: int = 30):
    """指定日数より古いキャッシュエントリを削除する"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM voice_cache 
            WHERE created_at < datetime('now', '-{} days')
        """.format(days))
        
        deleted_count = cursor.rowcount
        conn.commit()
        
        if deleted_count > 0:
            print(f"{deleted_count}件の古いキャッシュエントリを削除しました")

def get_cache_stats() -> dict:
    """キャッシュの統計情報を取得する"""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # 総エントリ数
        cursor.execute("SELECT COUNT(*) FROM voice_cache")
        total_entries = cursor.fetchone()[0]
        
        # 総データサイズ（MB）
        cursor.execute("SELECT SUM(LENGTH(pcm_data)) FROM voice_cache")
        total_size_bytes = cursor.fetchone()[0] or 0
        total_size_mb = total_size_bytes / (1024 * 1024)
        
        # 平均アクセス回数
        cursor.execute("SELECT AVG(access_count) FROM voice_cache")
        avg_access_count = cursor.fetchone()[0] or 0
        
        return {
            "total_entries": total_entries,
            "total_size_mb": round(total_size_mb, 2),
            "average_access_count": round(avg_access_count, 2)
        }

# データベース初期化を実行
init_voice_cache_db()

"""
音声処理サービス
音声合成、変換、ファイル作成などを担当
"""
import os
import io
import numpy as np
import base64
import json
from cartesia import Cartesia
from dotenv import load_dotenv
from src.config import DEFAULT_VOICE_ID
from src.services.voice_cache_service import get_cached_voice, save_voice_to_cache

load_dotenv()

def get_tts_response(text="テクノロジーで誰も取り残さない日本へ。テクノロジーで政治をかえる。あなたと一緒に未来をつくる。", voice_id=None, language="ja", speed="normal"):
    """
    Cartesia APIを使ってテキストから音声を合成し、レスポンスを返す
    """
    
    client = Cartesia(
        api_key=os.getenv("CARTESIA_API_KEY")
    )
    response = client.tts.sse(
        model_id="sonic-2",
        transcript=text,
        voice={
            "mode": "id",
            "id": voice_id or DEFAULT_VOICE_ID,
        },
        language=language,
        output_format={
            "container": "raw",
            "encoding": "pcm_s16le",
            "sample_rate": 44100,
        },
        speed=speed
    )
    return response

def process_audio_chunks(response):
    """APIレスポンスから音声データを処理する"""
    all_audio_data = np.array([], dtype=np.float32)
    
    for chunk in response:
        try:
            if hasattr(chunk, 'data'):
                # 文字列の場合はバイナリに変換
                if isinstance(chunk.data, str):
                    try:
                        # Base64デコードを試みる
                        binary_data = base64.b64decode(chunk.data)
                    except Exception:
                        binary_data = chunk.data.encode('latin1')
                        
                    # JSONの場合も処理
                    if binary_data[:1] == b'{':
                        try:
                            json_data = json.loads(binary_data)
                            if 'audio' in json_data:
                                binary_data = base64.b64decode(json_data['audio'])
                        except Exception:
                            pass
                else:
                    binary_data = chunk.data
                    
                try:
                    # バイトデータをnumpy配列に変換
                    audio_data = np.frombuffer(binary_data, dtype=np.float32)
                    
                    # 値の範囲が大きすぎる場合は正規化
                    if np.max(np.abs(audio_data)) > 10.0:
                        int_view = np.frombuffer(binary_data, dtype=np.int16)
                        audio_data = int_view.astype(np.float32) / 32767.0
                    
                    # すべての音声データを結合
                    all_audio_data = np.concatenate([all_audio_data, audio_data])
                    
                except Exception:
                    # int16として解釈し、float32に変換してみる
                    try:
                        audio_data = np.frombuffer(binary_data, dtype=np.int16).astype(np.float32) / 32767.0
                        all_audio_data = np.concatenate([all_audio_data, audio_data])
                    except Exception as e2:
                        print(f"代替解釈も失敗しました: {e2}")
        except Exception as e:
            print(f"エラー発生: {e}")
            
    return all_audio_data

def process_pcm_s16le_chunks(response):
    """APIレスポンスからPCM s16le音声データを処理する"""
    all_audio_data = b''
    
    for chunk in response:
        try:
            if hasattr(chunk, 'data'):
                # 文字列の場合はバイナリに変換
                if isinstance(chunk.data, str):
                    try:
                        # Base64デコードを試みる
                        binary_data = base64.b64decode(chunk.data)
                    except Exception:
                        binary_data = chunk.data.encode('latin1')
                        
                    # JSONの場合も処理
                    if binary_data[:1] == b'{':
                        try:
                            json_data = json.loads(binary_data)
                            if 'audio' in json_data:
                                binary_data = base64.b64decode(json_data['audio'])
                        except Exception:
                            pass
                else:
                    binary_data = chunk.data
                    
                # PCMバイナリデータをそのまま結合
                all_audio_data += binary_data
                    
        except Exception as e:
            print(f"PCMチャンク処理でエラー発生: {e}")
            
    return all_audio_data

def generate_tts_audio(text: str, voice_id: str = None, language: str = "ja") -> np.ndarray:
    """
    テキストから音声データを生成する
    
    Parameters:
    - text: 変換するテキスト
    - voice_id: 使用する声のID
    - language: 言語コード
    
    Returns:
    - 音声データ（numpy配列）
    """
    # APIリクエスト
    response = get_tts_response(text=text, voice_id=voice_id, language=language)
    
    # 音声データを処理
    audio_data = process_audio_chunks(response)
    
    return audio_data

def generate_tts_pcm_bytes(text: str, voice_id: str = None, language: str = "ja", speed: str = "normal") -> bytes:
    """
    テキストからPCM s16le形式の音声バイナリデータを生成する（キャッシュ対応）
    
    Parameters:
    - text: 変換するテキスト
    - voice_id: 使用する声のID
    - language: 言語コード
    - speed: 読み上げ速度
    
    Returns:
    - PCM s16le音声データ（バイト）
    """
    # デフォルト値を設定
    if voice_id is None:
        voice_id = DEFAULT_VOICE_ID
    
    # キャッシュから音声データを取得を試みる
    cached_data = get_cached_voice(text, voice_id, language, speed)
    if cached_data:
        return cached_data
    
    # キャッシュにない場合は新規生成
    print(f"新規音声生成: {text[:30]}...")
    response = get_tts_response(text=text, voice_id=voice_id, language=language, speed=speed)
    
    # PCM音声データを処理
    pcm_data = process_pcm_s16le_chunks(response)
    
    # 生成した音声データをキャッシュに保存
    save_voice_to_cache(text, voice_id, language, speed, pcm_data)
    
    return pcm_data



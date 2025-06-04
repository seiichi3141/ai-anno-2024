"""
ストリーミング処理サービス
PCM音声のストリーミング配信に関する処理を担当
"""
import json
import base64
from typing import AsyncGenerator

from src.services.audio_service import get_tts_response, generate_tts_pcm_bytes
from src.services.text_service import split_text_into_sentences
from src.services.voice_cache_service import get_cached_voice, save_voice_to_cache
from src.config import DEFAULT_VOICE_ID


async def generate_pcm_stream_by_sentences(text: str, voice_id: str = None, language: str = "ja", speed: str = "normal") -> AsyncGenerator[bytes, None]:
    """
    テキストを文単位で分割し、各文ごとに音声に変換してPCM s16le形式でストリーミングする（キャッシュ対応）
    
    Parameters:
    - text: 変換するテキスト
    - voice_id: 使用する声のID
    - language: 言語コード
    - speed: 読み上げ速度
    """
    # デフォルト値を設定
    if voice_id is None:
        voice_id = DEFAULT_VOICE_ID
    
    # テキストを文単位に分割
    sentences = split_text_into_sentences(text)
    print(f"テキストを{len(sentences)}個の文に分割しました")
    
    # 各文を順番に処理
    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue  # 空文字はスキップ
            
        print(f"文 {i+1}/{len(sentences)} を処理中: {sentence[:30]}{'...' if len(sentence) > 30 else ''}")
        
        # キャッシュから音声データを取得を試みる
        cached_data = get_cached_voice(sentence, voice_id, language, speed)

        if cached_data:
            # キャッシュからデータを取得
            sentence_pcm_data = cached_data
        else:
            # キャッシュにない場合は新規生成
            print(f"新規音声生成（ストリーミング）: {sentence[:30]}...")
            sentence_pcm_data = generate_tts_pcm_bytes(sentence, voice_id, language, speed)
        
        # この文のPCMデータがあればストリーミング送信
        if sentence_pcm_data:
            yield sentence_pcm_data
            
            # 短いポーズを追加（文の間に0.2秒のサイレンス）
            if i < len(sentences) - 1:
                pause_samples = int(44100 * 0.2)  # 0.2秒のポーズ（44.1kHz、16bit）
                pause_data = b'\x00\x00' * pause_samples  # PCM s16le形式のサイレンス
                yield pause_data

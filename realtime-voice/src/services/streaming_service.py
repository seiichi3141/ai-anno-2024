"""
ストリーミング処理サービス
PCM音声のストリーミング配信に関する処理を担当
"""
import json
import base64
from typing import AsyncGenerator

from src.services.audio_service import get_tts_response
from src.services.text_service import split_text_into_sentences


async def generate_pcm_stream_by_sentences(text: str) -> AsyncGenerator[bytes, None]:
    """
    テキストを文単位で分割し、各文ごとに音声に変換してPCM s16le形式でストリーミングする
    
    Parameters:
    - text: 変換するテキスト
    """
    # テキストを文単位に分割
    sentences = split_text_into_sentences(text)
    print(f"テキストを{len(sentences)}個の文に分割しました")
    
    # 各文を順番に処理
    for i, sentence in enumerate(sentences):
        if not sentence.strip():
            continue  # 空文字はスキップ
            
        print(f"文 {i+1}/{len(sentences)} を処理中: {sentence[:30]}{'...' if len(sentence) > 30 else ''}")
        
        # APIリクエスト
        response = get_tts_response(text=sentence)
        
        # PCM音声データを集める
        sentence_pcm_data = b''
        
        # 各チャンクを処理してPCMデータを集める
        for chunk in response:
            try:
                if hasattr(chunk, 'data'):
                    # バイナリデータを取得
                    if isinstance(chunk.data, str):
                        try:
                            binary_data = base64.b64decode(chunk.data)
                            # JSONの場合も処理
                            if binary_data[:1] == b'{':
                                try:
                                    json_data = json.loads(binary_data)
                                    if 'audio' in json_data:
                                        binary_data = base64.b64decode(json_data['audio'])
                                except Exception:
                                    pass
                        except Exception:
                            binary_data = chunk.data.encode('latin1')
                    else:
                        binary_data = chunk.data
                        
                    # PCMバイナリデータをそのまま結合
                    sentence_pcm_data += binary_data
                        
            except Exception as e:
                print(f"PCMチャンク処理でエラー発生: {e}")
        
        # この文のPCMデータがあればストリーミング送信
        if sentence_pcm_data:
            yield sentence_pcm_data
            
            # 短いポーズを追加（文の間に0.2秒のサイレンス）
            if i < len(sentences) - 1:
                pause_samples = int(44100 * 0.2)  # 0.2秒のポーズ（44.1kHz、16bit）
                pause_data = b'\x00\x00' * pause_samples  # PCM s16le形式のサイレンス
                yield pause_data

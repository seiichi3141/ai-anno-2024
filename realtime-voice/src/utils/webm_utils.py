"""
WebMユーティリティ
PCMデータをWebM形式に変換するためのユーティリティ関数
"""
import os
import subprocess
import io
import tempfile
from typing import Union, AsyncGenerator

def is_ffmpeg_available() -> bool:
    """FFmpegが利用可能か確認する"""
    try:
        subprocess.run(['ffmpeg', '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
        return True
    except Exception:
        return False

def pcm_to_webm(pcm_data: bytes, sample_rate: int = 44100, channels: int = 1) -> bytes:
    """
    PCMデータをWebM形式に変換する
    
    Parameters:
    - pcm_data: PCM s16leフォーマットのバイトデータ
    - sample_rate: サンプルレート（デフォルト: 44100）
    - channels: チャンネル数（デフォルト: 1=モノラル）
    
    Returns:
    - WebM形式のバイトデータ
    """
    if not is_ffmpeg_available():
        raise RuntimeError("FFmpegが利用できません。FFmpegをインストールしてください。")
        
    # 一時ファイルを作成
    with tempfile.NamedTemporaryFile(suffix='.pcm', delete=False) as pcm_file:
        pcm_path = pcm_file.name
        pcm_file.write(pcm_data)
        
    try:
        # WebM出力用の一時ファイル
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file:
            webm_path = webm_file.name
            
        # FFmpegを使用してPCMからWebMに変換
        cmd = [
            'ffmpeg',
            '-f', 's16le',  # 入力形式: signed 16-bit little-endian
            '-ar', str(sample_rate),  # サンプルレート
            '-ac', str(channels),  # チャンネル数
            '-i', pcm_path,  # 入力ファイル
            '-c:a', 'libopus',  # 音声コーデック: Opus
            '-b:a', '96k',  # ビットレート
            '-f', 'webm',  # 出力形式: WebM
            webm_path  # 出力ファイル
        ]
        
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # WebMファイルを読み込む
        with open(webm_path, 'rb') as f:
            webm_data = f.read()
            
        return webm_data
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"FFmpegの実行に失敗しました: {e.stderr.decode()}") from e
        
    finally:
        # 一時ファイルを削除
        try:
            os.unlink(pcm_path)
            if 'webm_path' in locals():
                os.unlink(webm_path)
        except Exception:
            pass

async def pcm_stream_to_webm(pcm_stream: AsyncGenerator[bytes, None], sample_rate: int = 44100, channels: int = 1) -> AsyncGenerator[bytes, None]:
    """
    PCMストリームをWebMストリームに変換する
    注意: 現在の実装では、各チャンクごとに個別のWebMファイルを作成します
    
    Parameters:
    - pcm_stream: PCM s16leストリーム
    - sample_rate: サンプルレート（デフォルト: 44100）
    - channels: チャンネル数（デフォルト: 1=モノラル）
    
    Yields:
    - WebM形式のチャンク
    """
    if not is_ffmpeg_available():
        raise RuntimeError("FFmpegが利用できません。FFmpegをインストールしてください。")
    
    # チャンクごとに処理
    async for pcm_chunk in pcm_stream:
        if pcm_chunk:
            # PCMチャンクをWebMに変換
            webm_chunk = pcm_to_webm(pcm_chunk, sample_rate, channels)
            yield webm_chunk
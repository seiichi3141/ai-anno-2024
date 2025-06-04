"""
TTS（Text-to-Speech）関連のAPIルーター
PCM専用の音声合成システム + 音声キャッシュ機能
"""
import os
import io
from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from fastapi.responses import StreamingResponse

from src.models import TTSRequest
from src.auth import verify_api_key
from src.services.streaming_service import generate_pcm_stream_by_sentences
from src.services.audio_service import generate_tts_pcm_bytes
from src.services.voice_cache_service import get_cache_stats, clear_old_cache_entries
from src.utils.file_utils import cleanup_old_files, generate_filename, get_file_path
from src.utils.webm_utils import pcm_to_webm, pcm_stream_to_webm, is_ffmpeg_available

router = APIRouter(prefix="/tts", tags=["TTS"])

@router.post("/stream")
async def stream_tts(
    request: TTSRequest, 
    api_key: str = Depends(verify_api_key),
    background_tasks: BackgroundTasks = None
):
    """テキストを文単位で音声に変換し、PCM s16le形式でストリーミング配信する"""
    try:
        # デバッグ用にファイル名とパスを生成
        debug_pcm_filename = generate_filename(request.text, "pcm", prefix="debug_pcm_")
        debug_pcm_filepath = get_file_path(debug_pcm_filename)
        
        # WebM形式でも保存するためのファイル名とパス
        debug_webm_filename = generate_filename(request.text, "webm", prefix="debug_webm_")
        debug_webm_filepath = get_file_path(debug_webm_filename)
        
        # PCMファイルの保存用
        debug_pcm_file = open(debug_pcm_filepath, 'wb')
        
        # 全PCMデータを集めるためのバッファ
        all_pcm_data = bytearray()
        
        async def stream_generator():
            nonlocal all_pcm_data
            
            async for chunk in generate_pcm_stream_by_sentences(
                text=request.text,
                voice_id=getattr(request, 'voice_id', None),
                language=getattr(request, 'language', 'ja'),
                speed=getattr(request, 'speed', 'normal')
            ):
                # デバッグ用にPCMファイルに保存
                debug_pcm_file.write(chunk)
                # 後でWebM変換用に保持
                all_pcm_data.extend(chunk)
                yield chunk

            print(f"PCMストリーミング完了: {debug_pcm_filename}")
        
        # ストリーミングレスポンスを作成
        response = StreamingResponse(
            stream_generator(),
            media_type="audio/pcm",
            headers={
                "Content-Type": "audio/pcm",
                "Transfer-Encoding": "chunked",
                "X-Sample-Rate": "44100",
                "X-Channels": "1", 
                "X-Bit-Depth": "16",
                "X-Content-Type-Options": "nosniff"
            }
        )
        
        # ストリーミング終了後にファイルをクローズし、WebM形式でも保存するタスクを追加
        async def finish_streaming():
            debug_pcm_file.close()
        
        if background_tasks:
            background_tasks.add_task(finish_streaming)
            # 古いファイルのクリーンアップ
            background_tasks.add_task(cleanup_old_files)
        else:
            # BackgroundTasksがない場合は直接実行
            finish_streaming()
            cleanup_old_files()
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCM音声ストリーミングに失敗しました: {str(e)}")

@router.post("/bytes")
async def get_tts_bytes(
    request: TTSRequest, 
    api_key: str = Depends(verify_api_key),
    background_tasks: BackgroundTasks = None
):
    """テキストを音声に変換してPCM s16le形式のバイナリデータを返す"""
    try:
        # PCM音声データを生成
        pcm_data = generate_tts_pcm_bytes(
            text=request.text,
            voice_id=getattr(request, 'voice_id', None),
            language=getattr(request, 'language', 'ja'),
            speed=getattr(request, 'speed', 'normal')
        )
        
        # デバッグ用にPCMファイルに保存
        debug_pcm_filename = generate_filename(request.text, "pcm", prefix="debug_pcm_")
        debug_pcm_filepath = get_file_path(debug_pcm_filename)
        with open(debug_pcm_filepath, 'wb') as f:
            f.write(pcm_data)
        
        # 古いファイルのクリーンアップ
        if background_tasks:
            background_tasks.add_task(cleanup_old_files)
        else:
            cleanup_old_files()
        
        return StreamingResponse(
            io.BytesIO(pcm_data),
            media_type="audio/pcm",
            headers={
                "Content-Type": "audio/pcm",
                "Content-Length": str(len(pcm_data)),
                "X-Sample-Rate": "44100",
                "X-Channels": "1",
                "X-Bit-Depth": "16",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PCM音声生成に失敗しました: {str(e)}")

@router.post("/stream_webm")
async def stream_tts_webm(
    request: TTSRequest, 
    api_key: str = Depends(verify_api_key),
    background_tasks: BackgroundTasks = None
):
    """テキストを文単位で音声に変換し、WebM形式でストリーミング配信する"""
    try:
        if not is_ffmpeg_available():
            raise HTTPException(status_code=500, detail="FFmpegが利用できないためWebM変換ができません")
            
        # デバッグ用にファイル名とパスを生成
        debug_filename = generate_filename(request.text, "webm", prefix="debug_webm_")
        debug_filepath = get_file_path(debug_filename)
        
        # PCMストリームを生成
        pcm_stream = generate_pcm_stream_by_sentences(text=request.text)
        
        # PCMをWebMに変換するストリームを生成
        webm_stream = pcm_stream_to_webm(pcm_stream)
        
        # ストリーミング配信とデバッグファイル保存
        debug_file = open(debug_filepath, 'wb')
        
        async def stream_generator():
            async for chunk in webm_stream:
                # デバッグ用にファイルに保存
                debug_file.write(chunk)
                yield chunk
                
        # ストリーミング終了後にファイルをクローズするタスクを追加
        if background_tasks:
            background_tasks.add_task(lambda: debug_file.close())
            # 古いファイルのクリーンアップ
            background_tasks.add_task(cleanup_old_files)
        else:
            debug_file.close()
            cleanup_old_files()
        
        return StreamingResponse(
            stream_generator(),
            media_type="audio/webm",
            headers={
                "Content-Type": "audio/webm",
                "Transfer-Encoding": "chunked",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebM音声ストリーミングに失敗しました: {str(e)}")

@router.post("/bytes_webm")
async def get_tts_bytes_webm(
    request: TTSRequest, 
    api_key: str = Depends(verify_api_key),
    background_tasks: BackgroundTasks = None
):
    """テキストを音声に変換してWebM形式のバイナリデータを返す"""
    try:
        if not is_ffmpeg_available():
            raise HTTPException(status_code=500, detail="FFmpegが利用できないためWebM変換ができません")
            
        # PCM音声データを生成
        pcm_data = generate_tts_pcm_bytes(
            text=request.text,
            voice_id=getattr(request, 'voice_id', None),
            language=getattr(request, 'language', 'ja')
        )
        
        # PCMをWebMに変換
        webm_data = pcm_to_webm(pcm_data)
        
        # デバッグ用にファイルに保存
        debug_filename = generate_filename(request.text, "webm", prefix="debug_webm_")
        debug_filepath = get_file_path(debug_filename)
        with open(debug_filepath, 'wb') as f:
            f.write(webm_data)
        
        # 古いファイルのクリーンアップ
        if background_tasks:
            background_tasks.add_task(cleanup_old_files)
        else:
            cleanup_old_files()
        
        return StreamingResponse(
            io.BytesIO(webm_data),
            media_type="audio/webm",
            headers={
                "Content-Type": "audio/webm",
                "Content-Length": str(len(webm_data)),
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebM音声生成に失敗しました: {str(e)}")

@router.get("/cache/stats")
async def get_voice_cache_stats(api_key: str = Depends(verify_api_key)):
    """音声キャッシュの統計情報を取得する"""
    try:
        stats = get_cache_stats()
        return {
            "message": "音声キャッシュ統計情報",
            "cache_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"キャッシュ統計情報の取得に失敗しました: {str(e)}")

@router.delete("/cache/cleanup")
async def cleanup_voice_cache(
    days: int = 30,
    api_key: str = Depends(verify_api_key),
    background_tasks: BackgroundTasks = None
):
    """指定日数より古い音声キャッシュを削除する"""
    try:
        if background_tasks:
            background_tasks.add_task(clear_old_cache_entries, days)
            return {
                "message": f"{days}日以上前のキャッシュエントリのクリーンアップを開始しました"
            }
        else:
            # BackgroundTasksがない場合は直接実行
            clear_old_cache_entries(days)
            return {
                "message": f"{days}日以上前のキャッシュエントリをクリーンアップしました"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"キャッシュクリーンアップに失敗しました: {str(e)}")

"""
リクエスト・レスポンス用のPydanticモデル
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from src.config import DEFAULT_VOICE_ID

class VoiceParams(BaseModel):
    voice_id: str = Field(DEFAULT_VOICE_ID, description="声のID")
    speed: str = Field("normal", description="読み上げ速度（slow, normal, fast）")
    pitch: float = Field(0.0, description="ピッチの調整（-1.0から1.0）", ge=-1.0, le=1.0)
    volume: float = Field(1.0, description="音量の調整（0.0から2.0）", ge=0.0, le=2.0)

class TTSRequest(BaseModel):
    text: str = Field("テクノロジーで誰も取り残さない日本へ。テクノロジーで政治をかえる。あなたと一緒に未来をつくる。", description="読み上げるテキスト")
    voice_id: str = Field(DEFAULT_VOICE_ID, description="声のID")
    language: str = Field("ja", description="言語コード")
    speed: str = Field("normal", description="読み上げ速度")

class TextSegment(BaseModel):
    text: str = Field(..., description="読み上げるテキスト")
    voice_params: Optional[VoiceParams] = Field(None, description="このセグメントの声のパラメータ")

class ConcatTTSRequest(BaseModel):
    segments: List[TextSegment] = Field(..., description="連結するテキストセグメントのリスト")
    language: str = Field("ja", description="言語コード")
    default_voice_params: VoiceParams = Field(default_factory=VoiceParams, description="デフォルトの声のパラメータ")
    add_pause_between_segments: bool = Field(True, description="セグメント間に短いポーズを追加するか")

class BatchTTSRequest(BaseModel):
    texts: List[str] = Field(..., description="読み上げるテキストのリスト")
    voice_params: VoiceParams = Field(default_factory=VoiceParams, description="声のパラメータ")
    language: str = Field("ja", description="言語コード")

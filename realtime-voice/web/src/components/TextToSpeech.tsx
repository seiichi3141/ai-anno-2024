"use client";

import { useState } from "react";
import { usePCMStreamPlayback } from "../hooks/usePCMStreamPlayback";
import { TextToSpeechLayout } from "../components/TextToSpeechLayout";

export default function TextToSpeech() {
  const [error, setError] = useState<string | null>(null);

  const {
    isLoading,
    isPlaying,
    error: audioError,
    streamPCMAudio,
    stopAudio,
  } = usePCMStreamPlayback({
    onError: (message: string) => setError(message),
  });

  // テキストを読み上げる処理
  const handleTextSubmit = async (text: string) => {
    await streamPCMAudio(text);
  };

  // 保存済み音声の再生/停止（ストリーミング再生のため停止のみ）
  const handlePlaySaved = () => {
    if (isPlaying) {
      stopAudio();
    }
    // usePCMStreamPlaybackには保存済み音声再生機能がないため、
    // ストリーミング再生を停止するのみ
  };

  return (
    <TextToSpeechLayout
      onSubmit={handleTextSubmit}
      onPlaySaved={handlePlaySaved}
      isLoading={isLoading}
      isPlaying={isPlaying}
      hasAudioBuffer={false} // ストリーミング再生のため保存済みバッファーなし
      error={error || audioError}
    />
  );
}

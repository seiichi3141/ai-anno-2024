import { useState, useRef } from "react";

interface PCMAudioPlaybackOptions {
  onError: (message: string) => void;
}

export interface PCMAudioPlaybackResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  playPCMAudio: (text: string) => Promise<void>;
  stopAudio: () => void;
  playStoredAudio: () => void;
}

export function usePCMAudioPlayback({
  onError,
}: PCMAudioPlaybackOptions): PCMAudioPlaybackResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const storedAudioBufferRef = useRef<AudioBuffer | null>(null);

  // 音声の停止
  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
    }
  };

  // 保存済み音声の再生
  const playStoredAudio = () => {
    if (!audioContextRef.current || !storedAudioBufferRef.current) return;

    // 再生中なら停止
    if (isPlaying && audioSourceRef.current) {
      stopAudio();
      return;
    }

    // 新しいソースを作成して再生
    const source = audioContextRef.current.createBufferSource();
    source.buffer = storedAudioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.start(0);

    audioSourceRef.current = source;
    setIsPlaying(true);

    // 再生終了時の処理
    source.onended = () => {
      setIsPlaying(false);
      audioSourceRef.current = null;
    };
  };

  // PCMバイナリデータをAudioBufferに変換
  const convertPCMToAudioBuffer = async (
    pcmData: ArrayBuffer,
    sampleRate: number = 44100,
    channels: number = 1
  ): Promise<AudioBuffer> => {
    if (!audioContextRef.current) {
      throw new Error("AudioContext が初期化されていません");
    }

    // バイト長が奇数の場合、1バイトのパディングを追加
    let adjustedData = pcmData;
    if (pcmData.byteLength % 2 !== 0) {
      console.warn(
        `PCMデータのバイト長が奇数です (${pcmData.byteLength}バイト)。パディングを追加します。`
      );
      const paddedArray = new Uint8Array(pcmData.byteLength + 1);
      paddedArray.set(new Uint8Array(pcmData));
      paddedArray[pcmData.byteLength] = 0; // パディングバイトを0で埋める
      adjustedData = paddedArray.buffer;
    }

    // PCM s16le データを解析（16ビット符号付き整数、リトルエンディアン）
    const samples = new Int16Array(adjustedData);
    const floatSamples = new Float32Array(samples.length);

    // 16ビット整数を-1.0から1.0の範囲の浮動小数点に変換
    for (let i = 0; i < samples.length; i++) {
      floatSamples[i] = samples[i] / 32768.0;
    }

    // AudioBufferを作成
    const audioBuffer = audioContextRef.current.createBuffer(
      channels,
      floatSamples.length,
      sampleRate
    );

    // データをAudioBufferにコピー
    audioBuffer.copyToChannel(floatSamples, 0);

    return audioBuffer;
  };

  // PCM音声の再生
  const playPCMAudio = async (text: string) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError(null);
    // 再生中の音声があれば停止
    stopAudio();

    try {
      // AudioContextの初期化
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }

      const audioContext = audioContextRef.current;

      // ユーザー操作で音声再生を許可させる（iOS/Safariなどの制約のため）
      await audioContext.resume();

      // PCMバイナリデータを取得
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tts/bytes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            language: "ja",
            voice_id: "2334b692-d045-48b5-ac45-d7bf5785026f",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.statusText}`);
      }

      // PCMバイナリデータを取得
      const pcmArrayBuffer = await response.arrayBuffer();
      console.log(
        "PCMデータを受信しました:",
        pcmArrayBuffer.byteLength,
        "バイト"
      );

      // PCMデータをAudioBufferに変換
      const audioBuffer = await convertPCMToAudioBuffer(
        pcmArrayBuffer,
        44100, // サンプルレート
        1 // モノラル
      );

      // 音声を保存
      storedAudioBufferRef.current = audioBuffer;

      // 音声を再生
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);

      audioSourceRef.current = source;
      setIsPlaying(true);

      // 再生終了時の処理
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };

      console.log("PCM音声の再生を開始しました");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知のエラー";
      setError(errorMessage);
      onError(errorMessage);
      console.error("PCM音声再生エラー:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    playPCMAudio,
    stopAudio,
    playStoredAudio,
  };
}

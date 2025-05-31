import { useState, useRef } from "react";

interface AudioPlaybackOptions {
  onError: (message: string) => void;
}

export interface AudioPlaybackResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  streamAudio: (text: string) => Promise<void>;
  stopAudio: () => void;
  playAudio: () => void;
}

export function useAudioPlayback({
  onError,
}: AudioPlaybackOptions): AudioPlaybackResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // 音声の停止
  const stopAudio = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      setIsPlaying(false);
    }
  };

  // 保存済み音声の再生
  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    // 再生中なら停止
    if (isPlaying && audioSourceRef.current) {
      stopAudio();
      return;
    }

    // 新しいソースを作成して再生
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
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

  // PCM音声データをAudioBufferに変換
  const convertPCMToAudioBuffer = async (
    pcmData: Uint8Array,
    audioContext: AudioContext
  ): Promise<AudioBuffer> => {
    // PCM s16le形式（44.1kHz, 16bit, モノラル）のデータを想定
    const sampleRate = 44100;
    const numChannels = 1;

    // バイト長が奇数の場合、1バイトのパディングを追加
    let adjustedData = pcmData;
    if (pcmData.byteLength % 2 !== 0) {
      console.warn(
        `PCMデータのバイト長が奇数です (${pcmData.byteLength}バイト)。パディングを追加します。`
      );
      adjustedData = new Uint8Array(pcmData.byteLength + 1);
      adjustedData.set(pcmData);
      adjustedData[pcmData.byteLength] = 0; // パディングバイトを0で埋める
    }

    // Int16Arrayとして解釈
    const int16Data = new Int16Array(
      adjustedData.buffer,
      adjustedData.byteOffset,
      adjustedData.byteLength / 2
    );
    const numSamples = int16Data.length;

    // AudioBufferを作成
    const audioBuffer = audioContext.createBuffer(
      numChannels,
      numSamples,
      sampleRate
    );
    const channelData = audioBuffer.getChannelData(0);

    // Int16データをFloat32データに変換（-1.0 ~ 1.0の範囲）
    for (let i = 0; i < numSamples; i++) {
      channelData[i] = int16Data[i] / 32768.0;
    }

    return audioBuffer;
  };

  // 音声ストリーミングの開始
  const streamAudio = async (text: string) => {
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

      // APIリクエスト
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tts/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            language: "ja",
            voice_id: "2334b692-d045-48b5-ac45-d7bf5785026f",
            speed: "normal",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.statusText}`);
      }

      // レスポンスボディの取得
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("ストリーミングレスポンスを取得できません");
      }

      // PCMデータを蓄積するための配列
      const allPCMChunks: Uint8Array[] = [];
      let totalLength = 0;

      // PCMストリーミング処理
      const processPCMAudio = async () => {
        try {
          setIsPlaying(true);
          console.log("PCMストリーミング開始");

          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            // チャンクを保存
            allPCMChunks.push(value);
            totalLength += value.length;

            console.log(`PCMチャンク受信: ${value.length}バイト`);

            // 一定量のデータが集まったら再生開始
            if (allPCMChunks.length === 1 || totalLength >= 44100 * 2) {
              // 1秒分のデータ
              try {
                // 現在までのデータを結合
                const combinedData = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of allPCMChunks) {
                  combinedData.set(chunk, offset);
                  offset += chunk.length;
                }

                // PCMデータをAudioBufferに変換
                const audioBuffer = await convertPCMToAudioBuffer(
                  combinedData,
                  audioContext
                );

                // 既存の再生があれば停止
                if (audioSourceRef.current) {
                  audioSourceRef.current.stop();
                }

                // 再生開始
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);

                audioSourceRef.current = source;

                // 再生終了時の処理
                source.onended = () => {
                  if (audioSourceRef.current === source) {
                    audioSourceRef.current = null;
                  }
                };

                console.log("PCMデータの再生開始");
              } catch (convertError) {
                console.warn("PCMデータの変換に失敗:", convertError);
              }
            }
          }

          // 全てのデータを結合して最終的なオーディオバッファを作成
          const finalCombinedData = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of allPCMChunks) {
            finalCombinedData.set(chunk, offset);
            offset += chunk.length;
          }

          try {
            const finalAudioBuffer = await convertPCMToAudioBuffer(
              finalCombinedData,
              audioContext
            );
            audioBufferRef.current = finalAudioBuffer;
            console.log("全PCMデータの保存完了（再生ボタンで再生可能）");

            // 再生中でなければ最終データで再生
            if (!audioSourceRef.current) {
              const source = audioContext.createBufferSource();
              source.buffer = finalAudioBuffer;
              source.connect(audioContext.destination);
              source.start(0);

              audioSourceRef.current = source;
              setIsPlaying(true);

              source.onended = () => {
                setIsPlaying(false);
                audioSourceRef.current = null;
              };

              console.log("最終PCMデータの再生開始");
            }
          } catch (finalError) {
            console.error("最終PCMデータの処理に失敗:", finalError);
          }
        } catch (error) {
          console.error("PCM音声処理エラー:", error);
          setError("音声データの処理中にエラーが発生しました");
          setIsPlaying(false);
        } finally {
          if (!audioSourceRef.current) {
            setIsPlaying(false);
          }
        }
      };

      // PCM音声処理を開始
      await processPCMAudio()
        .catch((err) => {
          console.error("PCM音声処理エラー:", err);
          const errorMessage =
            err instanceof Error ? err.message : "不明なエラーが発生しました";
          setError(errorMessage);
          if (onError) {
            onError(errorMessage);
          }
          setIsPlaying(false);
        })
        .finally(() => setIsLoading(false));
    } catch (err) {
      console.error("音声ストリーミングエラー:", err);
      const errorMessage =
        err instanceof Error ? err.message : "不明なエラーが発生しました";
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    streamAudio,
    stopAudio,
    playAudio,
  };
}

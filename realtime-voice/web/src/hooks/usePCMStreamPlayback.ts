import { useState, useRef } from "react";

interface PCMStreamPlaybackOptions {
  onError: (message: string) => void;
}

export interface PCMStreamPlaybackResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  streamPCMAudio: (text: string) => Promise<void>;
  stopAudio: () => void;
}

export function usePCMStreamPlayback({
  onError,
}: PCMStreamPlaybackOptions): PCMStreamPlaybackResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const playbackScheduleTimeRef = useRef<number>(0);

  // 音声の停止
  const stopAudio = () => {
    // 現在の再生中の全ソースを停止
    audioSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // 既に停止済みの場合はエラーを無視
      }
    });
    audioSourcesRef.current = [];

    // ストリーミングを中断
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 再生スケジュールをリセット
    playbackScheduleTimeRef.current = 0;

    setIsPlaying(false);
    console.log("音声再生を停止しました");
  };

  // PCMチャンクを即座に再生する関数
  const playPCMChunk = async (
    pcmData: ArrayBuffer,
    startTime: number = 0
  ): Promise<number> => {
    if (!audioContextRef.current) {
      throw new Error("AudioContext が初期化されていません");
    }

    const audioContext = audioContextRef.current;

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

    // データサイズチェック
    if (samples.length === 0) {
      console.warn("空のPCMデータが渡されました");
      return startTime;
    }

    const floatSamples = new Float32Array(samples.length);

    // 16ビット整数を-1.0から1.0の範囲の浮動小数点に変換
    for (let i = 0; i < samples.length; i++) {
      floatSamples[i] = samples[i] / 32768.0;
    }

    // AudioBufferを作成
    const audioBuffer = audioContext.createBuffer(
      1, // モノラル
      floatSamples.length,
      44100 // サンプルレート
    );

    // データをAudioBufferにコピー
    audioBuffer.copyToChannel(floatSamples, 0);

    // 音声ソースを作成して再生
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    // ソースを管理リストに追加
    audioSourcesRef.current.push(source);

    // 再生終了時にリストから削除
    source.onended = () => {
      const index = audioSourcesRef.current.indexOf(source);
      if (index > -1) {
        audioSourcesRef.current.splice(index, 1);
      }
    };

    // スケジュールされた時間で再生開始
    const currentTime = audioContext.currentTime;
    const actualStartTime = Math.max(currentTime, startTime);
    source.start(actualStartTime);

    // このチャンクの再生時間を計算
    const chunkDuration = audioBuffer.length / audioBuffer.sampleRate;

    console.log(
      `PCMチャンクを再生: ${samples.length}サンプル (${((samples.length / 44100) * 1000).toFixed(1)}ms), 時間: ${actualStartTime.toFixed(3)}s`
    );

    return actualStartTime + chunkDuration;
  };

  // ストリーミングPCM音声の再生
  const streamPCMAudio = async (text: string) => {
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

      // 再生スケジュール時間を初期化
      playbackScheduleTimeRef.current = audioContext.currentTime;

      // AbortControllerを作成してストリーミングを制御可能にする
      abortControllerRef.current = new AbortController();

      // PCMストリーミングデータを取得
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
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("レスポンスボディが存在しません");
      }

      // ReadableStreamの読み取りを開始
      const reader = response.body.getReader();
      setIsPlaying(true);
      setIsLoading(false); // データ受信開始と同時にローディング終了

      // PCMデータのバッファサイズ（約50ms分のデータ - より低レイテンシー）
      const targetChunkSize = 44100 * 2 * 0.05; // 44.1kHz * 16bit(2bytes) * 0.05秒
      let accumulatedData = new Uint8Array(0);
      let isFirstChunk = true;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // 残りのデータがあれば再生
            if (accumulatedData.length > 0) {
              const nextPlayTime = await playPCMChunk(
                accumulatedData.buffer,
                playbackScheduleTimeRef.current
              );
              playbackScheduleTimeRef.current = nextPlayTime;
            }
            console.log("ストリーミング完了");
            break;
          }

          if (value) {
            // 受信データを累積バッファに追加
            const newAccumulated = new Uint8Array(
              accumulatedData.length + value.length
            );
            newAccumulated.set(accumulatedData);
            newAccumulated.set(value, accumulatedData.length);
            accumulatedData = newAccumulated;

            console.log(
              `PCMチャンクを受信: ${value.length}バイト, 累積: ${accumulatedData.length}バイト`
            );

            // 最初のチャンクは少ないデータでも即座に再生開始（低レイテンシー）
            // その後は一定サイズ以上のデータが蓄積されたら再生
            const shouldPlay = isFirstChunk
              ? accumulatedData.length >= 2048 // 最初は1024サンプル（約21ms）で開始
              : accumulatedData.length >= targetChunkSize;

            if (shouldPlay) {
              // 最初のチャンクかどうかをここで記録（alignedLengthが0でもフラグをリセット）
              const wasFirstChunk = isFirstChunk;
              if (isFirstChunk) {
                isFirstChunk = false;
              }

              // 再生する分だけ取り出し（512サンプル単位で切り出し）
              const sampleAlignment = 512 * 2; // 512サンプル * 2バイト
              const alignedLength =
                Math.floor(accumulatedData.length / sampleAlignment) *
                sampleAlignment;

              if (alignedLength > 0) {
                const playData = accumulatedData.slice(0, alignedLength);

                // 残りのデータを保持
                accumulatedData = accumulatedData.slice(alignedLength);

                // チャンクを再生
                const nextPlayTime = await playPCMChunk(
                  playData.buffer,
                  playbackScheduleTimeRef.current
                );
                playbackScheduleTimeRef.current = nextPlayTime;

                if (wasFirstChunk) {
                  console.log("最初のPCMチャンクを再生開始");
                }
              }
            }
          }
        }

        // 全体の再生が完了するまで待機
        const finalEndTime = playbackScheduleTimeRef.current;
        const currentTime = audioContext.currentTime;
        if (finalEndTime > currentTime) {
          const remainingTime = (finalEndTime - currentTime) * 1000;
          console.log(`再生完了まで残り ${remainingTime.toFixed(0)}ms`);
          setTimeout(() => {
            setIsPlaying(false);
            console.log("PCMストリーミング再生完了");
          }, remainingTime);
        } else {
          setIsPlaying(false);
          console.log("PCMストリーミング再生完了");
        }

        console.log("PCMストリーミング音声の再生を開始しました");
      } catch (readerError) {
        if (
          readerError instanceof DOMException &&
          readerError.name === "AbortError"
        ) {
          console.log("ストリーミングが中断されました");
        } else {
          throw readerError;
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        console.log("リクエストが中断されました");
        setError("再生が中断されました");
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "未知のエラー";
        setError(errorMessage);
        onError(errorMessage);
        console.error("PCMストリーミング再生エラー:", err);
      }
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
      abortControllerRef.current = null;
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    streamPCMAudio,
    stopAudio,
  };
}

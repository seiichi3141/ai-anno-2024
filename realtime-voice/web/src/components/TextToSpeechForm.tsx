import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  Alert,
  Chip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import MicIcon from "@mui/icons-material/Mic";

interface TextToSpeechFormProps {
  onSubmit: (text: string) => Promise<void>;
  onPlaySaved: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  hasAudioBuffer: boolean;
  error: string | null;
}

export const TextToSpeechForm: React.FC<TextToSpeechFormProps> = ({
  onSubmit,
  onPlaySaved,
  isLoading,
  isPlaying,
  hasAudioBuffer,
  error,
}) => {
  const [text, setText] = useState(
    "テクノロジーで誰も取り残さない日本へ。テクノロジーで政治をかえる。あなたと一緒に未来をつくる。"
  );

  // テキスト入力の処理
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  // 送信処理
  const handleSubmit = async () => {
    if (!text.trim()) return;
    await onSubmit(text);
  };

  return (
    <Box component="form" noValidate autoComplete="off">
      {/* エラー表示 */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            border: "1px solid #fd8c73",
            backgroundColor: "#ffebe9",
            color: "#d1242f",
            "& .MuiAlert-icon": {
              color: "#d1242f",
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            エラーが発生しました
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* テキスト入力エリア */}
      <Box sx={{ mb: 3 }}>
        <Typography
          component="label"
          sx={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#1c2128",
            mb: 1,
          }}
        >
          読み上げるテキスト
        </Typography>
        <TextField
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          value={text}
          onChange={handleTextChange}
          disabled={isLoading}
          placeholder="音声合成したいテキストを入力してください..."
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "#ffffff",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              "&.Mui-focused": {
                "& fieldset": {
                  borderWidth: "2px",
                },
              },
            },
            "& .MuiOutlinedInput-input": {
              padding: "12px",
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1,
            color: "#656d76",
            fontSize: "0.75rem",
          }}
        >
          文字数: {text.length} / 2000
        </Typography>
      </Box>

      {/* 音声フォーマット情報 */}
      <Box sx={{ mb: 4 }}>
        <Typography
          component="div"
          sx={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "#1c2128",
            mb: 2,
          }}
        >
          音声フォーマット
        </Typography>
        <Box
          sx={{
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            p: 2,
            backgroundColor: "#f0f6ff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  color: "#1c2128",
                  fontSize: "0.875rem",
                  mb: 0.5,
                }}
              >
                PCM ストリーミング
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "#656d76",
                  fontSize: "0.75rem",
                }}
              >
                高品質・リアルタイム配信
              </Typography>
            </Box>
            <Chip
              label="選択中"
              size="small"
              sx={{
                backgroundColor: "#dbeafe",
                color: "#0969da",
                fontSize: "0.75rem",
                fontWeight: 500,
                height: "20px",
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* コントロールボタン */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <MicIcon sx={{ fontSize: "1rem" }} />
            )
          }
          sx={{
            px: 3,
            py: 1,
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            boxShadow: "0 1px 0 rgba(27, 31, 36, 0.04)",
            "&:hover": {
              boxShadow: "0 1px 0 rgba(27, 31, 36, 0.1)",
            },
          }}
        >
          {isLoading ? "処理中..." : "音声を生成"}
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label="PCM"
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.75rem",
              borderColor: "#d0d7de",
              color: "#656d76",
            }}
          />

          {hasAudioBuffer && (
            <IconButton
              onClick={onPlaySaved}
              disabled={isLoading}
              sx={{
                border: "1px solid #d0d7de",
                borderRadius: "6px",
                p: "6px",
                "&:hover": {
                  backgroundColor: "#f6f8fa",
                  borderColor: "#8c959f",
                },
              }}
            >
              {isPlaying ? (
                <StopIcon sx={{ fontSize: "1.25rem", color: "#d1242f" }} />
              ) : (
                <PlayArrowIcon sx={{ fontSize: "1.25rem", color: "#1a7f37" }} />
              )}
            </IconButton>
          )}
        </Box>
      </Box>

      {/* ステータス表示 */}
      {(isLoading || isPlaying) && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            backgroundColor: "#f6f8fa",
            borderRadius: "6px",
            border: "1px solid #d0d7de",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.875rem",
              color: "#656d76",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {isLoading && <CircularProgress size={14} />}
            {isLoading ? "音声を生成中..." : isPlaying ? "音声を再生中..." : ""}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

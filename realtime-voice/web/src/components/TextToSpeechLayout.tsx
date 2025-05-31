import React from "react";
import {
  Container,
  Typography,
  Paper,
  Divider,
  Box,
  Chip,
} from "@mui/material";
import { TextToSpeechForm } from "./TextToSpeechForm";

interface TextToSpeechLayoutProps {
  onSubmit: (text: string) => Promise<void>;
  onPlaySaved: () => void;
  isLoading: boolean;
  isPlaying: boolean;
  hasAudioBuffer: boolean;
  error: string | null;
}

export const TextToSpeechLayout: React.FC<TextToSpeechLayoutProps> = ({
  onSubmit,
  onPlaySaved,
  isLoading,
  isPlaying,
  hasAudioBuffer,
  error,
}) => {
  return (
    <Box sx={{ backgroundColor: "#f6f8fa", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: "2.5rem",
              fontWeight: 600,
              color: "#1c2128",
              mb: 2,
            }}
          >
            🎤 リアルタイム音声合成
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#656d76",
              fontSize: "1.125rem",
              mb: 3,
            }}
          >
            高品質な音声合成でテキストを自然な音声に変換
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            <Chip
              label="Real-time"
              size="small"
              sx={{
                backgroundColor: "#dafbe1",
                color: "#1a7f37",
                fontWeight: 500,
                border: "1px solid #1a7f37",
              }}
            />
            <Chip
              label="High Quality"
              size="small"
              sx={{
                backgroundColor: "#dbeafe",
                color: "#0969da",
                fontWeight: 500,
                border: "1px solid #0969da",
              }}
            />
            <Chip
              label="Streaming"
              size="small"
              sx={{
                backgroundColor: "#fff8c5",
                color: "#9a6700",
                fontWeight: 500,
                border: "1px solid #9a6700",
              }}
            />
          </Box>
        </Box>

        {/* Main content */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #d0d7de",
            borderRadius: "12px",
            overflow: "hidden",
            mb: 4,
          }}
        >
          {/* Paper header */}
          <Box
            sx={{
              backgroundColor: "#f6f8fa",
              borderBottom: "1px solid #d0d7de",
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#1c2128",
                m: 0,
                flex: 1,
              }}
            >
              音声合成コントロール
            </Typography>
            {isPlaying && (
              <Chip
                label="再生中"
                size="small"
                sx={{
                  backgroundColor: "#dafbe1",
                  color: "#1a7f37",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              />
            )}
            {isLoading && (
              <Chip
                label="処理中"
                size="small"
                sx={{
                  backgroundColor: "#fff8c5",
                  color: "#9a6700",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              />
            )}
          </Box>

          {/* Paper content */}
          <Box sx={{ p: 3 }}>
            <TextToSpeechForm
              onSubmit={onSubmit}
              onPlaySaved={onPlaySaved}
              isLoading={isLoading}
              isPlaying={isPlaying}
              hasAudioBuffer={hasAudioBuffer}
              error={error}
            />
          </Box>
        </Paper>

        {/* Footer */}
        <Box sx={{ textAlign: "center" }}>
          <Divider sx={{ mb: 3, borderColor: "#d0d7de" }} />
          <Typography
            variant="body2"
            sx={{
              color: "#656d76",
              fontSize: "0.875rem",
              mb: 1,
            }}
          >
            このアプリはリアルタイム音声合成技術を使用しています
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#8c959f",
              fontSize: "0.75rem",
            }}
          >
            Powered by Team Mirai
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

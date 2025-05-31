"use client";

import { createTheme } from "@mui/material/styles";

// GitHubのカラーパレット（Primer Design System）
const githubColors = {
  // グレースケール
  gray: {
    50: "#f6f8fa",
    100: "#eaeef2",
    200: "#d0d7de",
    300: "#afb8c1",
    400: "#8c959f",
    500: "#656d76",
    600: "#424a53",
    700: "#32383f",
    800: "#24292f",
    900: "#1c2128",
  },
  // ブルー（GitHub ブランドカラー）
  blue: {
    50: "#dbeafe",
    100: "#c3ddfd",
    200: "#a4cafe",
    300: "#78a9ff",
    400: "#218bff",
    500: "#0969da",
    600: "#0550ae",
    700: "#033d8b",
    800: "#0a3069",
    900: "#002155",
  },
  // グリーン（成功）
  green: {
    50: "#dafbe1",
    100: "#aceebb",
    200: "#6fdd8b",
    300: "#4ac26b",
    400: "#2da44e",
    500: "#1a7f37",
    600: "#116329",
    700: "#044f1e",
    800: "#0d4117",
    900: "#0a2e0c",
  },
  // レッド（エラー）
  red: {
    50: "#ffebe9",
    100: "#ffd8cc",
    200: "#ffb3a5",
    300: "#fd8c73",
    400: "#fa7970",
    500: "#d1242f",
    600: "#a40e26",
    700: "#8b0000",
    800: "#67001f",
    900: "#4c0519",
  },
  // 背景とボーダー
  canvas: {
    default: "#ffffff",
    overlay: "#ffffff",
    inset: "#f6f8fa",
    subtle: "#f6f8fa",
  },
  border: {
    default: "#d0d7de",
    muted: "#d8dee4",
    subtle: "#eaeef2",
  },
};

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: githubColors.blue[500],
      light: githubColors.blue[300],
      dark: githubColors.blue[700],
      contrastText: "#ffffff",
    },
    secondary: {
      main: githubColors.gray[600],
      light: githubColors.gray[400],
      dark: githubColors.gray[800],
      contrastText: "#ffffff",
    },
    success: {
      main: githubColors.green[500],
      light: githubColors.green[300],
      dark: githubColors.green[700],
      contrastText: "#ffffff",
    },
    error: {
      main: githubColors.red[500],
      light: githubColors.red[300],
      dark: githubColors.red[700],
      contrastText: "#ffffff",
    },
    background: {
      default: githubColors.canvas.default,
      paper: githubColors.canvas.default,
    },
    text: {
      primary: githubColors.gray[900],
      secondary: githubColors.gray[700],
      disabled: githubColors.gray[500],
    },
    divider: githubColors.border.default,
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "system-ui",
      "Helvetica",
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
    ].join(","),
    h1: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.25,
      color: githubColors.gray[900],
      marginBottom: "1rem",
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.25,
      color: githubColors.gray[900],
      marginBottom: "0.75rem",
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.25,
      color: githubColors.gray[900],
      marginBottom: "0.5rem",
    },
    h4: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.25,
      color: githubColors.gray[900],
      marginBottom: "0.5rem",
    },
    body1: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: githubColors.gray[800],
    },
    body2: {
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: githubColors.gray[700],
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.33,
      color: githubColors.gray[600],
    },
  },
  shape: {
    borderRadius: 6,
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: "20px",
          padding: "5px 16px",
          border: "1px solid transparent",
          borderRadius: "6px",
          transition: "0.2s cubic-bezier(0.3, 0, 0.5, 1)",
          transitionProperty: "color, background-color, border-color",
          "&:focus": {
            outline: "2px solid",
            outlineColor: githubColors.blue[500],
            outlineOffset: "-2px",
          },
        },
        contained: {
          backgroundColor: githubColors.blue[500],
          color: "#ffffff",
          border: "1px solid transparent",
          boxShadow: "0 1px 0 rgba(27, 31, 36, 0.04)",
          "&:hover": {
            backgroundColor: githubColors.blue[600],
            boxShadow: "0 1px 0 rgba(27, 31, 36, 0.1)",
          },
          "&:active": {
            backgroundColor: githubColors.blue[700],
            boxShadow: "inset 0 1px 0 rgba(0, 0, 0, 0.2)",
          },
          "&:disabled": {
            backgroundColor: githubColors.gray[200],
            color: githubColors.gray[500],
            borderColor: githubColors.border.default,
          },
        },
        outlined: {
          backgroundColor: githubColors.canvas.default,
          color: githubColors.gray[900],
          border: `1px solid ${githubColors.border.default}`,
          "&:hover": {
            backgroundColor: githubColors.gray[50],
            borderColor: githubColors.gray[300],
          },
          "&:active": {
            backgroundColor: githubColors.gray[100],
            borderColor: githubColors.gray[300],
          },
        },
        text: {
          color: githubColors.blue[600],
          "&:hover": {
            textDecoration: "underline",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: githubColors.canvas.default,
            fontSize: "0.875rem",
            borderRadius: "6px",
            "& fieldset": {
              borderColor: githubColors.border.default,
              borderWidth: "1px",
            },
            "&:hover fieldset": {
              borderColor: githubColors.gray[400],
            },
            "&.Mui-focused fieldset": {
              borderColor: githubColors.blue[500],
              borderWidth: "2px",
            },
            "&.Mui-error fieldset": {
              borderColor: githubColors.red[500],
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.875rem",
            color: githubColors.gray[700],
            "&.Mui-focused": {
              color: githubColors.blue[600],
            },
            "&.Mui-error": {
              color: githubColors.red[600],
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "8px 12px",
            lineHeight: "1.5",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: githubColors.canvas.default,
          border: `1px solid ${githubColors.border.default}`,
          borderRadius: "6px",
          boxShadow:
            "0 1px 3px rgba(27, 31, 36, 0.12), 0 8px 24px rgba(66, 74, 83, 0.12)",
        },
        elevation3: {
          boxShadow: "0 8px 24px rgba(149, 157, 165, 0.2)",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: "16px",
          paddingRight: "16px",
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          fontWeight: 600,
          color: githubColors.gray[900],
          marginBottom: "8px",
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: githubColors.gray[400],
          "&.Mui-checked": {
            color: githubColors.blue[500],
          },
          "& .MuiSvgIcon-root": {
            fontSize: "1rem",
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: "0.875rem",
          color: githubColors.gray[800],
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: "8px",
          borderRadius: "6px",
          "&:hover": {
            backgroundColor: githubColors.gray[100],
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: githubColors.blue[500],
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.MuiTypography-body2": {
            fontSize: "0.75rem",
            color: githubColors.gray[600],
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: githubColors.border.default,
        },
      },
    },
  },
});

export default theme;

// Paleta exacta de Te Quiero Con Locura
export const colors = {
  bg: "#0F001D",
  surface: "#1a1f2e",
  surfaceDeep: "#160a26",
  primary: "#27DFFE",
  primaryDark: "#0E5BE5",
  secondary: "#D869FE",
  secondaryDark: "#5D25DC",
  accent: "#9F58F6",
  text: "#EFEAFE",
  textDim: "rgba(239, 234, 254, 0.5)",
  glowBlue: "#5DEDFE",
  glowPink: "#E89DFE",
  together: "#a1bbff",
} as const;

export type UserId = "laury" | "danny";

export const userColors = {
  laury: {
    light: "#D869FE",
    glow: "#E89DFE",
    shadow: "#5D25DC",
    gradient: ["#D869FE", "#5D25DC"] as const,
  },
  danny: {
    light: "#27DFFE",
    glow: "#5DEDFE",
    shadow: "#0E5BE5",
    gradient: ["#27DFFE", "#0E5BE5"] as const,
  },
};

export const getUserColors = (u: UserId) => userColors[u];

export const rarityColors = {
  comun: { border: "#9CA3AF", glow: "#9CA3AF", bg: "#374151", label: "COMÚN", reward: 10 },
  rara: { border: "#3B82F6", glow: "#60A5FA", bg: "#1E3A5F", label: "RARA", reward: 25 },
  epica: { border: "#A855F7", glow: "#C084FC", bg: "#4C1D95", label: "ÉPICA", reward: 50 },
  legendaria: { border: "#F59E0B", glow: "#FBBF24", bg: "#78350F", label: "LEGENDARIA", reward: 100 },
} as const;

export const LOGO_URL = "https://i.postimg.cc/cCJxBKN0/Chat-GPT-Image-22-may-2026-03-28-14.png";

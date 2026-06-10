import { useEffect, useRef, useState, useCallback } from "react";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export type UserId = "laury" | "danny";

export interface PublicUser {
  id: UserId;
  name: string;
  age: string;
  birthday: string;
  zodiac: string;
  skills: string;
  avatar: string;
  primary: string;
  glow: string;
  dark: string;
}

export interface UserData {
  level: number;
  currentXP: number;
  totalXP: number;
}

export interface BubbleState {
  emoji: string;
  text: string;
}

export type LocationType = "mi_casa" | "fuera_casa" | "cita" | "casa_danny" | "casa_laury";

export type MissionRarity = "comun" | "rara" | "epica" | "legendaria";

export interface Mission {
  id: string;
  name: string;
  description: string;
  rarity: MissionRarity;
  reward: number;
  coinReward?: number;
  createdBy: UserId;
  createdAt: string;
  completed: boolean;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  rarity: MissionRarity;
  imageUrl?: string | null;
  createdBy: UserId;
  createdAt: string;
}

export interface CoupleState {
  userData: UserData;
  bubbles: Record<UserId, BubbleState>;
  avatars: Record<UserId, string>;
  locations: Record<UserId, LocationType>;
  missions: Record<UserId, Mission[]>;
  coins: Record<UserId, number>;
  achievements: Record<UserId, Achievement[]>;
  relationshipStartDate: string;
  lastUpdated: string;
}

export const api = {
  login: (userId: UserId, password: string) =>
    request<{ token: string; user: PublicUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ userId, password }),
    }),
  getUsers: () =>
    request<{ users: PublicUser[]; avatarOptions: Record<UserId, { label: string; url: string }[]> }>("/users"),
  getState: () => request<CoupleState>("/state"),
  patchState: (patch: Partial<CoupleState>) =>
    request<CoupleState>("/state", { method: "PATCH", body: JSON.stringify(patch) }),
  addXP: (amount: number) =>
    request<UserData>("/state/xp", { method: "POST", body: JSON.stringify({ amount }) }),
  createMission: (data: {
    targetUser: UserId;
    createdBy: UserId;
    name: string;
    description: string;
    rarity: MissionRarity;
    reward: number;
  }) => request<Mission>("/state/missions/create", { method: "POST", body: JSON.stringify(data) }),
  completeMission: (targetUser: UserId, missionId: string) =>
    request<{ missions: Record<UserId, Mission[]>; userData: UserData; coins: Record<UserId, number>; rewardGranted: number; coinsGranted: number }>(
      "/state/missions/complete",
      { method: "POST", body: JSON.stringify({ targetUser, missionId }) },
    ),
  deleteMission: (targetUser: UserId, missionId: string) =>
    request<{ missions: Record<UserId, Mission[]> }>("/state/missions/delete", {
      method: "POST",
      body: JSON.stringify({ targetUser, missionId }),
    }),
  createAchievement: (data: {
    targetUser: UserId;
    createdBy: UserId;
    name: string;
    description: string;
    rarity: MissionRarity;
    imageUrl?: string;
  }) => request<Achievement>("/state/achievements/create", { method: "POST", body: JSON.stringify(data) }),
  deleteAchievement: (targetUser: UserId, achievementId: string) =>
    request<{ achievements: Record<UserId, Achievement[]> }>("/state/achievements/delete", {
      method: "POST",
      body: JSON.stringify({ targetUser, achievementId }),
    }),
};

// Polling hook for couple state sync
export function useCoupleState(intervalMs = 4000) {
  const [state, setState] = useState<CoupleState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const s = await api.getState();
      if (mounted.current) {
        setState(s);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e.message ?? "Error");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchState();
    const t = setInterval(fetchState, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(t);
    };
  }, [fetchState, intervalMs]);

  return { state, setState, error, refresh: fetchState };
}

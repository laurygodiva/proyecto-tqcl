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

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  icon: string;
  desc: string;
  acquiredAt: string;
  giftedBy?: UserId;
  giftedAt?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  desc: string;
}

export interface Roulette {
  name: string;
  icon: string;
  options: string[];
}

export interface CalendarEntry {
  moods?: Partial<Record<UserId, string>>;
  notes?: { id: string; by: UserId; text: string; at: string }[];
  period?: boolean;
}

export interface Voucher {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  redeemed: boolean;
  redeemedAt?: string;
}

export interface VoucherEntry {
  tokens: number;
  crafted: Voucher[];
}

export interface AppEvent {
  id: string;
  at: string;
  user: UserId | null;
  type: string;
  title: string;
  description: string;
  icon: string;
  color?: string | null;
}

export interface CoupleState {
  userData: UserData;
  bubbles: Record<UserId, BubbleState>;
  avatars: Record<UserId, string>;
  locations: Record<UserId, LocationType>;
  missions: Record<UserId, Mission[]>;
  coins: Record<UserId, number>;
  vouchers: Record<UserId, VoucherEntry>;
  achievements: Record<UserId, Achievement[]>;
  inventory: Record<UserId, InventoryItem[]>;
  calendar: Record<string, CalendarEntry>;
  profiles?: Record<UserId, PublicUser & { password?: string }>;
  avatarOptions?: Record<UserId, { label: string; url: string }[]>;
  events?: AppEvent[];
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
  addXP: (amount: number, actor?: UserId, reason?: string, icon?: string) =>
    request<UserData>("/state/xp", { method: "POST", body: JSON.stringify({ amount, actor, reason, icon }) }),
  createMission: (data: {
    targetUser: UserId;
    createdBy: UserId;
    name: string;
    description: string;
    rarity: MissionRarity;
    reward: number;
  }) => request<Mission>("/state/missions/create", { method: "POST", body: JSON.stringify(data) }),
  completeMission: (targetUser: UserId, missionId: string, actor?: UserId) =>
    request<{ missions: Record<UserId, Mission[]>; userData: UserData; coins: Record<UserId, number>; rewardGranted: number; coinsGranted: number }>(
      "/state/missions/complete",
      { method: "POST", body: JSON.stringify({ targetUser, missionId, actor }) },
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
  getShop: () => request<{ items: ShopItem[]; roulettes: Record<string, Roulette> }>("/shop"),
  buyItem: (userId: UserId, itemId: string) =>
    request<{ coins: Record<UserId, number>; inventory: Record<UserId, InventoryItem[]>; added: InventoryItem }>(
      "/state/shop/buy",
      { method: "POST", body: JSON.stringify({ userId, itemId }) },
    ),
  giftItem: (fromUser: UserId, toUser: UserId, inventoryItemId: string) =>
    request<{ inventory: Record<UserId, InventoryItem[]> }>("/state/shop/gift", {
      method: "POST",
      body: JSON.stringify({ fromUser, toUser, inventoryItemId }),
    }),
  playMinigame: (userId: UserId, gameId: string, reward: number) =>
    request<{ coins: Record<UserId, number>; gained: number; spent: number }>(
      "/state/minigame/play",
      { method: "POST", body: JSON.stringify({ userId, gameId, reward }) },
    ),
  upsertCalendar: (userId: UserId, date: string, payload: { mood?: string; note?: string; period?: boolean }) =>
    request<{ calendar: Record<string, CalendarEntry> }>("/state/calendar", {
      method: "POST",
      body: JSON.stringify({ userId, date, ...payload }),
    }),
  deleteCalendarNote: (date: string, noteId: string) =>
    request<{ calendar: Record<string, CalendarEntry> }>("/state/calendar/delete_note", {
      method: "POST",
      body: JSON.stringify({ date, noteId }),
    }),
  craftVoucher: (userId: UserId, name: string, description: string) =>
    request<{ vouchers: Record<UserId, VoucherEntry>; created: Voucher }>("/state/vouchers/craft", {
      method: "POST",
      body: JSON.stringify({ userId, name, description }),
    }),
  redeemVoucher: (userId: UserId, voucherId: string) =>
    request<{ vouchers: Record<UserId, VoucherEntry> }>("/state/vouchers/redeem", {
      method: "POST",
      body: JSON.stringify({ userId, voucherId }),
    }),
  deleteVoucher: (userId: UserId, voucherId: string) =>
    request<{ vouchers: Record<UserId, VoucherEntry> }>("/state/vouchers/delete", {
      method: "POST",
      body: JSON.stringify({ userId, voucherId }),
    }),
  updateProfile: (data: { userId: UserId; name?: string; age?: string; birthday?: string; zodiac?: string; skills?: string; avatar?: string }) =>
    request<{ profiles: Record<UserId, PublicUser>; user: PublicUser }>("/profile/update", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  changePassword: (userId: UserId, currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>("/profile/password", {
      method: "POST",
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    }),
  addAvatarOption: (userId: UserId, label: string, url: string) =>
    request<{ avatarOptions: Record<UserId, { label: string; url: string }[]> }>("/profile/avatar/add", {
      method: "POST",
      body: JSON.stringify({ userId, label, url }),
    }),
  deleteAvatarOption: (userId: UserId, url: string) =>
    request<{ avatarOptions: Record<UserId, { label: string; url: string }[]> }>("/profile/avatar/delete", {
      method: "POST",
      body: JSON.stringify({ userId, url }),
    }),
  clearEvents: () => request<{ ok: boolean }>("/state/events/clear", { method: "POST" }),
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

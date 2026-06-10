import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserId, PublicUser } from "./api";

const KEY_USER = "tql_user_v1";

const storage = {
  async setItem(k: string, v: string) {
    if (Platform.OS === "web") return AsyncStorage.setItem(k, v);
    return SecureStore.setItemAsync(k, v);
  },
  async getItem(k: string) {
    if (Platform.OS === "web") return AsyncStorage.getItem(k);
    return SecureStore.getItemAsync(k);
  },
  async removeItem(k: string) {
    if (Platform.OS === "web") return AsyncStorage.removeItem(k);
    return SecureStore.deleteItemAsync(k);
  },
};

export interface StoredAuth {
  token: string;
  user: PublicUser;
}

export const authStore = {
  save: async (a: StoredAuth) => storage.setItem(KEY_USER, JSON.stringify(a)),
  load: async (): Promise<StoredAuth | null> => {
    const raw = await storage.getItem(KEY_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  clear: async () => storage.removeItem(KEY_USER),
};

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput, Alert, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NeonSheet from "./NeonSheet";
import { colors, userColors } from "../lib/colors";
import { api, UserId, AppEvent, PublicUser } from "../lib/api";

const ICON_COL: Record<UserId, { light: string; glow: string }> = {
  laury: userColors.laury,
  danny: userColors.danny,
};

// =============== SETTINGS MENU ===============
interface SettingsProps {
  visible: boolean;
  onClose: () => void;
  me: UserId;
  light: string;
  glow: string;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenProfile: () => void;
}

export function SettingsSheet({ visible, onClose, me, light, glow, onLogout, onOpenHistory, onOpenProfile }: SettingsProps) {
  const options = [
    { key: "profile", icon: "person-circle" as const, label: "Perfil", desc: "Edita tus datos, contraseña y avatares", onPress: onOpenProfile },
    { key: "history", icon: "time" as const, label: "Historial", desc: "Todo lo que ha pasado en la relación", onPress: onOpenHistory },
    { key: "logout", icon: "log-out" as const, label: "Cerrar sesión", desc: "Vuelve a la pantalla de inicio", onPress: onLogout, danger: true },
  ];
  return (
    <NeonSheet visible={visible} onClose={onClose} title="AJUSTES" light={light} glow={glow}>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => { onClose(); setTimeout(opt.onPress, 80); }}
          style={[styles.settingRow, { borderColor: opt.danger ? "#ff6b8a55" : `${light}55`, shadowColor: opt.danger ? "#ff6b8a" : glow }]}
          testID={`settings-${opt.key}`}
        >
          <Ionicons name={opt.icon} size={22} color={opt.danger ? "#ff6b8a" : light} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: opt.danger ? "#ff6b8a" : light }]}>{opt.label}</Text>
            <Text style={styles.settingDesc}>{opt.desc}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </Pressable>
      ))}
    </NeonSheet>
  );
}

// =============== HISTORY ===============
interface HistoryProps {
  visible: boolean;
  onClose: () => void;
  events: AppEvent[];
  profiles: Partial<Record<UserId, PublicUser>>;
  light: string;
  glow: string;
}

const TYPE_FILTERS = [
  { id: "all", label: "Todo" },
  { id: "xp", label: "XP" },
  { id: "coins", label: "Monedas" },
  { id: "mission", label: "Misiones" },
  { id: "tickets", label: "Tickets" },
  { id: "other", label: "Otros" },
];

function eventMatchesFilter(ev: AppEvent, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "xp") return ev.type === "xp" || ev.type === "level_up";
  if (filter === "coins") return ev.type === "shop_buy" || ev.type === "minigame" || ev.type === "gift";
  if (filter === "mission") return ev.type === "mission_create" || ev.type === "mission_complete";
  if (filter === "tickets") return ev.type === "voucher_craft" || ev.type === "voucher_redeem" || ev.type === "level_up";
  if (filter === "other") return ["profile_update", "password_change", "avatar_add", "achievement_create"].includes(ev.type);
  return true;
}

function formatRelative(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function HistorySheet({ visible, onClose, events, profiles, light, glow }: HistoryProps) {
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => {
    const list = (events || []).slice().reverse();
    return list.filter((e) => eventMatchesFilter(e, filter));
  }, [events, filter]);
  return (
    <NeonSheet visible={visible} onClose={onClose} title="HISTORIAL" light={light} glow={glow}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
        {TYPE_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterChip,
                { borderColor: active ? light : "rgba(255,255,255,0.12)", backgroundColor: active ? `${light}22` : colors.bg },
              ]}
              testID={`history-filter-${f.id}`}
            >
              <Text style={[styles.filterChipText, { color: active ? light : colors.textDim }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ color: colors.textDim, fontSize: 13 }}>Aún no hay eventos en esta categoría 💜</Text>
        </View>
      ) : (
        filtered.map((ev) => {
          const uc = ev.user ? ICON_COL[ev.user as UserId] : { light: colors.text, glow: colors.glowPink };
          const name = ev.user ? (profiles[ev.user as UserId]?.name || ev.user) : "Sistema";
          return (
            <View key={ev.id} style={[styles.eventRow, { borderLeftColor: uc.light, shadowColor: uc.glow }]} testID="history-event">
              <Text style={styles.eventEmoji}>{ev.icon || "✨"}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[styles.eventActor, { color: uc.light }]}>{name}</Text>
                  <Text style={styles.eventTime}>· {formatRelative(ev.at)}</Text>
                </View>
                <Text style={styles.eventTitle} numberOfLines={2}>{ev.title}</Text>
                {ev.description ? <Text style={styles.eventDesc} numberOfLines={2}>{ev.description}</Text> : null}
              </View>
            </View>
          );
        })
      )}
    </NeonSheet>
  );
}

// =============== PROFILE EDITOR ===============
interface ProfileProps {
  visible: boolean;
  onClose: () => void;
  me: UserId;
  profile: PublicUser;
  avatarOptions: { label: string; url: string }[];
  light: string;
  glow: string;
  onUpdated: (data: { profile?: PublicUser; avatarOptions?: { label: string; url: string }[]; password?: boolean }) => void;
}

const ZODIAC_OPTIONS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

export function ProfileSheet({ visible, onClose, me, profile, avatarOptions, light, glow, onUpdated }: ProfileProps) {
  const [tab, setTab] = useState<"datos" | "password" | "avatares">("datos");
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [birthday, setBirthday] = useState(profile.birthday);
  const [zodiac, setZodiac] = useState(profile.zodiac);
  const [skills, setSkills] = useState(profile.skills);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [zodiacOpen, setZodiacOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (visible) {
      setName(profile.name); setAge(profile.age); setBirthday(profile.birthday);
      setZodiac(profile.zodiac); setSkills(profile.skills); setAvatar(profile.avatar);
      setCurPass(""); setNewPass(""); setNewPass2("");
      setNewLabel(""); setNewUrl(""); setTab("datos"); setZodiacOpen(false);
    }
  }, [visible, profile]);

  const showMsg = (title: string, body?: string) => {
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      window.alert(body ? `${title}\n\n${body}` : title);
    } else {
      Alert.alert(title, body);
    }
  };

  const saveDatos = async () => {
    setSaving(true);
    try {
      const res = await api.updateProfile({ userId: me, name, age, birthday, zodiac, skills, avatar });
      onUpdated({ profile: res.user });
      showMsg("Perfil actualizado ✨");
    } catch (e: any) {
      showMsg("Error", e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!curPass || !newPass) { showMsg("Faltan campos"); return; }
    if (newPass !== newPass2) { showMsg("Las contraseñas no coinciden"); return; }
    if (newPass.length < 3) { showMsg("La nueva contraseña debe tener mínimo 3 caracteres"); return; }
    setSaving(true);
    try {
      await api.changePassword(me, curPass, newPass);
      onUpdated({ password: true });
      setCurPass(""); setNewPass(""); setNewPass2("");
      showMsg("Contraseña cambiada 🔒");
    } catch (e: any) {
      showMsg("Error", e?.message || "No se pudo cambiar");
    } finally {
      setSaving(false);
    }
  };

  const addAvatar = async () => {
    if (!newLabel.trim() || !newUrl.trim()) { showMsg("Pon nombre y URL del avatar"); return; }
    setSaving(true);
    try {
      const res = await api.addAvatarOption(me, newLabel.trim(), newUrl.trim());
      onUpdated({ avatarOptions: res.avatarOptions[me] });
      setNewLabel(""); setNewUrl("");
      showMsg("Avatar añadido 🖼️");
    } catch (e: any) {
      showMsg("Error", e?.message || "No se pudo añadir");
    } finally {
      setSaving(false);
    }
  };

  const deleteAvatar = async (url: string) => {
    setSaving(true);
    try {
      const res = await api.deleteAvatarOption(me, url);
      onUpdated({ avatarOptions: res.avatarOptions[me] });
    } catch (e: any) {
      showMsg("Error", e?.message || "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeonSheet visible={visible} onClose={onClose} title="MI PERFIL" light={light} glow={glow}>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {([
          { id: "datos", label: "DATOS", icon: "person" as const },
          { id: "password", label: "CONTRASEÑA", icon: "key" as const },
          { id: "avatares", label: "AVATARES", icon: "images" as const },
        ] as const).map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, { borderColor: active ? light : "rgba(255,255,255,0.12)", backgroundColor: active ? `${light}22` : colors.bg }]}
              testID={`profile-tab-${t.id}`}
            >
              <Ionicons name={t.icon} size={12} color={active ? light : colors.textDim} />
              <Text style={[styles.tabText, { color: active ? light : colors.textDim }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === "datos" && (
        <View>
          <View style={styles.avatarBig}>
            <Image source={{ uri: avatar }} style={styles.avatarBigImg} />
          </View>
          <Text style={styles.lbl}>FOTO DE SESIÓN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
            {avatarOptions.map((opt) => {
              const sel = avatar === opt.url;
              return (
                <Pressable key={opt.url} onPress={() => setAvatar(opt.url)} style={[styles.avatarChoice, sel && { borderColor: light, shadowColor: glow }]}>
                  <Image source={{ uri: opt.url }} style={styles.avatarChoiceImg} />
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.lbl}>NOMBRE</Text>
          <TextInput value={name} onChangeText={setName} style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="profile-name" />

          <Text style={styles.lbl}>EDAD</Text>
          <TextInput value={age} onChangeText={setAge} style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="profile-age" />

          <Text style={styles.lbl}>CUMPLEAÑOS (DD/MM/AAAA)</Text>
          <TextInput value={birthday} onChangeText={setBirthday} style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="profile-birthday" />

          <Text style={styles.lbl}>SIGNO DEL ZODIACO</Text>
          <Pressable onPress={() => setZodiacOpen((v) => !v)} style={[styles.input, { borderColor: `${light}55`, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]} testID="profile-zodiac">
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>{zodiac || "—"}</Text>
            <Ionicons name={zodiacOpen ? "chevron-up" : "chevron-down"} size={16} color={light} />
          </Pressable>
          {zodiacOpen && (
            <View style={styles.zodiacGrid}>
              {ZODIAC_OPTIONS.map((z) => (
                <Pressable key={z} onPress={() => { setZodiac(z); setZodiacOpen(false); }} style={[styles.zodiacChip, z === zodiac && { borderColor: light, backgroundColor: `${light}22` }]}>
                  <Text style={[styles.zodiacText, { color: z === zodiac ? light : colors.text }]}>{z}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.lbl}>HABILIDADES</Text>
          <TextInput value={skills} onChangeText={setSkills} multiline style={[styles.input, { borderColor: `${light}55`, minHeight: 70, textAlignVertical: "top" }]} placeholderTextColor={colors.textDim} testID="profile-skills" />

          <Pressable onPress={saveDatos} disabled={saving} style={[styles.saveBtn, { backgroundColor: `${light}22`, borderColor: light }]} testID="profile-save">
            <Text style={[styles.saveBtnText, { color: light }]}>{saving ? "GUARDANDO..." : "GUARDAR"}</Text>
          </Pressable>
        </View>
      )}

      {tab === "password" && (
        <View>
          <Text style={styles.lbl}>CONTRASEÑA ACTUAL</Text>
          <TextInput value={curPass} onChangeText={setCurPass} secureTextEntry style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="password-current" />
          <Text style={styles.lbl}>NUEVA CONTRASEÑA</Text>
          <TextInput value={newPass} onChangeText={setNewPass} secureTextEntry style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="password-new" />
          <Text style={styles.lbl}>REPETIR NUEVA</Text>
          <TextInput value={newPass2} onChangeText={setNewPass2} secureTextEntry style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="password-new2" />
          <Pressable onPress={savePassword} disabled={saving} style={[styles.saveBtn, { backgroundColor: `${light}22`, borderColor: light }]} testID="password-save">
            <Text style={[styles.saveBtnText, { color: light }]}>{saving ? "GUARDANDO..." : "CAMBIAR CONTRASEÑA"}</Text>
          </Pressable>
        </View>
      )}

      {tab === "avatares" && (
        <View>
          <Text style={styles.lbl}>AÑADIR AVATAR NUEVO</Text>
          <TextInput value={newLabel} onChangeText={setNewLabel} placeholder="Nombre (ej: 'Tatuando')" style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} testID="avatar-label" />
          <TextInput value={newUrl} onChangeText={setNewUrl} placeholder="URL de la imagen (https://...)" style={[styles.input, { borderColor: `${light}55` }]} placeholderTextColor={colors.textDim} autoCapitalize="none" autoCorrect={false} testID="avatar-url" />
          <Pressable onPress={addAvatar} disabled={saving} style={[styles.saveBtn, { backgroundColor: `${light}22`, borderColor: light, marginBottom: 12 }]} testID="avatar-add">
            <Text style={[styles.saveBtnText, { color: light }]}>{saving ? "AÑADIENDO..." : "AÑADIR AVATAR"}</Text>
          </Pressable>
          <Text style={styles.lbl}>MIS AVATARES ({avatarOptions.length})</Text>
          {avatarOptions.length === 0 ? (
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 8 }}>Aún no tienes avatares</Text>
          ) : (
            avatarOptions.map((opt) => (
              <View key={opt.url} style={[styles.avatarItem, { borderColor: `${light}33` }]}>
                <Image source={{ uri: opt.url }} style={styles.avatarItemImg} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 13, fontWeight: "600" }} numberOfLines={1}>{opt.label}</Text>
                {avatarOptions.length > 1 && (
                  <Pressable onPress={() => deleteAvatar(opt.url)} hitSlop={8} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#ff6b8a" />
                  </Pressable>
                )}
              </View>
            ))
          )}
        </View>
      )}
    </NeonSheet>
  );
}

const styles = StyleSheet.create({
  // settings
  settingRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.bg,
    marginBottom: 10, shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  settingLabel: { fontSize: 14, fontWeight: "900", letterSpacing: 0.8, marginBottom: 2 },
  settingDesc: { fontSize: 11, color: colors.textDim, fontWeight: "500" },
  // history
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1.5 },
  filterChipText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  eventRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: colors.bg, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 8, borderLeftWidth: 3, marginBottom: 8,
    shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 0 },
  },
  eventEmoji: { fontSize: 22, marginTop: 1 },
  eventActor: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  eventTime: { fontSize: 9, color: colors.textDim, fontWeight: "600" },
  eventTitle: { fontSize: 12, color: colors.text, fontWeight: "700", marginTop: 2 },
  eventDesc: { fontSize: 10, color: colors.textDim, fontWeight: "500", marginTop: 1 },
  // profile tabs
  tabsRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  tabText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.8 },
  lbl: { fontSize: 10, color: colors.text, fontWeight: "800", letterSpacing: 1.4, marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14 },
  saveBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  saveBtnText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  avatarBig: { alignSelf: "center", marginTop: 6, marginBottom: 4 },
  avatarBigImg: { width: 110, height: 110, borderRadius: 14, backgroundColor: colors.bg },
  avatarChoice: { width: 64, height: 64, borderRadius: 10, borderWidth: 2, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden", shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  avatarChoiceImg: { width: "100%", height: "100%" },
  zodiacGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  zodiacChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", backgroundColor: colors.bg },
  zodiacText: { fontSize: 11, fontWeight: "700" },
  avatarItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6 },
  avatarItemImg: { width: 44, height: 44, borderRadius: 8 },
  deleteBtn: { padding: 6 },
});

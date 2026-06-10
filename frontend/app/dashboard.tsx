import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api, useCoupleState, UserId, MissionRarity, Mission, LocationType, BubbleState } from "../src/lib/api";
import { authStore, StoredAuth } from "../src/lib/auth";
import { colors, LOGO_URL, getUserColors } from "../src/lib/colors";
import ProgressBar from "../src/components/ProgressBar";
import TimeCounter from "../src/components/TimeCounter";
import StatusBubble from "../src/components/StatusBubble";
import NeonSheet from "../src/components/NeonSheet";
import { MissionCreator, MissionList } from "../src/components/Missions";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 56) / 2;
const CARD_H = CARD_W * 1.5;

const ACTIVITIES = [
  { id: "piropos", name: "Piropos", xp: 15, icon: "💋" },
  { id: "mimitos", name: "Mimitos", xp: 20, icon: "🥰" },
  { id: "sorpresa", name: "Detallito", xp: 50, icon: "🎀" },
  { id: "regalito", name: "Regalito", xp: 60, icon: "🎁" },
  { id: "masaje", name: "Masajito", xp: 70, icon: "💆" },
  { id: "dormir", name: "Dormir Juntos", xp: 100, icon: "😴" },
  { id: "videollamada", name: "Videollamada", xp: 150, icon: "📹" },
  { id: "cita", name: "Cita Romántica", xp: 200, icon: "💕" },
  { id: "pasion", name: "Momento de Pasión", xp: 300, icon: "🔥" },
];

const EMOJI_OPTIONS = ["💜", "🩵", "❤️", "💕", "💖", "🥰", "😍", "😴", "🎮", "🍕", "🔥", "✨"];
const STATE_TEXTS = ["Te amo", "Feliz", "Te extraño", "Jugando", "Trabajando", "Durmiendo", "Comiendo", "Aburrido", "Pensando en ti"];

const LOC_POS_LAURY: Record<string, number> = { mi_casa: 0, fuera_casa: 25, cita: 50, casa_danny: 100 };
const LOC_POS_DANNY: Record<string, number> = { mi_casa: 100, fuera_casa: 75, cita: 50, casa_laury: 0 };

const LAURY_LOCS: { id: LocationType; label: string }[] = [
  { id: "mi_casa", label: "En casa" }, { id: "fuera_casa", label: "Fuera de casa" },
  { id: "cita", label: "En una cita" }, { id: "casa_danny", label: "En casa de Danny" },
];
const DANNY_LOCS: { id: LocationType; label: string }[] = [
  { id: "mi_casa", label: "En casa" }, { id: "fuera_casa", label: "Fuera de casa" },
  { id: "cita", label: "En una cita" }, { id: "casa_laury", label: "En casa de Laury" },
];

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const { state, setState } = useCoupleState(4000);
  const [actMenu, setActMenu] = useState(false);
  const [statusSheet, setStatusSheet] = useState<UserId | null>(null);
  const [avatarSheet, setAvatarSheet] = useState<UserId | null>(null);
  const [locSheet, setLocSheet] = useState<UserId | null>(null);
  const [missionCreate, setMissionCreate] = useState<UserId | null>(null);
  const [missionList, setMissionList] = useState<UserId | null>(null);
  const [glowTick, setGlowTick] = useState(0);
  const [avatarOptions, setAvatarOptions] = useState<Record<UserId, { label: string; url: string }[]>>({ laury: [], danny: [] });
  const [plusOnes, setPlusOnes] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      const a = await authStore.load();
      if (!a) { router.replace("/"); return; }
      setAuth(a);
      api.getUsers().then((d) => setAvatarOptions(d.avatarOptions));
    })();
  }, []);

  const me = auth?.user.id as UserId | undefined;
  const myColors = me ? getUserColors(me) : getUserColors("laury");

  const lauryX = state ? LOC_POS_LAURY[state.locations.laury] ?? 0 : 0;
  const dannyX = state ? LOC_POS_DANNY[state.locations.danny] ?? 100 : 100;
  const together = lauryX === dannyX;

  const optimistic = (updater: (s: any) => any) => setState((s) => (s ? updater(s) : s));

  const addXP = async (amount: number) => {
    setGlowTick((g) => g + 1);
    setActMenu(false);
    optimistic((s) => {
      const total = s.userData.totalXP + amount;
      return { ...s, userData: { level: Math.floor(total / 100) + 1, currentXP: total % 100, totalXP: total } };
    });
    try { await api.addXP(amount); } catch {}
  };

  const updateBubble = async (uid: UserId, bs: BubbleState) => {
    optimistic((s) => ({ ...s, bubbles: { ...s.bubbles, [uid]: bs } }));
    setStatusSheet(null);
    try { await api.patchState({ bubbles: { ...state!.bubbles, [uid]: bs } } as any); } catch {}
  };

  const updateAvatar = async (uid: UserId, url: string) => {
    optimistic((s) => ({ ...s, avatars: { ...s.avatars, [uid]: url } }));
    setAvatarSheet(null);
    try { await api.patchState({ avatars: { ...state!.avatars, [uid]: url } } as any); } catch {}
  };

  const updateLocation = async (uid: UserId, loc: LocationType) => {
    optimistic((s) => ({ ...s, locations: { ...s.locations, [uid]: loc } }));
    setLocSheet(null);
    try { await api.patchState({ locations: { ...state!.locations, [uid]: loc } } as any); } catch {}
  };

  const tapTogether = async () => {
    const id = Date.now();
    setPlusOnes((p) => [...p, id]);
    setTimeout(() => setPlusOnes((p) => p.filter((x) => x !== id)), 1000);
    await addXP(1);
  };

  const logout = async () => { await authStore.clear(); router.replace("/"); };

  const createMission = async (targetUser: UserId, data: any) => {
    if (!me) return;
    setMissionCreate(null);
    try {
      const m = await api.createMission({ ...data, targetUser, createdBy: me });
      optimistic((s) => ({ ...s, missions: { ...s.missions, [targetUser]: [...s.missions[targetUser], m] } }));
    } catch {}
  };

  const completeMission = async (uid: UserId, mid: string) => {
    try {
      const res = await api.completeMission(uid, mid);
      optimistic((s) => ({ ...s, missions: res.missions, userData: res.userData }));
      setGlowTick((g) => g + 1);
    } catch {}
  };

  const deleteMission = async (uid: UserId, mid: string) => {
    try {
      const res = await api.deleteMission(uid, mid);
      optimistic((s) => ({ ...s, missions: res.missions }));
    } catch {}
  };

  if (!state || !auth || !me) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.text }}>Cargando...</Text></View>;
  }

  const startDate = new Date(state.relationshipStartDate);

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} testID="dashboard-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Top: avatar + XP bar + heart + time counter */}
        <View style={styles.topBox}>
          <View style={styles.topRow}>
            <View>
              <View style={[styles.meAvatar, { borderColor: myColors.light, shadowColor: myColors.glow }]}>
                <Image source={{ uri: auth.user.avatar }} style={{ width: "100%", height: "100%" }} />
              </View>
              <Pressable onPress={logout} style={styles.logoutBtn} testID="logout-button">
                <Ionicons name="log-out-outline" size={12} color={colors.text} />
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <View style={{ flex: 1 }}>
                  <ProgressBar level={state.userData.level} currentXP={state.userData.currentXP} maxXP={100} userColor={myColors} triggerGlow={glowTick > 0} />
                </View>
                <Pressable onPress={() => setActMenu(true)} style={[styles.heartBtn, { borderColor: `${myColors.light}66`, shadowColor: myColors.glow }]} testID="add-xp-button">
                  <Ionicons name="heart" size={18} color={myColors.light} />
                </Pressable>
              </View>
              <View style={{ marginTop: 6, alignItems: "center" }}>
                <TimeCounter startDate={startDate} color={myColors.light} glow={myColors.glow} />
              </View>
            </View>
          </View>
        </View>

        {/* Logo */}
        <View style={{ alignItems: "center", marginTop: 4 }}>
          <Image source={{ uri: LOGO_URL }} style={{ width: W * 0.55, height: W * 0.32 }} resizeMode="contain" />
        </View>

        {/* Character cards */}
        <View style={styles.cardsRow}>
          {(["laury", "danny"] as UserId[]).map((uid) => {
            const uc = getUserColors(uid);
            const isMe = me === uid;
            return (
              <View key={uid} style={{ alignItems: "center" }}>
                <Text style={[styles.nameLabel, { color: uc.light, textShadowColor: uc.glow }]}>{uid === "laury" ? "Laury" : "Danny"}</Text>
                <Pressable
                  onPress={() => isMe && setAvatarSheet(uid)}
                  style={[styles.charCard, { width: CARD_W, height: CARD_H, borderColor: uc.light, shadowColor: uc.glow }]}
                  testID={`char-card-${uid}`}
                >
                  <Image source={{ uri: state.avatars[uid] }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  <View style={styles.bubbleWrap}>
                    <StatusBubble state={state.bubbles[uid]} isEditable={isMe} light={uc.light} glow={uc.glow} onPress={() => setStatusSheet(uid)} />
                  </View>
                </Pressable>
                <View style={styles.cardBtns}>
                  <Pressable onPress={() => setMissionList(uid)} style={[styles.smallBtn, { borderColor: `${uc.light}55` }]} testID={`view-missions-${uid}`}>
                    <Ionicons name="list" size={12} color={uc.light} />
                    <Text style={[styles.smallBtnText, { color: uc.light }]}>MISIONES ({state.missions[uid].length})</Text>
                  </Pressable>
                  {!isMe && (
                    <Pressable onPress={() => setMissionCreate(uid)} style={[styles.smallBtn, { borderColor: `${uc.light}55` }]} testID={`create-mission-${uid}`}>
                      <Ionicons name="add" size={12} color={uc.light} />
                      <Text style={[styles.smallBtnText, { color: uc.light }]}>CREAR</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Distance line */}
        <View style={styles.distanceBox}>
          {together ? (
            <Pressable onPress={tapTogether} style={[styles.togetherBtn, { borderColor: `${colors.together}66`, shadowColor: colors.together }]} testID="together-button">
              <Text style={styles.togetherText}>♥ Estamos Juntos ♥</Text>
              {plusOnes.map((id) => (
                <View key={id} style={styles.plusOne} pointerEvents="none"><Text style={styles.plusOneText}>+1</Text></View>
              ))}
            </Pressable>
          ) : <View style={{ height: 8 }} />}

          <View style={styles.line}>
            <LinearGradient colors={[getUserColors("laury").light, getUserColors("danny").light]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.lineBar} />
            {[0, 25, 50, 75, 100].map((p) => (
              <View key={p} style={[styles.lineDot, { left: `${p}%` }]} />
            ))}
            {!together && (
              <>
                <Pressable onPress={() => me === "laury" && setLocSheet("laury")} style={[styles.lineHeart, { left: `${lauryX}%` }]} testID="laury-heart">
                  <Ionicons name="heart" size={28} color={getUserColors("laury").light} />
                </Pressable>
                <Pressable onPress={() => me === "danny" && setLocSheet("danny")} style={[styles.lineHeart, { left: `${dannyX}%` }]} testID="danny-heart">
                  <Ionicons name="heart" size={28} color={getUserColors("danny").light} />
                </Pressable>
              </>
            )}
            {together && (
              <Pressable onPress={() => setLocSheet(me)} style={[styles.lineHeart, { left: `${lauryX}%` }]}>
                <Ionicons name="heart" size={36} color={colors.together} />
              </Pressable>
            )}
          </View>
          <Text style={styles.locHint}>Toca tu corazón para cambiar tu ubicación</Text>
        </View>
      </ScrollView>

      {/* Activity menu */}
      <NeonSheet visible={actMenu} onClose={() => setActMenu(false)} title="AÑADIR EXPERIENCIA" light={myColors.light} glow={myColors.glow}>
        {ACTIVITIES.map((a) => (
          <Pressable key={a.id} onPress={() => addXP(a.xp)} style={[styles.actRow, { borderLeftColor: myColors.light }]} testID={`activity-${a.id}`}>
            <Text style={{ fontSize: 18 }}>{a.icon}</Text>
            <Text style={[styles.actName]}>{a.name}</Text>
            <Text style={[styles.actXp, { color: myColors.light }]}>+{a.xp}</Text>
          </Pressable>
        ))}
      </NeonSheet>

      {/* Status sheet */}
      <NeonSheet visible={!!statusSheet} onClose={() => setStatusSheet(null)} title="MI ESTADO" light={myColors.light} glow={myColors.glow}>
        {statusSheet && (
          <>
            <Text style={styles.sheetLbl}>EMOJI</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <Pressable key={e} onPress={() => updateBubble(statusSheet, { ...state.bubbles[statusSheet], emoji: e })} style={[styles.emojiBtn, state.bubbles[statusSheet].emoji === e && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`emoji-${e}`}>
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sheetLbl}>TEXTO</Text>
            {STATE_TEXTS.map((t) => (
              <Pressable key={t} onPress={() => updateBubble(statusSheet, { ...state.bubbles[statusSheet], text: t })} style={[styles.textRow, state.bubbles[statusSheet].text === t && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`text-${t}`}>
                <Text style={{ color: colors.text, fontSize: 12 }}>{t}</Text>
              </Pressable>
            ))}
          </>
        )}
      </NeonSheet>

      {/* Avatar sheet */}
      <NeonSheet visible={!!avatarSheet} onClose={() => setAvatarSheet(null)} title="CAMBIAR AVATAR" light={myColors.light} glow={myColors.glow}>
        {avatarSheet && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {(avatarOptions[avatarSheet] || []).map((opt) => (
              <Pressable key={opt.url} onPress={() => updateAvatar(avatarSheet, opt.url)} style={[styles.avatarOpt, state.avatars[avatarSheet] === opt.url && { borderColor: myColors.light, borderWidth: 3 }]} testID={`avatar-${opt.label}`}>
                <Image source={{ uri: opt.url }} style={{ width: "100%", height: "100%" }} />
                <Text style={styles.avatarOptLabel}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </NeonSheet>

      {/* Location sheet */}
      <NeonSheet visible={!!locSheet} onClose={() => setLocSheet(null)} title="MI UBICACIÓN" light={myColors.light} glow={myColors.glow}>
        {locSheet && (locSheet === "laury" ? LAURY_LOCS : DANNY_LOCS).map((o) => (
          <Pressable key={o.id} onPress={() => updateLocation(locSheet, o.id)} style={[styles.textRow, state.locations[locSheet] === o.id && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`loc-${o.id}`}>
            <Text style={{ color: colors.text, fontSize: 12 }}>{o.label}</Text>
          </Pressable>
        ))}
      </NeonSheet>

      {/* Mission creator */}
      {missionCreate && (
        <MissionCreator
          visible={!!missionCreate}
          onClose={() => setMissionCreate(null)}
          onCreate={(d) => createMission(missionCreate, d)}
          targetName={missionCreate === "laury" ? "Laury" : "Danny"}
          light={getUserColors(missionCreate).light}
          glow={getUserColors(missionCreate).glow}
        />
      )}

      {/* Mission list */}
      {missionList && (
        <MissionList
          visible={!!missionList}
          onClose={() => setMissionList(null)}
          missions={state.missions[missionList]}
          light={getUserColors(missionList).light}
          glow={getUserColors(missionList).glow}
          ownerName={missionList === "laury" ? "Laury" : "Danny"}
          isOwner={me === missionList}
          onComplete={(m) => completeMission(missionList, m.id)}
          onDelete={(m) => deleteMission(missionList, m.id)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBox: { paddingHorizontal: 12, paddingTop: 8 },
  topRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  meAvatar: { width: 52, height: 52, borderRadius: 26, overflow: "hidden", borderWidth: 2, shadowOpacity: 0.6, shadowRadius: 8 },
  logoutBtn: { position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heartBtn: { width: 38, borderRadius: 8, borderWidth: 1.5, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", shadowOpacity: 0.4, shadowRadius: 8 },
  cardsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, marginTop: 4, gap: 16 },
  nameLabel: { fontSize: 16, fontWeight: "900", letterSpacing: 1, marginBottom: 8, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  charCard: { borderRadius: 18, borderWidth: 2, overflow: "hidden", shadowOpacity: 0.5, shadowRadius: 14 },
  bubbleWrap: { position: "absolute", top: 10, alignSelf: "center", left: 0, right: 0, alignItems: "center" },
  cardBtns: { marginTop: 8, gap: 6, width: CARD_W },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, backgroundColor: colors.surface, justifyContent: "center" },
  smallBtnText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1 },
  distanceBox: { marginTop: 16, paddingHorizontal: 20, alignItems: "center" },
  togetherBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.surface, shadowOpacity: 0.5, shadowRadius: 10, marginBottom: 8 },
  togetherText: { color: colors.together, fontWeight: "900", letterSpacing: 1, fontSize: 13 },
  plusOne: { position: "absolute", top: -20, alignSelf: "center" },
  plusOneText: { color: colors.together, fontWeight: "900", fontSize: 18 },
  line: { width: "85%", height: 40, justifyContent: "center", position: "relative" },
  lineBar: { height: 3, borderRadius: 2 },
  lineDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: colors.together, marginLeft: -4, top: "50%", marginTop: -4 },
  lineHeart: { position: "absolute", marginLeft: -14, top: "50%", marginTop: -14 },
  locHint: { color: colors.textDim, fontSize: 10, marginTop: 6, fontStyle: "italic" },
  actRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: 3, backgroundColor: colors.bg, marginBottom: 6, borderRadius: 6 },
  actName: { color: colors.text, fontSize: 12, fontWeight: "600", flex: 1 },
  actXp: { fontSize: 12, fontWeight: "900" },
  sheetLbl: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 6, marginBottom: 6 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  textRow: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", marginBottom: 6, backgroundColor: colors.bg },
  avatarOpt: { width: 90, height: 110, borderRadius: 12, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", backgroundColor: colors.bg },
  avatarOptLabel: { position: "absolute", bottom: 0, left: 0, right: 0, color: colors.text, fontSize: 10, fontWeight: "700", textAlign: "center", backgroundColor: "rgba(0,0,0,0.6)", paddingVertical: 2 },
});

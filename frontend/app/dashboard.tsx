import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions, TextInput } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { api, useCoupleState, UserId, MissionRarity, Mission, LocationType, BubbleState } from "../src/lib/api";
import { authStore, StoredAuth } from "../src/lib/auth";
import { colors, getUserColors, userColors } from "../src/lib/colors";
import ProgressBar from "../src/components/ProgressBar";
import TimeCounter from "../src/components/TimeCounter";
import StatusBubble from "../src/components/StatusBubble";
import NeonSheet from "../src/components/NeonSheet";
import CoinIcon from "../src/components/CoinIcon";
import { MissionCreator, MissionList } from "../src/components/Missions";
import { AchievementCreator, AchievementList } from "../src/components/Achievements";

const { width: W } = Dimensions.get("window");
const CARD_W = (W - 56) / 2;
const CARD_H = CARD_W * 1.4;

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

const EMOJI_OPTIONS = [
  "💜","🩵","❤️","💕","💖","💘","💝","💗","💓","💞",
  "🥰","😍","😘","😊","😴","🤗","🤩","😏","😉","🙃",
  "🎮","🍕","🔥","✨","🌹","🌟","⭐","🎉","🎵","☀️",
  "🌙","⚡","💎","🎀","🎁","☕",
];

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
  const [achCreate, setAchCreate] = useState<UserId | null>(null);
  const [achList, setAchList] = useState<UserId | null>(null);
  const [openMenu, setOpenMenu] = useState<UserId | null>(null);
  const [glowTick, setGlowTick] = useState(0);
  const [avatarOptions, setAvatarOptions] = useState<Record<UserId, { label: string; url: string }[]>>({ laury: [], danny: [] });
  const [plusOnes, setPlusOnes] = useState<number[]>([]);

  // Local edit states for sheets that require "Update" button
  const [tempEmoji, setTempEmoji] = useState("");
  const [tempText, setTempText] = useState("");
  const [tempAvatar, setTempAvatar] = useState("");
  const [tempLoc, setTempLoc] = useState<LocationType | null>(null);

  useEffect(() => {
    (async () => {
      const a = await authStore.load();
      if (!a) { router.replace("/"); return; }
      setAuth(a);
      api.getUsers().then((d) => setAvatarOptions(d.avatarOptions));
    })();
  }, []);

  // Sync temp states only when sheet OPENS (not on every state change)
  useEffect(() => {
    if (statusSheet && state) { setTempEmoji(state.bubbles[statusSheet].emoji); setTempText(state.bubbles[statusSheet].text); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusSheet]);
  useEffect(() => {
    if (avatarSheet && state) setTempAvatar(state.avatars[avatarSheet]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarSheet]);
  useEffect(() => {
    if (locSheet && state) setTempLoc(state.locations[locSheet]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locSheet]);

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

  const applyStatus = async () => {
    if (!statusSheet || !state) return;
    const newBubbles = { ...state.bubbles, [statusSheet]: { emoji: tempEmoji, text: tempText.trim() || "Estado..." } };
    optimistic((s) => ({ ...s, bubbles: newBubbles }));
    setStatusSheet(null);
    try { await api.patchState({ bubbles: newBubbles } as any); } catch {}
  };

  const applyAvatar = async () => {
    if (!avatarSheet || !state || !tempAvatar) return;
    const newAvatars = { ...state.avatars, [avatarSheet]: tempAvatar };
    optimistic((s) => ({ ...s, avatars: newAvatars }));
    setAvatarSheet(null);
    try { await api.patchState({ avatars: newAvatars } as any); } catch {}
  };

  const applyLocation = async () => {
    if (!locSheet || !state || !tempLoc) return;
    const newLocs = { ...state.locations, [locSheet]: tempLoc };
    optimistic((s) => ({ ...s, locations: newLocs }));
    setLocSheet(null);
    try { await api.patchState({ locations: newLocs } as any); } catch {}
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
      optimistic((s) => ({ ...s, missions: res.missions, userData: res.userData, coins: res.coins }));
      setGlowTick((g) => g + 1);
    } catch {}
  };

  const deleteMission = async (uid: UserId, mid: string) => {
    try {
      const res = await api.deleteMission(uid, mid);
      optimistic((s) => ({ ...s, missions: res.missions }));
    } catch {}
  };

  const createAchievement = async (targetUser: UserId, data: any) => {
    if (!me) return;
    setAchCreate(null);
    try {
      const a = await api.createAchievement({ ...data, targetUser, createdBy: me });
      optimistic((s) => ({ ...s, achievements: { ...s.achievements, [targetUser]: [...(s.achievements[targetUser] || []), a] } }));
    } catch {}
  };

  const deleteAchievement = async (uid: UserId, aid: string) => {
    try {
      const res = await api.deleteAchievement(uid, aid);
      optimistic((s) => ({ ...s, achievements: res.achievements }));
    } catch {}
  };

  if (!state || !auth || !me) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.text }}>Cargando...</Text></View>;
  }

  const startDate = new Date(state.relationshipStartDate);
  const coins = state.coins ?? { laury: 0, danny: 0 };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} testID="dashboard-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Top: avatar + XP bar + heart; TimeCounter below bar aligned left; coins below avatar */}
        <View style={styles.topBox}>
          <View style={styles.topRow}>
            <View style={{ alignItems: "center" }}>
              <View style={[styles.meAvatar, { borderColor: myColors.light, shadowColor: myColors.glow }]}>
                <Image source={{ uri: auth.user.avatar }} style={{ width: "100%", height: "100%" }} />
                <Pressable onPress={logout} style={styles.logoutBtn} testID="logout-button">
                  <Ionicons name="log-out-outline" size={12} color={colors.text} />
                </Pressable>
              </View>
              <View style={[styles.coinPillFlat, { marginTop: 8 }]} testID={`my-coins`}>
                <CoinIcon size={16} />
                <Text style={[styles.coinText, { color: myColors.light }]}>{coins[me] ?? 0}</Text>
              </View>
            </View>
            <View style={styles.barCol}>
              <View style={{ flexDirection: "row", gap: 6, alignItems: "stretch" }}>
                <View style={{ flex: 1 }}>
                  <ProgressBar level={state.userData.level} currentXP={state.userData.currentXP} maxXP={100} userColor={myColors} triggerGlow={glowTick > 0} />
                </View>
                <Pressable onPress={() => setActMenu(true)} style={[styles.heartBtn, { borderColor: `${myColors.light}66`, shadowColor: myColors.glow }]} testID="add-xp-button">
                  <Ionicons name="heart" size={18} color={myColors.light} />
                </Pressable>
              </View>
              <View style={{ marginTop: 10, alignSelf: "flex-start" }}>
                <TimeCounter startDate={startDate} />
              </View>
            </View>
          </View>
        </View>

        {/* Distance line — ABOVE cards */}
        <View style={styles.distanceBox}>
          {together && (
            <Pressable onPress={tapTogether} style={[styles.togetherBtn, { borderColor: `${colors.together}66`, shadowColor: colors.together }]} testID="together-button">
              <Text style={styles.togetherText}>♥ Estamos Juntos ♥</Text>
              {plusOnes.map((id) => (
                <View key={id} style={styles.plusOne} pointerEvents="none"><Text style={styles.plusOneText}>+1</Text></View>
              ))}
            </Pressable>
          )}
          <View style={styles.line}>
            <LinearGradient colors={[userColors.laury.light, userColors.danny.light]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.lineBar} />
            {[0, 25, 50, 75, 100].map((p) => (
              <View key={p} style={[styles.lineDot, { left: `${p}%` }]} />
            ))}
            {!together ? (
              <>
                <Pressable onPress={() => me === "laury" && setLocSheet("laury")} style={[styles.lineHeart, { left: `${lauryX}%` }]} testID="laury-heart">
                  <Ionicons name="heart" size={28} color={userColors.laury.light} />
                </Pressable>
                <Pressable onPress={() => me === "danny" && setLocSheet("danny")} style={[styles.lineHeart, { left: `${dannyX}%` }]} testID="danny-heart">
                  <Ionicons name="heart" size={28} color={userColors.danny.light} />
                </Pressable>
              </>
            ) : (
              <Pressable onPress={() => setLocSheet(me)} style={[styles.lineHeart, { left: `${lauryX}%` }]}>
                <Ionicons name="heart" size={36} color={colors.together} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Character cards with avatar, name, coins counter, and action buttons */}
        <View style={styles.cardsRow}>
          {(["laury", "danny"] as UserId[]).map((uid) => {
            const uc = getUserColors(uid);
            const isMe = me === uid;
            return (
              <View key={uid} style={{ alignItems: "center" }}>
                <Pressable onPress={() => setOpenMenu(openMenu === uid ? null : uid)} testID={`name-${uid}`}>
                  <Text style={[styles.nameLabel, { color: uc.light, textShadowColor: uc.glow }]}>{uid === "laury" ? `▾ Laury` : `Danny ▾`}</Text>
                </Pressable>
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
                {openMenu === uid && (
                  <View style={styles.cardBtns}>
                    <Pressable onPress={() => { setMissionList(uid); setOpenMenu(null); }} style={[styles.smallBtn, { borderColor: `${uc.light}55` }]} testID={`view-missions-${uid}`}>
                      <Ionicons name="list" size={12} color={uc.light} />
                      <Text style={[styles.smallBtnText, { color: uc.light }]}>MISIONES ({state.missions[uid].length})</Text>
                    </Pressable>
                    <Pressable onPress={() => { setAchList(uid); setOpenMenu(null); }} style={[styles.smallBtn, { borderColor: `${uc.light}55` }]} testID={`view-achievements-${uid}`}>
                      <Ionicons name="trophy" size={12} color={uc.light} />
                      <Text style={[styles.smallBtnText, { color: uc.light }]}>LOGROS ({(state.achievements?.[uid] || []).length})</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Activity menu — title centered + alternating colors Laury/Danny */}
      <NeonSheet visible={actMenu} onClose={() => setActMenu(false)} title="AÑADIR EXPERIENCIA" light={myColors.light} glow={myColors.glow}>
        {ACTIVITIES.map((a, idx) => {
          const altColors = idx % 2 === 0 ? userColors.laury : userColors.danny;
          return (
            <Pressable key={a.id} onPress={() => addXP(a.xp)} style={[styles.actRow, { borderLeftColor: altColors.light, shadowColor: altColors.glow }]} testID={`activity-${a.id}`}>
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={[styles.actName, { color: altColors.light }]}>{a.name}</Text>
              <Text style={[styles.actXp, { color: altColors.light }]}>+{a.xp}</Text>
            </Pressable>
          );
        })}
      </NeonSheet>

      {/* Status sheet — emoji grid + text input + Update */}
      <NeonSheet visible={!!statusSheet} onClose={() => setStatusSheet(null)} title="MI ESTADO" light={myColors.light} glow={myColors.glow}>
        {statusSheet && (
          <>
            <View style={styles.statusPreview}>
              <Text style={{ fontSize: 24 }}>{tempEmoji || "💜"}</Text>
              <Text style={[styles.previewText, { color: myColors.light }]} numberOfLines={1}>{tempText || "Estado..."}</Text>
            </View>
            <Text style={styles.sheetLbl}>EMOJI</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((e) => (
                <Pressable key={e} onPress={() => setTempEmoji(e)} style={[styles.emojiBtn, tempEmoji === e && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`emoji-${e}`}>
                  <Text style={{ fontSize: 20 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sheetLbl}>TEXTO</Text>
            <TextInput
              value={tempText}
              onChangeText={setTempText}
              placeholder="Escribe tu estado..."
              placeholderTextColor={colors.textDim}
              multiline
              style={[styles.input, { borderColor: `${myColors.light}55`, minHeight: 90, textAlignVertical: "top" }]}
              maxLength={80}
              testID="status-text-input"
            />
            <Pressable onPress={applyStatus} style={[styles.updateBtn, { backgroundColor: `${myColors.light}22`, borderColor: myColors.light }]} testID="status-update-button">
              <Text style={[styles.updateBtnText, { color: myColors.light }]}>ACTUALIZAR</Text>
            </Pressable>
          </>
        )}
      </NeonSheet>

      {/* Avatar sheet — names instead of preview images + Update */}
      <NeonSheet visible={!!avatarSheet} onClose={() => setAvatarSheet(null)} title="CAMBIAR AVATAR" light={myColors.light} glow={myColors.glow}>
        {avatarSheet && (
          <>
            <View style={styles.avatarPreviewWrap}>
              {tempAvatar ? <Image source={{ uri: tempAvatar }} style={styles.avatarPreview} /> : null}
            </View>
            <Text style={styles.sheetLbl}>OPCIONES</Text>
            {(avatarOptions[avatarSheet] || []).map((opt) => (
              <Pressable key={opt.url} onPress={() => setTempAvatar(opt.url)} style={[styles.optionRow, tempAvatar === opt.url && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`avatar-${opt.label}`}>
                <Ionicons name={tempAvatar === opt.url ? "radio-button-on" : "radio-button-off"} size={18} color={myColors.light} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>{opt.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={applyAvatar} style={[styles.updateBtn, { backgroundColor: `${myColors.light}22`, borderColor: myColors.light }]} testID="avatar-update-button">
              <Text style={[styles.updateBtnText, { color: myColors.light }]}>ACTUALIZAR</Text>
            </Pressable>
          </>
        )}
      </NeonSheet>

      {/* Location sheet with Update */}
      <NeonSheet visible={!!locSheet} onClose={() => setLocSheet(null)} title="MI UBICACIÓN" light={myColors.light} glow={myColors.glow}>
        {locSheet && (
          <>
            {(locSheet === "laury" ? LAURY_LOCS : DANNY_LOCS).map((o) => (
              <Pressable key={o.id} onPress={() => setTempLoc(o.id)} style={[styles.optionRow, tempLoc === o.id && { borderColor: myColors.light, backgroundColor: `${myColors.light}22` }]} testID={`loc-${o.id}`}>
                <Ionicons name={tempLoc === o.id ? "radio-button-on" : "radio-button-off"} size={18} color={myColors.light} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>{o.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={applyLocation} style={[styles.updateBtn, { backgroundColor: `${myColors.light}22`, borderColor: myColors.light }]} testID="loc-update-button">
              <Text style={[styles.updateBtnText, { color: myColors.light }]}>ACTUALIZAR</Text>
            </Pressable>
          </>
        )}
      </NeonSheet>

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
          onCreatePress={me !== missionList ? () => { const t = missionList; setMissionList(null); setMissionCreate(t); } : undefined}
        />
      )}

      {achCreate && (
        <AchievementCreator
          visible={!!achCreate}
          onClose={() => setAchCreate(null)}
          onCreate={(d) => createAchievement(achCreate, d)}
          targetName={achCreate === "laury" ? "Laury" : "Danny"}
          light={getUserColors(achCreate).light}
          glow={getUserColors(achCreate).glow}
        />
      )}

      {achList && (
        <AchievementList
          visible={!!achList}
          onClose={() => setAchList(null)}
          items={state.achievements?.[achList] || []}
          light={getUserColors(achList).light}
          glow={getUserColors(achList).glow}
          ownerName={achList === "laury" ? "Laury" : "Danny"}
          onDelete={(a) => deleteAchievement(achList, a.id)}
          onCreatePress={me !== achList ? () => { const t = achList; setAchList(null); setAchCreate(t); } : undefined}
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
  barCol: { flex: 1 },
  heartBtn: { width: 38, borderRadius: 8, borderWidth: 1.5, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", shadowOpacity: 0.4, shadowRadius: 8 },
  cardsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, marginTop: 16, gap: 16 },
  nameLabel: { fontSize: 16, fontWeight: "900", letterSpacing: 1, marginBottom: 8, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  coinPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.surface, marginTop: 6 },
  coinPillFlat: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4, paddingVertical: 2 },
  coinText: { fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  charCard: { borderRadius: 18, borderWidth: 2, overflow: "hidden", shadowOpacity: 0.5, shadowRadius: 14, backgroundColor: colors.bg },
  bubbleWrap: { position: "absolute", top: 10, alignSelf: "center", left: 0, right: 0, alignItems: "center" },
  cardBtns: { marginTop: 8, gap: 6, width: CARD_W },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, backgroundColor: colors.surface, justifyContent: "center" },
  smallBtnText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 1 },
  distanceBox: { marginTop: 18, paddingHorizontal: 20, alignItems: "center" },
  togetherBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.surface, shadowOpacity: 0.5, shadowRadius: 10, marginBottom: 8 },
  togetherText: { color: colors.together, fontWeight: "900", letterSpacing: 1, fontSize: 13 },
  plusOne: { position: "absolute", top: -20, alignSelf: "center" },
  plusOneText: { color: colors.together, fontWeight: "900", fontSize: 18 },
  line: { width: "85%", height: 40, justifyContent: "center", position: "relative" },
  lineBar: { height: 3, borderRadius: 2 },
  lineDot: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: colors.together, marginLeft: -4, top: "50%", marginTop: -4 },
  lineHeart: { position: "absolute", marginLeft: -14, top: "50%", marginTop: -14 },
  actRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, paddingVertical: 10, borderLeftWidth: 3, backgroundColor: colors.bg, marginBottom: 6, borderRadius: 6, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  actName: { fontSize: 12, fontWeight: "700", flex: 1 },
  actXp: { fontSize: 12, fontWeight: "900" },
  sheetLbl: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 8, marginBottom: 6 },
  statusPreview: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", backgroundColor: colors.bg, marginBottom: 6 },
  previewText: { fontSize: 14, fontWeight: "700", flex: 1 },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  emojiBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 14 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", marginBottom: 6, backgroundColor: colors.bg },
  updateBtn: { marginTop: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  updateBtnText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  avatarPreviewWrap: { alignItems: "center", marginBottom: 6 },
  avatarPreview: { width: 110, height: 110, borderRadius: 14, backgroundColor: colors.bg },
});

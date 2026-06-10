import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Image } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from "react-native-reanimated";
import NeonSheet from "./NeonSheet";
import CoinIcon from "./CoinIcon";
import { Ionicons } from "@expo/vector-icons";
import { colors, getUserColors } from "../lib/colors";
import { api, UserId, ShopItem, Roulette, InventoryItem, CalendarEntry } from "../lib/api";

// =================== Shop ===================
export function ShopSheet({ visible, onClose, me, coins, onBought, light, glow }: {
  visible: boolean; onClose: () => void; me: UserId; coins: number;
  onBought: (coins: Record<UserId, number>, inv: Record<UserId, InventoryItem[]>) => void;
  light: string; glow: string;
}) {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (visible) api.getShop().then((d) => setItems(d.items)); }, [visible]);
  const buy = async (it: ShopItem) => {
    if (coins < it.price) { setMsg("Monedas insuficientes"); setTimeout(() => setMsg(null), 1500); return; }
    setBusy(it.id);
    try {
      const r = await api.buyItem(me, it.id);
      onBought(r.coins, r.inventory);
      setMsg(`¡Comprado ${it.name}!`);
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) { setMsg(e.message || "Error"); setTimeout(() => setMsg(null), 1800); }
    finally { setBusy(null); }
  };
  return (
    <NeonSheet visible={visible} onClose={onClose} title="TIENDA" light={light} glow={glow}>
      <View style={[ss.coinHeader, { borderColor: `${light}55` }]}>
        <CoinIcon size={20} />
        <Text style={[ss.coinAmt, { color: light }]}>{coins} monedas</Text>
      </View>
      {msg && <Text style={[ss.msg, { color: light }]}>{msg}</Text>}
      <View style={ss.grid}>
        {items.map((it) => (
          <View key={it.id} style={[ss.shopCard, { borderColor: `${light}44` }]} testID={`shop-${it.id}`}>
            <Text style={ss.itemIcon}>{it.icon}</Text>
            <Text style={ss.itemName} numberOfLines={2}>{it.name}</Text>
            <Text style={ss.itemDesc} numberOfLines={2}>{it.desc}</Text>
            <Pressable
              onPress={() => buy(it)}
              disabled={busy === it.id || coins < it.price}
              style={[ss.buyBtn, { borderColor: light, backgroundColor: coins >= it.price ? `${light}22` : "transparent", opacity: busy === it.id ? 0.5 : 1 }]}
              testID={`buy-${it.id}`}
            >
              <CoinIcon size={12} />
              <Text style={[ss.buyText, { color: light }]}>{it.price}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </NeonSheet>
  );
}

// =================== Inventory ===================
export function InventorySheet({ visible, onClose, me, inventory, light, glow, onGifted }: {
  visible: boolean; onClose: () => void; me: UserId; inventory: InventoryItem[];
  light: string; glow: string;
  onGifted: (inv: Record<UserId, InventoryItem[]>) => void;
}) {
  const partner: UserId = me === "laury" ? "danny" : "laury";
  const gift = async (item: InventoryItem) => {
    try {
      const r = await api.giftItem(me, partner, item.id);
      onGifted(r.inventory);
    } catch {}
  };
  return (
    <NeonSheet visible={visible} onClose={onClose} title="MIS ITEMS" light={light} glow={glow}>
      {inventory.length === 0 && <Text style={ss.empty}>Aún no tienes items. Visita la tienda 🛍️</Text>}
      {inventory.map((it) => (
        <View key={it.id} style={[ss.invRow, { borderColor: `${light}44` }]} testID={`inv-${it.id}`}>
          <Text style={ss.itemIconSm}>{it.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={ss.itemName}>{it.name}</Text>
            <Text style={ss.itemDesc}>{it.desc}</Text>
            {it.giftedBy && (
              <Text style={[ss.giftBadge, { color: getUserColors(it.giftedBy).light }]}>🎁 Regalo de {it.giftedBy === "laury" ? "Laury" : "Danny"}</Text>
            )}
          </View>
          <Pressable onPress={() => gift(it)} style={[ss.giftBtn, { borderColor: light }]} testID={`gift-${it.id}`}>
            <Ionicons name="gift" size={14} color={light} />
            <Text style={[ss.giftText, { color: light }]}>REGALAR</Text>
          </Pressable>
        </View>
      ))}
    </NeonSheet>
  );
}

// =================== Minigames ===================
const GAMES = [
  { id: "gancho", name: "Máquina de Gancho", icon: "🪝", desc: "Atrapa un peluche" },
  { id: "billar", name: "Billar", icon: "🎱", desc: "Mete las bolas en los huecos" },
  { id: "dardos", name: "Dardos", icon: "🎯", desc: "Apunta al centro" },
  { id: "colormatch", name: "Color Match", icon: "🌈", desc: "Combina los colores" },
];
export function MinigamesSheet({ visible, onClose, me, coins, light, glow, onResult }: {
  visible: boolean; onClose: () => void; me: UserId; coins: number;
  light: string; glow: string; onResult: (coins: Record<UserId, number>, gained: number) => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const play = async (gid: string) => {
    if (coins < 1) { setMsg("Necesitas 1 moneda para jugar"); setTimeout(() => setMsg(null), 1500); return; }
    setBusy(gid);
    // Simulated outcome: 50% chance win 2-5 coins, 50% chance 0
    const win = Math.random() > 0.45;
    const reward = win ? Math.floor(Math.random() * 4) + 2 : 0;
    try {
      const r = await api.playMinigame(me, gid, reward);
      onResult(r.coins, reward);
      setMsg(win ? `🎉 ¡Ganaste ${reward} monedas!` : "😢 Sin suerte esta vez. Inténtalo de nuevo");
      setTimeout(() => setMsg(null), 2200);
    } catch (e: any) { setMsg(e.message || "Error"); setTimeout(() => setMsg(null), 1800); }
    finally { setBusy(null); }
  };
  return (
    <NeonSheet visible={visible} onClose={onClose} title="MINIJUEGOS" light={light} glow={glow}>
      <View style={[ss.coinHeader, { borderColor: `${light}55` }]}>
        <CoinIcon size={20} />
        <Text style={[ss.coinAmt, { color: light }]}>{coins} monedas</Text>
      </View>
      {msg && <Text style={[ss.msg, { color: light }]}>{msg}</Text>}
      {GAMES.map((g) => (
        <Pressable key={g.id} onPress={() => play(g.id)} disabled={busy === g.id} style={[ss.gameRow, { borderColor: `${light}55`, opacity: busy === g.id ? 0.5 : 1 }]} testID={`game-${g.id}`}>
          <Text style={ss.gameIcon}>{g.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={ss.gameName}>{g.name}</Text>
            <Text style={ss.gameDesc}>{g.desc}</Text>
          </View>
          <View style={[ss.playPill, { borderColor: light }]}>
            <CoinIcon size={12} />
            <Text style={[ss.playText, { color: light }]}>-1 JUGAR</Text>
          </View>
        </Pressable>
      ))}
      <Text style={ss.tip}>Próximamente: minijuegos completos con animaciones y items como premio 🎁</Text>
    </NeonSheet>
  );
}

// =================== Roulette ===================
export function RouletteSheet({ visible, onClose, light, glow }: { visible: boolean; onClose: () => void; light: string; glow: string }) {
  const [roulettes, setRoulettes] = useState<Record<string, Roulette>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const rot = useSharedValue(0);
  useEffect(() => { if (visible) api.getShop().then((d) => setRoulettes(d.roulettes)); }, [visible]);
  useEffect(() => { if (!visible) { setSelected(null); setResult(null); } }, [visible]);
  const spin = () => {
    if (!selected || spinning) return;
    setSpinning(true); setResult(null);
    const r = roulettes[selected];
    if (!r) return;
    rot.value = withTiming(rot.value + 1080 + Math.random() * 360, { duration: 2000, easing: Easing.out(Easing.cubic) });
    setTimeout(() => {
      const pick = r.options[Math.floor(Math.random() * r.options.length)];
      setResult(pick);
      setSpinning(false);
    }, 2100);
  };
  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  return (
    <NeonSheet visible={visible} onClose={onClose} title="RULETA" light={light} glow={glow}>
      {!selected ? (
        Object.entries(roulettes).map(([k, r]) => (
          <Pressable key={k} onPress={() => setSelected(k)} style={[ss.rouRow, { borderColor: `${light}55` }]} testID={`roulette-${k}`}>
            <Text style={{ fontSize: 28 }}>{r.icon}</Text>
            <Text style={[ss.rouName, { color: light }]}>{r.name}</Text>
            <Ionicons name="chevron-forward" size={20} color={light} />
          </Pressable>
        ))
      ) : (
        <View style={{ alignItems: "center" }}>
          <Text style={[ss.rouName, { color: light, marginBottom: 8 }]}>{roulettes[selected]?.name}</Text>
          <Animated.View style={[ss.wheel, { borderColor: light, shadowColor: glow }, wheelStyle]}>
            <Text style={{ fontSize: 48 }}>{roulettes[selected]?.icon}</Text>
          </Animated.View>
          {result && (
            <View style={[ss.resultBox, { borderColor: light, backgroundColor: `${light}22` }]} testID="roulette-result">
              <Text style={[ss.resultLabel, { color: colors.textDim }]}>RESULTADO</Text>
              <Text style={[ss.resultText, { color: light }]}>{result}</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, alignSelf: "stretch" }}>
            <Pressable onPress={() => { setSelected(null); setResult(null); }} style={[ss.btn, { borderColor: `${light}66`, flex: 1 }]}>
              <Text style={[ss.btnText, { color: colors.textDim }]}>VOLVER</Text>
            </Pressable>
            <Pressable onPress={spin} disabled={spinning} style={[ss.btn, { borderColor: light, backgroundColor: `${light}22`, flex: 2, opacity: spinning ? 0.6 : 1 }]} testID="roulette-spin">
              <Text style={[ss.btnText, { color: light }]}>{spinning ? "GIRANDO..." : "¡GIRAR!"}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </NeonSheet>
  );
}

// =================== Calendar ===================
const MOOD_OPTIONS = ["😍", "😊", "😴", "😐", "😢", "😠", "🤒", "🥰", "🔥", "💔"];
function pad(n: number) { return n.toString().padStart(2, "0"); }
function toKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

export function CalendarSheet({ visible, onClose, me, calendar, light, glow, onUpdate }: {
  visible: boolean; onClose: () => void; me: UserId;
  calendar: Record<string, CalendarEntry>;
  light: string; glow: string;
  onUpdate: (cal: Record<string, CalendarEntry>) => void;
}) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const monthName = new Date(view.y, view.m, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const first = new Date(view.y, view.m, 1).getDay(); // 0=Sunday
  const startOffset = (first + 6) % 7; // make Monday=0
  const total = daysInMonth(view.y, view.m);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const setMood = async (date: string, emoji: string) => {
    try { const r = await api.upsertCalendar(me, date, { mood: emoji }); onUpdate(r.calendar); } catch {}
  };
  const togglePeriod = async (date: string, current: boolean) => {
    try { const r = await api.upsertCalendar(me, date, { period: !current }); onUpdate(r.calendar); } catch {}
  };
  const addNote = async () => {
    if (!selectedDate || !note.trim()) return;
    try { const r = await api.upsertCalendar(me, selectedDate, { note: note.trim() }); onUpdate(r.calendar); setNote(""); } catch {}
  };
  const delNote = async (date: string, noteId: string) => {
    try { const r = await api.deleteCalendarNote(date, noteId); onUpdate(r.calendar); } catch {}
  };

  const selectedEntry = selectedDate ? calendar[selectedDate] : null;

  return (
    <NeonSheet visible={visible} onClose={onClose} title="CALENDARIO" light={light} glow={glow}>
      <View style={ss.calHeader}>
        <Pressable onPress={() => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })} hitSlop={8}><Ionicons name="chevron-back" size={20} color={light} /></Pressable>
        <Text style={[ss.calMonth, { color: light }]}>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</Text>
        <Pressable onPress={() => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })} hitSlop={8}><Ionicons name="chevron-forward" size={20} color={light} /></Pressable>
      </View>
      <View style={ss.weekRow}>
        {["L", "M", "X", "J", "V", "S", "D"].map((w) => <Text key={w} style={ss.weekLabel}>{w}</Text>)}
      </View>
      <View style={ss.calGrid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={ss.calCell} />;
          const key = `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
          const e = calendar[key];
          const isToday = key === toKey(today);
          const isSel = key === selectedDate;
          const myMood = e?.moods?.[me];
          const partner: UserId = me === "laury" ? "danny" : "laury";
          const otherMood = e?.moods?.[partner];
          return (
            <Pressable key={i} onPress={() => setSelectedDate(key)} style={[ss.calCell, isSel && { borderColor: light, borderWidth: 1.5 }, isToday && { backgroundColor: `${light}22` }]} testID={`day-${key}`}>
              <Text style={[ss.dayNum, { color: isToday ? light : colors.text }]}>{d}</Text>
              <View style={ss.moodRow}>
                {myMood && <Text style={ss.moodEmoji}>{myMood}</Text>}
                {otherMood && <Text style={ss.moodEmoji}>{otherMood}</Text>}
              </View>
              {e?.period && <View style={ss.periodDot} />}
            </Pressable>
          );
        })}
      </View>
      {selectedDate && (
        <View style={[ss.daySection, { borderColor: `${light}44` }]}>
          <Text style={[ss.sectionTitle, { color: light }]}>{new Date(selectedDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</Text>
          <Text style={ss.sheetLbl}>MI ESTADO DE ÁNIMO</Text>
          <View style={ss.moodGrid}>
            {MOOD_OPTIONS.map((em) => (
              <Pressable key={em} onPress={() => setMood(selectedDate, em)} style={[ss.moodBtn, selectedEntry?.moods?.[me] === em && { borderColor: light, backgroundColor: `${light}22` }]} testID={`mood-${em}`}>
                <Text style={{ fontSize: 22 }}>{em}</Text>
              </Pressable>
            ))}
          </View>
          {me === "laury" && (
            <Pressable onPress={() => togglePeriod(selectedDate, !!selectedEntry?.period)} style={[ss.periodBtn, { borderColor: selectedEntry?.period ? "#ff6b9d" : `${light}55`, backgroundColor: selectedEntry?.period ? "#ff6b9d22" : "transparent" }]} testID="period-toggle">
              <Text style={{ color: selectedEntry?.period ? "#ff6b9d" : colors.textDim, fontWeight: "800", fontSize: 12 }}>{selectedEntry?.period ? "🩸 DÍA DE REGLA ✓" : "🩸 Marcar día de regla"}</Text>
            </Pressable>
          )}
          <Text style={ss.sheetLbl}>NOTAS / EVENTOS</Text>
          {(selectedEntry?.notes || []).map((n) => {
            const c = getUserColors(n.by).light;
            return (
              <View key={n.id} style={[ss.noteRow, { borderLeftColor: c }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[ss.noteBy, { color: c }]}>{n.by === "laury" ? "Laury" : "Danny"}</Text>
                  <Text style={ss.noteText}>{n.text}</Text>
                </View>
                <Pressable onPress={() => delNote(selectedDate, n.id)} hitSlop={8}><Ionicons name="close-circle" size={18} color={colors.textDim} /></Pressable>
              </View>
            );
          })}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            <TextInput value={note} onChangeText={setNote} placeholder="Cita médica, evento..." placeholderTextColor={colors.textDim} style={[ss.noteInput, { borderColor: `${light}55` }]} testID="cal-note-input" />
            <Pressable onPress={addNote} disabled={!note.trim()} style={[ss.addNoteBtn, { borderColor: light, backgroundColor: `${light}22`, opacity: note.trim() ? 1 : 0.5 }]} testID="cal-note-add">
              <Ionicons name="add" size={20} color={light} />
            </Pressable>
          </View>
        </View>
      )}
    </NeonSheet>
  );
}

const ss = StyleSheet.create({
  coinHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 8 },
  coinAmt: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  msg: { textAlign: "center", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  shopCard: { width: "47%", padding: 10, borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.bg, alignItems: "center" },
  itemIcon: { fontSize: 32, marginBottom: 4 },
  itemIconSm: { fontSize: 26 },
  itemName: { color: colors.text, fontSize: 12, fontWeight: "800", textAlign: "center" },
  itemDesc: { color: colors.textDim, fontSize: 10, textAlign: "center", marginTop: 2, minHeight: 26 },
  buyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, marginTop: 6 },
  buyText: { fontSize: 11, fontWeight: "900" },
  empty: { color: colors.textDim, fontSize: 12, textAlign: "center", padding: 20 },
  invRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6 },
  giftBadge: { fontSize: 10, fontWeight: "700", marginTop: 2 },
  giftBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  giftText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6 },
  gameIcon: { fontSize: 32 },
  gameName: { color: colors.text, fontSize: 13, fontWeight: "800" },
  gameDesc: { color: colors.textDim, fontSize: 11 },
  playPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  playText: { fontSize: 10, fontWeight: "900" },
  tip: { color: colors.textDim, fontSize: 10, fontStyle: "italic", textAlign: "center", marginTop: 10 },
  rouRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6 },
  rouName: { color: colors.text, fontSize: 13, fontWeight: "800", flex: 1 },
  wheel: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", marginVertical: 16, shadowOpacity: 0.6, shadowRadius: 14 },
  resultBox: { padding: 14, borderRadius: 12, borderWidth: 2, alignItems: "center", marginTop: 6, alignSelf: "stretch" },
  resultLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  resultText: { fontSize: 18, fontWeight: "900", marginTop: 4, textAlign: "center" },
  btn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  calHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 8 },
  calMonth: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekLabel: { flex: 1, textAlign: "center", color: colors.textDim, fontSize: 10, fontWeight: "800" },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "flex-start", borderRadius: 6 },
  dayNum: { fontSize: 11, fontWeight: "700" },
  moodRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  moodEmoji: { fontSize: 10 },
  periodDot: { position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: "#ff6b9d" },
  daySection: { marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg },
  sectionTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 1, textTransform: "capitalize", marginBottom: 8 },
  sheetLbl: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 6, marginBottom: 6 },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  moodBtn: { width: 40, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  periodBtn: { padding: 10, borderRadius: 8, borderWidth: 1.5, alignItems: "center", marginTop: 8 },
  noteRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderLeftWidth: 3, backgroundColor: colors.surface, borderRadius: 6, marginBottom: 4 },
  noteBy: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  noteText: { color: colors.text, fontSize: 12 },
  noteInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, fontSize: 12 },
  addNoteBtn: { width: 40, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});

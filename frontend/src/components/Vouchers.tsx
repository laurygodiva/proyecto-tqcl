import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from "react-native";
import NeonSheet from "./NeonSheet";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/colors";
import { api, UserId, VoucherEntry } from "../lib/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  me: UserId;
  entry: VoucherEntry;
  light: string;
  glow: string;
  onUpdate: (vouchers: Record<UserId, VoucherEntry>) => void;
}

export function VouchersSheet({ visible, onClose, me, entry, light, glow, onUpdate }: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const craft = async () => {
    if (!name.trim() || !desc.trim()) return;
    try {
      const r = await api.craftVoucher(me, name.trim(), desc.trim());
      onUpdate(r.vouchers);
      setName(""); setDesc("");
      setMsg("✨ Deseo creado");
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg(e.message || "Error");
      setTimeout(() => setMsg(null), 1800);
    }
  };

  const redeem = async (vid: string) => {
    try { const r = await api.redeemVoucher(me, vid); onUpdate(r.vouchers); } catch {}
  };
  const del = async (vid: string) => {
    try { const r = await api.deleteVoucher(me, vid); onUpdate(r.vouchers); } catch {}
  };

  const active = entry.crafted.filter((v) => !v.redeemed);
  const redeemed = entry.crafted.filter((v) => v.redeemed);

  return (
    <NeonSheet visible={visible} onClose={onClose} title="MIS DESEOS" light={light} glow={glow}>
      <View style={[s.header, { borderColor: `${light}55` }]}>
        <Ionicons name="star" size={22} color={light} />
        <Text style={[s.headerText, { color: light }]}>Deseos disponibles: {entry.tokens}</Text>
      </View>
      <Text style={s.tip}>Subiendo de nivel obtenéis 1 deseo cada uno ✨</Text>
      {msg && <Text style={[s.msg, { color: light }]}>{msg}</Text>}

      <Text style={s.sectionLbl}>FABRICAR NUEVO DESEO</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre del deseo (ej. Cita sorpresa)"
        placeholderTextColor={colors.textDim}
        style={[s.input, { borderColor: `${light}55` }]}
        testID="voucher-name-input"
      />
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="¿Qué se canjea por este deseo?"
        placeholderTextColor={colors.textDim}
        multiline
        style={[s.input, { borderColor: `${light}55`, minHeight: 70, textAlignVertical: "top", marginTop: 6 }]}
        testID="voucher-desc-input"
      />
      <Pressable
        onPress={craft}
        disabled={entry.tokens < 1 || !name.trim() || !desc.trim()}
        style={[s.craftBtn, { borderColor: light, backgroundColor: `${light}22`, opacity: entry.tokens < 1 || !name.trim() || !desc.trim() ? 0.5 : 1 }]}
        testID="voucher-craft-button"
      >
        <Ionicons name="construct" size={14} color={light} />
        <Text style={[s.craftText, { color: light }]}>FABRICAR (-1 deseo)</Text>
      </Pressable>

      {active.length > 0 && <Text style={s.sectionLbl}>DESEOS ACTIVOS ({active.length})</Text>}
      {active.map((v) => (
        <View key={v.id} style={[s.vCard, { borderColor: light, shadowColor: glow }]} testID={`voucher-${v.id}`}>
          <View style={{ flex: 1 }}>
            <Text style={[s.vName, { color: light }]}>✨ {v.name}</Text>
            <Text style={s.vDesc}>{v.description}</Text>
          </View>
          <View style={{ gap: 6 }}>
            <Pressable onPress={() => redeem(v.id)} style={[s.iconBtn, { borderColor: light, backgroundColor: `${light}22` }]} testID={`voucher-redeem-${v.id}`}>
              <Ionicons name="gift" size={14} color={light} />
            </Pressable>
            <Pressable onPress={() => del(v.id)} style={[s.iconBtn, { borderColor: "#ff6b6b66" }]} testID={`voucher-delete-${v.id}`}>
              <Ionicons name="trash" size={12} color="#ff6b6b" />
            </Pressable>
          </View>
        </View>
      ))}

      {redeemed.length > 0 && <Text style={[s.sectionLbl, { color: colors.textDim }]}>CANJEADOS ({redeemed.length})</Text>}
      {redeemed.map((v) => (
        <View key={v.id} style={[s.vCard, { borderColor: `${light}33`, opacity: 0.6 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.vName, { color: colors.textDim, textDecorationLine: "line-through" }]}>{v.name}</Text>
            <Text style={s.vDesc}>{v.description}</Text>
            {v.redeemedAt && <Text style={s.vDate}>Canjeado: {new Date(v.redeemedAt).toLocaleDateString("es-ES")}</Text>}
          </View>
          <Pressable onPress={() => del(v.id)} style={[s.iconBtn, { borderColor: "#ff6b6b66" }]}><Ionicons name="trash" size={12} color="#ff6b6b" /></Pressable>
        </View>
      ))}
    </NeonSheet>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6 },
  headerText: { fontSize: 14, fontWeight: "900", letterSpacing: 1 },
  tip: { color: colors.textDim, fontSize: 10, textAlign: "center", fontStyle: "italic", marginBottom: 6 },
  msg: { textAlign: "center", fontSize: 12, fontWeight: "700", marginVertical: 6 },
  sectionLbl: { color: colors.text, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, fontSize: 13 },
  craftBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, marginTop: 8 },
  craftText: { fontSize: 12, fontWeight: "900", letterSpacing: 1.5 },
  vCard: { flexDirection: "row", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 6, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  vName: { fontSize: 13, fontWeight: "900" },
  vDesc: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  vDate: { color: colors.textDim, fontSize: 9, marginTop: 4, fontStyle: "italic" },
  iconBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
});

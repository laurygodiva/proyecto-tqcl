import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from "react-native";
import NeonSheet from "./NeonSheet";
import { colors, rarityColors } from "../lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { MissionRarity, Mission } from "../lib/api";

interface CreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (m: { name: string; description: string; rarity: MissionRarity; reward: number }) => void;
  targetName: string;
  light: string;
  glow: string;
}

export function MissionCreator({ visible, onClose, onCreate, targetName, light, glow }: CreatorProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [rarity, setRarity] = useState<MissionRarity>("comun");

  const reward = rarityColors[rarity].reward;

  const handle = () => {
    if (!name.trim() || !desc.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim(), rarity, reward });
    setName(""); setDesc(""); setRarity("comun");
  };

  return (
    <NeonSheet visible={visible} onClose={onClose} title={`CREAR MISIÓN PARA ${targetName.toUpperCase()}`} light={light} glow={glow}>
      <Text style={s.lbl}>NOMBRE</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nombre..."
        placeholderTextColor={colors.textDim}
        style={[s.input, { borderColor: `${light}55` }]}
        testID="mission-name-input"
      />
      <Text style={s.lbl}>DESCRIPCIÓN</Text>
      <TextInput
        value={desc}
        onChangeText={setDesc}
        placeholder="Descripción..."
        placeholderTextColor={colors.textDim}
        multiline
        numberOfLines={3}
        style={[s.input, { borderColor: `${light}55`, minHeight: 64, textAlignVertical: "top" }]}
        testID="mission-desc-input"
      />
      <Text style={s.lbl}>RAREZA</Text>
      <View style={s.rarityRow}>
        {(Object.keys(rarityColors) as MissionRarity[]).map((r) => {
          const rc = rarityColors[r];
          const active = rarity === r;
          return (
            <Pressable
              key={r}
              onPress={() => setRarity(r)}
              style={[
                s.rarityChip,
                {
                  borderColor: active ? rc.border : `${rc.border}55`,
                  backgroundColor: active ? `${rc.border}30` : colors.bg,
                },
              ]}
              testID={`rarity-${r}`}
            >
              <Text style={[s.rarityText, { color: active ? rc.border : colors.textDim }]}>{rc.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={[s.reward, { borderColor: `${rarityColors[rarity].border}66` }]}>
        <Text style={[s.lbl, { marginBottom: 0 }]}>RECOMPENSA</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="star" size={14} color={rarityColors[rarity].border} />
          <Text style={[s.rewardText, { color: rarityColors[rarity].border }]}>+{reward} XP</Text>
        </View>
      </View>
      <Pressable
        onPress={handle}
        style={[s.btn, { backgroundColor: `${light}22`, borderColor: light }]}
        testID="mission-create-button"
      >
        <Text style={[s.btnText, { color: light }]}>CREAR MISIÓN</Text>
      </Pressable>
    </NeonSheet>
  );
}

interface ListProps {
  visible: boolean;
  onClose: () => void;
  missions: Mission[];
  light: string;
  glow: string;
  ownerName: string;
  isOwner: boolean;
  onComplete: (m: Mission) => void;
  onDelete: (m: Mission) => void;
}

export function MissionList({ visible, onClose, missions, light, glow, ownerName, isOwner, onComplete, onDelete }: ListProps) {
  return (
    <NeonSheet visible={visible} onClose={onClose} title={`MISIONES DE ${ownerName.toUpperCase()}`} light={light} glow={glow}>
      {missions.length === 0 && <Text style={s.empty}>Sin misiones aún</Text>}
      {missions.map((m) => {
        const rc = rarityColors[m.rarity];
        return (
          <View
            key={m.id}
            style={[s.missionCard, { borderColor: m.completed ? `${rc.border}40` : rc.border, opacity: m.completed ? 0.5 : 1 }]}
            testID={`mission-${m.id}`}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[s.rarityBadge, { color: rc.border, backgroundColor: `${rc.border}25`, borderColor: `${rc.border}66` }]}>{rc.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="star" size={11} color={rc.border} />
                  <Text style={{ color: rc.border, fontSize: 11, fontWeight: "800" }}>+{m.reward}</Text>
                </View>
              </View>
              <Text style={s.missionName}>{m.name}</Text>
              <Text style={s.missionDesc}>{m.description}</Text>
            </View>
            <View style={{ gap: 6 }}>
              {isOwner && !m.completed && (
                <Pressable onPress={() => onComplete(m)} style={[s.iconBtn, { borderColor: rc.border }]} testID={`complete-${m.id}`}>
                  <Ionicons name="checkmark" size={16} color={rc.border} />
                </Pressable>
              )}
              <Pressable onPress={() => onDelete(m)} style={[s.iconBtn, { borderColor: "#ff6b6b66" }]} testID={`delete-${m.id}`}>
                <Ionicons name="trash" size={14} color="#ff6b6b" />
              </Pressable>
            </View>
          </View>
        );
      })}
    </NeonSheet>
  );
}

const s = StyleSheet.create({
  lbl: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 8, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 13,
  },
  rarityRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  rarityChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  rarityText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  reward: { marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1.5, backgroundColor: colors.bg, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rewardText: { fontSize: 14, fontWeight: "900" },
  btn: { marginTop: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  empty: { color: colors.textDim, textAlign: "center", padding: 20, fontSize: 12 },
  missionCard: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: colors.bg,
    marginBottom: 8,
  },
  rarityBadge: { fontSize: 8, fontWeight: "900", letterSpacing: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, overflow: "hidden" },
  missionName: { color: colors.text, fontSize: 13, fontWeight: "800", marginTop: 4 },
  missionDesc: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
});

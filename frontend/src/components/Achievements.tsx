import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import NeonSheet from "./NeonSheet";
import { colors, rarityColors } from "../lib/colors";
import { Ionicons } from "@expo/vector-icons";
import { MissionRarity, Achievement } from "../lib/api";

interface CreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (a: { name: string; description: string; rarity: MissionRarity; imageUrl?: string }) => void;
  targetName: string;
  light: string;
  glow: string;
}

export function AchievementCreator({ visible, onClose, onCreate, targetName, light, glow }: CreatorProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [rarity, setRarity] = useState<MissionRarity>("comun");
  const [image, setImage] = useState<string | undefined>();

  const pick = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) { Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería"); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const uri = a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri;
      setImage(uri);
    }
  };

  const handle = () => {
    if (!name.trim() || !desc.trim()) return;
    onCreate({ name: name.trim(), description: desc.trim(), rarity, imageUrl: image });
    setName(""); setDesc(""); setRarity("comun"); setImage(undefined);
  };

  return (
    <NeonSheet visible={visible} onClose={onClose} title={`CREAR LOGRO PARA ${targetName.toUpperCase()}`} light={light} glow={glow}>
      <Pressable onPress={pick} style={[s.imgBtn, { borderColor: `${light}66` }]} testID="ach-image-picker">
        {image ? <Image source={{ uri: image }} style={s.imgPreview} /> : (
          <View style={s.imgPlaceholder}>
            <Ionicons name="image-outline" size={28} color={light} />
            <Text style={{ color: light, fontSize: 11, fontWeight: "700", marginTop: 4 }}>Añadir imagen</Text>
          </View>
        )}
      </Pressable>
      <Text style={s.lbl}>NOMBRE</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Nombre del logro..." placeholderTextColor={colors.textDim} style={[s.input, { borderColor: `${light}55` }]} testID="ach-name-input" />
      <Text style={s.lbl}>DESCRIPCIÓN</Text>
      <TextInput value={desc} onChangeText={setDesc} placeholder="Descripción..." placeholderTextColor={colors.textDim} multiline numberOfLines={3} style={[s.input, { borderColor: `${light}55`, minHeight: 70, textAlignVertical: "top" }]} testID="ach-desc-input" />
      <Text style={s.lbl}>RAREZA</Text>
      <View style={s.rarityRow}>
        {(Object.keys(rarityColors) as MissionRarity[]).map((r) => {
          const rc = rarityColors[r];
          const active = rarity === r;
          return (
            <Pressable key={r} onPress={() => setRarity(r)} style={[s.rarityChip, { borderColor: active ? rc.border : `${rc.border}55`, backgroundColor: active ? `${rc.border}30` : colors.bg }]} testID={`ach-rarity-${r}`}>
              <Text style={[s.rarityText, { color: active ? rc.border : colors.textDim }]}>{rc.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={handle} style={[s.btn, { backgroundColor: `${light}22`, borderColor: light }]} testID="ach-create-button">
        <Text style={[s.btnText, { color: light }]}>CREAR LOGRO</Text>
      </Pressable>
    </NeonSheet>
  );
}

interface ListProps {
  visible: boolean;
  onClose: () => void;
  items: Achievement[];
  light: string;
  glow: string;
  ownerName: string;
  onDelete: (a: Achievement) => void;
  onCreatePress?: () => void;
}

export function AchievementList({ visible, onClose, items, light, glow, ownerName, onDelete, onCreatePress }: ListProps) {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };
  return (
    <NeonSheet visible={visible} onClose={onClose} title={`LOGROS DE ${ownerName.toUpperCase()}`} light={light} glow={glow}>
      {onCreatePress && (
        <Pressable onPress={onCreatePress} style={[s.topCreate, { borderColor: light, backgroundColor: `${light}22` }]} testID="open-create-achievement">
          <Ionicons name="add-circle" size={16} color={light} />
          <Text style={[s.topCreateText, { color: light }]}>CREAR LOGRO</Text>
        </Pressable>
      )}
      {items.length === 0 && <Text style={s.empty}>Sin logros aún</Text>}
      {items.map((a) => {
        const rc = rarityColors[a.rarity];
        return (
          <View key={a.id} style={[s.card, { borderColor: rc.border, shadowColor: rc.glow }]} testID={`ach-${a.id}`}>
            {a.imageUrl ? <Image source={{ uri: a.imageUrl }} style={s.cardImg} /> : <View style={[s.cardImg, { alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }]}><Ionicons name="trophy" size={28} color={rc.border} /></View>}
            <View style={{ flex: 1 }}>
              <Text style={[s.rarityBadge, { color: rc.border, backgroundColor: `${rc.border}25`, borderColor: `${rc.border}66`, alignSelf: "flex-start" }]}>{rc.label}</Text>
              <Text style={s.cardName}>{a.name}</Text>
              <Text style={s.cardDesc}>{a.description}</Text>
              <Text style={s.cardDate}>{formatDate(a.createdAt)}</Text>
            </View>
            <Pressable onPress={() => onDelete(a)} style={[s.iconBtn, { borderColor: "#ff6b6b66" }]} testID={`ach-delete-${a.id}`}>
              <Ionicons name="trash" size={14} color="#ff6b6b" />
            </Pressable>
          </View>
        );
      })}
    </NeonSheet>
  );
}

const s = StyleSheet.create({
  lbl: { color: colors.text, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginTop: 8, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text, fontSize: 13 },
  rarityRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  rarityChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  rarityText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  btn: { marginTop: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, alignItems: "center" },
  btnText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  empty: { color: colors.textDim, textAlign: "center", padding: 20, fontSize: 12 },
  imgBtn: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", overflow: "hidden", backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  imgPreview: { width: "100%", height: "100%" },
  imgPlaceholder: { alignItems: "center", justifyContent: "center" },
  card: { flexDirection: "row", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1.5, backgroundColor: colors.bg, marginBottom: 8, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  cardImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surface },
  rarityBadge: { fontSize: 8, fontWeight: "900", letterSpacing: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, overflow: "hidden" },
  cardName: { color: colors.text, fontSize: 13, fontWeight: "800", marginTop: 4 },
  cardDesc: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  cardDate: { color: colors.textDim, fontSize: 9, marginTop: 4, fontStyle: "italic" },
  iconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, alignSelf: "center" },
  topCreate: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 10 },
  topCreateText: { fontSize: 12, fontWeight: "900", letterSpacing: 2 },
});

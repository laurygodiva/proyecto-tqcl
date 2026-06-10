import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView, Dimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, PublicUser, UserId } from "../src/lib/api";
import { colors } from "../src/lib/colors";
import FallingHearts from "../src/components/FallingHearts";

const { width: W } = Dimensions.get("window");
const CARD_W = Math.min((W - 60) / 2, 180);

export default function SelectScreen() {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [selected, setSelected] = useState<UserId | null>(null);

  useEffect(() => {
    api.getUsers().then((d) => setUsers(d.users)).catch((e) => console.log("getUsers err", e));
  }, []);

  const go = (id: UserId) => router.push({ pathname: "/login", params: { userId: id } });

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} testID="select-screen">
      <FallingHearts side="left" count={5} />
      <FallingHearts side="right" count={5} />

      <Pressable onPress={() => router.back()} style={styles.backBtn} testID="select-back-button">
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>SELECCIONA{"\n"}UN PERSONAJE</Text>

      <ScrollView contentContainerStyle={styles.cards} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          {users.map((u) => {
            const isSel = selected === u.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => setSelected(u.id)}
                style={[
                  styles.card,
                  {
                    borderColor: `${u.primary}88`,
                    shadowColor: u.glow,
                    backgroundColor: colors.surface,
                    transform: [{ scale: isSel ? 1.03 : selected ? 0.97 : 1 }],
                  },
                ]}
                testID={`select-card-${u.id}`}
              >
                <LinearGradient
                  colors={[`${u.glow}25`, `${u.dark}40`]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.avatarBox, { backgroundColor: `${u.dark}30`, shadowColor: u.dark }]}>
                  <Image source={{ uri: u.avatar }} style={styles.avatar} resizeMode="cover" />
                </View>
                <Text style={[styles.name, { color: u.primary, textShadowColor: u.glow }]}>{u.name}</Text>

                {isSel && (
                  <View style={styles.details}>
                    <Detail label="Edad:" value={u.age} color={u.primary} />
                    <Detail label="Cumpleaños:" value={u.birthday} color={u.primary} />
                    <Detail label="Signo:" value={u.zodiac} color={u.primary} />
                    <Text style={[styles.skillsLabel]}>Habilidades:</Text>
                    <Text style={[styles.skills, { color: u.primary }]}>{u.skills}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <Pressable onPress={() => go(selected)} style={styles.continueWrap} testID="select-continue-button">
            <LinearGradient
              colors={selected === "laury" ? [colors.secondary, colors.secondaryDark] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.continueBtn}
            >
              <Text style={styles.continueText}>JUGAR COMO {selected.toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Detail({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  backBtn: { position: "absolute", top: 50, left: 16, zIndex: 10, padding: 8, backgroundColor: colors.surface, borderRadius: 20 },
  title: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: 3, textAlign: "center", marginTop: 60, marginBottom: 20, lineHeight: 22 },
  cards: { paddingHorizontal: 16, paddingBottom: 40, alignItems: "center", flexGrow: 1, justifyContent: "center" },
  row: { flexDirection: "row", gap: 20, justifyContent: "center", alignItems: "flex-start" },
  card: {
    width: CARD_W,
    borderRadius: 18,
    borderWidth: 2,
    padding: 12,
    overflow: "hidden",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  avatar: { width: "100%", height: "100%" },
  name: { textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: "900", letterSpacing: 1, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  details: { marginTop: 10, gap: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { color: colors.text, fontSize: 10 },
  detailValue: { fontSize: 10, fontWeight: "700" },
  skillsLabel: { color: colors.text, fontSize: 10, marginTop: 4 },
  skills: { fontSize: 10, lineHeight: 14, fontWeight: "600" },
  continueWrap: { marginTop: 32, alignSelf: "stretch", paddingHorizontal: 20 },
  continueBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  continueText: { color: colors.bg, fontWeight: "900", letterSpacing: 2, fontSize: 13 },
});

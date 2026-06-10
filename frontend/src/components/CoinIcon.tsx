import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../lib/colors";

interface Props {
  size?: number;
}

// Moneda de la app — degradado cian/magenta/púrpura como el logo
export default function CoinIcon({ size = 18 }: Props) {
  const ring = size;
  const inner = size - 4;
  return (
    <View style={{ width: ring, height: ring, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient
        colors={[colors.primary, colors.accent, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: ring, height: ring, borderRadius: ring / 2, shadowColor: colors.glowPink, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }}
      />
      <View style={[styles.inner, { width: inner, height: inner, borderRadius: inner / 2, top: 2, left: 2 }]}>
        <Text style={[styles.tql, { fontSize: size * 0.42 }]}>♥</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: "absolute",
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  tql: {
    color: colors.glowPink,
    fontWeight: "900",
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../lib/colors";

interface Props {
  size?: number;
}

// Ticket usando el mismo estilo del CoinIcon (degradado cian/magenta + interior oscuro)
export default function TicketIcon({ size = 18 }: Props) {
  const ring = size;
  const radius = size * 0.28;
  return (
    <View style={{ width: ring, height: ring, alignItems: "center", justifyContent: "center" }}>
      <LinearGradient
        colors={[colors.primary, colors.accent, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: ring,
          height: ring * 0.78,
          borderRadius: radius,
          shadowColor: colors.glowPink,
          shadowOpacity: 0.7,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      <View style={[styles.inner, { width: ring - 4, height: ring * 0.78 - 4, borderRadius: radius - 1 }]}>
        <Ionicons name="ticket" size={size * 0.6} color={colors.glowPink} />
      </View>
      {/* Notches a izquierda y derecha del ticket */}
      <View style={[styles.notch, { left: -2, width: 4, height: 4, borderRadius: 2 }]} />
      <View style={[styles.notch, { right: -2, width: 4, height: 4, borderRadius: 2 }]} />
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
  notch: {
    position: "absolute",
    top: "50%",
    marginTop: -2,
    backgroundColor: colors.bg,
  },
});

import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/colors";
import { BubbleState } from "../lib/api";

interface Props {
  state: BubbleState;
  isEditable: boolean;
  light: string;
  glow: string;
  onPress?: () => void;
}

export default function StatusBubble({ state, isEditable, light, glow, onPress }: Props) {
  const borderCol = `${light}88`;
  const bgCol = `${colors.bg}EE`;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable
        disabled={!isEditable}
        onPress={onPress}
        style={[
          styles.bubble,
          {
            borderColor: borderCol,
            shadowColor: glow,
            backgroundColor: bgCol,
          },
        ]}
        testID="status-bubble"
      >
        <Ionicons name="heart" size={12} color={light} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
          {state.text}
        </Text>
      </Pressable>
      {/* Comic-style tail pointing down toward the avatar */}
      <View style={[styles.tailOuter, { borderTopColor: borderCol }]} pointerEvents="none" />
      <View style={[styles.tailInner, { borderTopColor: bgCol }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1.5,
    maxWidth: 140,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { fontSize: 11, fontWeight: "600" },
  tailOuter: {
    position: "absolute",
    bottom: -7,
    left: "50%",
    marginLeft: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  tailInner: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});

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
  return (
    <Pressable
      disabled={!isEditable}
      onPress={onPress}
      style={[
        styles.bubble,
        {
          borderColor: `${light}88`,
          shadowColor: glow,
          backgroundColor: `${colors.bg}EE`,
        },
      ]}
      testID="status-bubble"
    >
      <Ionicons name="heart" size={12} color={light} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {state.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    maxWidth: 140,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { fontSize: 11, fontWeight: "600" },
});

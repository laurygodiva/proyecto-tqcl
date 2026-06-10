import React from "react";
import { View, StyleSheet, Modal, Pressable, Text, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/colors";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  light: string;
  glow: string;
  children: React.ReactNode;
}

export default function NeonSheet({ visible, onClose, title, light, glow, children }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              borderColor: `${light}66`,
              shadowColor: glow,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: light, textShadowColor: glow }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} testID="sheet-close">
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 12 }}>{children}</ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 20 },
  sheet: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    overflow: "hidden",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  title: { fontSize: 14, fontWeight: "900", letterSpacing: 2, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  body: { paddingHorizontal: 16, paddingTop: 12 },
});

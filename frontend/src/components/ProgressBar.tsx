import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { colors } from "../lib/colors";

interface Props {
  level: number;
  currentXP: number;
  maxXP: number;
  userColor: { light: string; glow: string; shadow: string };
  triggerGlow?: boolean;
}

export default function ProgressBar({ level, currentXP, maxXP, userColor, triggerGlow }: Props) {
  const pct = Math.min(100, (currentXP / maxXP) * 100);
  const widthSV = useSharedValue(pct);
  const glow = useSharedValue(0);

  useEffect(() => {
    widthSV.value = withTiming(pct, { duration: 600 });
  }, [pct, widthSV]);

  useEffect(() => {
    if (triggerGlow) {
      glow.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 900 }));
    }
  }, [triggerGlow, glow]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${widthSV.value}%` }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: `${userColor.light}55`,
          shadowColor: userColor.glow,
        },
      ]}
      testID="progress-bar"
    >
      <View style={styles.topRow}>
        <Text style={[styles.label, { color: colors.text }]}>NIVEL DE VÍNCULO</Text>
        <Text style={[styles.xp, { color: userColor.light }]}>
          {currentXP}/{maxXP} XP
        </Text>
      </View>
      <View style={styles.barOuter}>
        <Animated.View style={[styles.barFillWrap, fillStyle]}>
          <LinearGradient
            colors={[userColor.light, userColor.shadow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: userColor.glow },
              glowStyle,
            ]}
          />
        </Animated.View>
        <View style={[styles.levelBubble, { borderColor: userColor.light }]}>
          <Text style={[styles.levelText, { color: userColor.light }]}>{level}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontSize: 8.5, fontWeight: "800", letterSpacing: 1 },
  xp: { fontSize: 9, fontWeight: "700" },
  barOuter: {
    height: 14,
    backgroundColor: colors.bg,
    borderRadius: 7,
    overflow: "hidden",
    justifyContent: "center",
    position: "relative",
  },
  barFillWrap: { height: "100%", borderRadius: 7, overflow: "hidden" },
  levelBubble: {
    position: "absolute",
    alignSelf: "center",
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  levelText: { fontSize: 11, fontWeight: "900" },
});

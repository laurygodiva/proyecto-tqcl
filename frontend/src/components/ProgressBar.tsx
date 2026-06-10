import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { colors, userColors } from "../lib/colors";

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
        <View style={styles.levelRow}>
          <Text style={[styles.lvlLabel, { color: colors.textDim }]}>LVL</Text>
          <Text style={[styles.levelText, { color: userColor.light, textShadowColor: userColor.glow }]}>{level}</Text>
        </View>
        <Text style={[styles.xp, { color: userColor.light }]}>
          {currentXP}/{maxXP} XP
        </Text>
      </View>
      <View style={styles.barOuter}>
        <Animated.View style={[styles.barFillWrap, fillStyle]}>
          <LinearGradient
            colors={[userColors.laury.light, userColors.danny.light]}
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
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  levelRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  lvlLabel: { fontSize: 8.5, fontWeight: "700", letterSpacing: 1 },
  levelText: {
    fontSize: 16,
    fontWeight: "900",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  xp: { fontSize: 9, fontWeight: "700" },
  barOuter: {
    height: 12,
    backgroundColor: colors.bg,
    borderRadius: 6,
    overflow: "hidden",
  },
  barFillWrap: { height: "100%", borderRadius: 6, overflow: "hidden" },
});

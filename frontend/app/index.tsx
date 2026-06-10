import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from "react-native-reanimated";
import { colors, LOGO_URL } from "../src/lib/colors";
import { authStore } from "../src/lib/auth";
import FallingHearts from "../src/components/FallingHearts";

const { width: W } = Dimensions.get("window");

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [showStart, setShowStart] = useState(false);
  const float = useSharedValue(0);
  const glow = useSharedValue(0.5);

  useEffect(() => {
    (async () => {
      const stored = await authStore.load();
      if (stored) {
        setTimeout(() => router.replace("/dashboard"), 300);
      }
    })();
  }, []);

  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-8, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(0.12, { duration: 600 }), withTiming(0.04, { duration: 600 })), -1, true);
  }, [float, glow]);

  useEffect(() => {
    const i = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(i); setTimeout(() => setShowStart(true), 300); return 100; }
        return p + 3;
      });
    }, 60);
    return () => clearInterval(i);
  }, []);

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.root} testID="loading-screen">
      <FallingHearts side="left" count={6} />
      <FallingHearts side="right" count={6} />
      <Animated.View style={[styles.glowCenter, glowStyle]} />

      <Animated.View style={[styles.logoWrap, floatStyle]}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {!showStart ? (
        <View style={styles.barOuter}>
          <LinearGradient
            colors={[colors.secondary, colors.accent, colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${progress}%` }]}
          />
        </View>
      ) : (
        <Pressable onPress={() => router.push("/select")} testID="loading-acceder-button">
          <LinearGradient
            colors={[colors.secondary, colors.accent, colors.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.accederBtn}
          >
            <Text style={styles.accederText}>ACCEDER</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  glowCenter: { position: "absolute", width: W * 0.9, height: W * 0.9, borderRadius: W * 0.45, backgroundColor: colors.primary, top: "50%", left: "50%", marginLeft: -(W * 0.45), marginTop: -(W * 0.55) },
  logoWrap: { width: W * 0.7, height: W * 0.7, alignItems: "center", justifyContent: "center" },
  logo: { width: "100%", height: "100%" },
  barOuter: { width: 220, height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: "hidden", marginTop: 40 },
  barFill: { height: "100%", borderRadius: 4 },
  accederBtn: { marginTop: 40, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, shadowColor: colors.glowBlue, shadowOpacity: 0.6, shadowRadius: 14 },
  accederText: { color: colors.bg, fontWeight: "900", letterSpacing: 4, fontSize: 16 },
});

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withDelay,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/colors";

const { height: H } = Dimensions.get("window");

interface Props {
  count?: number;
  side: "left" | "right";
}

function FallingHeart({ delay, x, color, size }: { delay: number; x: number; color: string; size: number }) {
  const y = useSharedValue(H + 50);
  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-100, { duration: 10000 + Math.random() * 5000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ position: "absolute", left: x, opacity: 0.18 }, style]}>
      <Ionicons name="heart" size={size} color={color} />
    </Animated.View>
  );
}

export default function FallingHearts({ count = 5, side }: Props) {
  const items = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: side === "left"
        ? Math.random() * 80 + 10
        : Math.random() * 80 + 10,
      delay: Math.random() * 5000,
      color: i % 2 === 0 ? colors.primary : colors.secondary,
      size: 18 + Math.random() * 18,
    }));
  }, [count, side]);

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        side === "left" ? { right: undefined, width: 100 } : { left: undefined, width: 100, right: 0 },
      ]}
    >
      {items.map((it, i) => (
        <FallingHeart key={i} {...it} />
      ))}
    </View>
  );
}

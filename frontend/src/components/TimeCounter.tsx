import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, userColors as userColorsExport } from "../lib/colors";

interface Props {
  startDate: Date;
}

function computeDiff(start: Date) {
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  if (hours < 0) { days -= 1; hours += 24; }
  if (days < 0) {
    months -= 1;
    const prev = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), hours: Math.max(0, hours) };
}

export default function TimeCounter({ startDate }: Props) {
  const [t, setT] = useState(() => computeDiff(startDate));
  useEffect(() => {
    const i = setInterval(() => setT(computeDiff(startDate)), 60000);
    return () => clearInterval(i);
  }, [startDate]);

  const L = userColorsExport.laury;
  const D = userColorsExport.danny;
  const units = [
    { v: t.years, l: "años", color: L.light, glow: L.glow },
    { v: t.months, l: "meses", color: D.light, glow: D.glow },
    { v: t.days, l: "días", color: L.light, glow: L.glow },
    { v: t.hours, l: "horas", color: D.light, glow: D.glow },
  ];

  return (
    <View style={styles.row} testID="time-counter">
      {units.map((u) => (
        <View key={u.l} style={styles.unit}>
          <Text style={[styles.value, { color: u.color, textShadowColor: u.glow }]}>{u.v}</Text>
          <Text style={styles.label}>{u.l}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center" },
  unit: { alignItems: "center", minWidth: 34 },
  value: {
    fontSize: 15,
    fontWeight: "900",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: { fontSize: 9, color: colors.textDim, fontWeight: "600" },
});

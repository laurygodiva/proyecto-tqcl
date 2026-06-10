import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../lib/colors";

interface Props {
  startDate: Date;
  color: string;
  glow: string;
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

export default function TimeCounter({ startDate, color, glow }: Props) {
  const [t, setT] = useState(() => computeDiff(startDate));
  useEffect(() => {
    const i = setInterval(() => setT(computeDiff(startDate)), 60000);
    return () => clearInterval(i);
  }, [startDate]);

  const units = [
    { v: t.years, l: "años" },
    { v: t.months, l: "meses" },
    { v: t.days, l: "días" },
    { v: t.hours, l: "horas" },
  ];

  return (
    <View style={styles.row} testID="time-counter">
      {units.map((u) => (
        <View key={u.l} style={styles.unit}>
          <Text style={[styles.value, { color, textShadowColor: glow }]}>{u.v}</Text>
          <Text style={styles.label}>{u.l}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  unit: { alignItems: "center", minWidth: 28 },
  value: {
    fontSize: 13,
    fontWeight: "900",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: { fontSize: 9, color: colors.textDim, fontWeight: "600" },
});

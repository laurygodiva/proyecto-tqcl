import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from "react-native-reanimated";
import { api, PublicUser, UserId } from "../src/lib/api";
import { authStore } from "../src/lib/auth";
import { colors } from "../src/lib/colors";

export default function LoginScreen() {
  const { userId } = useLocalSearchParams<{ userId: UserId }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shake = useSharedValue(0);

  useEffect(() => {
    api.getUsers().then((d) => setUser(d.users.find((u) => u.id === userId) || null));
  }, [userId]);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(user.id, password);
      await authStore.save({ token: res.token, user: res.user });
      router.replace("/dashboard");
    } catch (e: any) {
      setError("Contraseña incorrecta");
      shake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    } finally {
      setLoading(false);
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  if (!user) return <View style={styles.root} />;

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} testID="login-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="login-back-button">
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.body}>
          <View style={[styles.avatarBox, { shadowColor: user.glow, backgroundColor: `${user.dark}30` }]}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </View>
          <Text style={styles.welcome}>¡Bienvenid{user.id === "laury" ? "a" : "o"} de nuevo,</Text>
          <Text style={[styles.name, { color: user.primary, textShadowColor: user.glow }]}>{user.name}!</Text>
          <Text style={styles.hint}>Ingresa tu contraseña</Text>

          <Animated.View style={[styles.inputWrap, { borderColor: error ? "#ff6b6b" : `${user.dark}88` }, shakeStyle]}>
            <Ionicons name="lock-closed" size={18} color={user.primary} />
            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              onSubmitEditing={submit}
              testID="login-password-input"
            />
          </Animated.View>

          {error && <Text style={styles.error} testID="login-error">{error}</Text>}

          <Pressable onPress={submit} disabled={loading || !password} testID="login-submit-button">
            <LinearGradient
              colors={user.id === "laury" ? [colors.secondary, colors.secondaryDark] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.submit, { opacity: loading || !password ? 0.6 : 1, shadowColor: user.glow }]}
            >
              <Text style={styles.submitText}>{loading ? "ENTRANDO..." : "ENTRAR"}</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.tip}>Tip: la contraseña inicial es {user.id}123</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  backBtn: { position: "absolute", top: 50, left: 16, zIndex: 10, padding: 8, backgroundColor: colors.surface, borderRadius: 20 },
  body: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  avatarBox: { width: 140, height: 140, borderRadius: 70, overflow: "hidden", shadowOpacity: 0.7, shadowRadius: 20, marginBottom: 16 },
  avatar: { width: "100%", height: "100%" },
  welcome: { color: colors.text, fontSize: 16, fontWeight: "600" },
  name: { fontSize: 24, fontWeight: "900", letterSpacing: 1, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10, marginTop: 2 },
  hint: { color: colors.textDim, fontSize: 13, marginTop: 6, marginBottom: 24 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 2, width: "100%" },
  input: { flex: 1, color: colors.text, fontSize: 16, letterSpacing: 2 },
  error: { color: "#ff6b6b", marginTop: 8, fontSize: 12 },
  submit: { marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: "center", paddingHorizontal: 60, shadowOpacity: 0.5, shadowRadius: 12 },
  submitText: { color: colors.bg, fontWeight: "900", letterSpacing: 3, fontSize: 14 },
  tip: { color: colors.textDim, fontSize: 10, marginTop: 18, fontStyle: "italic" },
});

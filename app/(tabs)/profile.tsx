
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { apiCall } from "@/utils/api";
import * as Haptics from "expo-haptics";

export default function MembershipScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "Le prénom est requis";
    if (!lastName.trim()) newErrors.lastName = "Le nom est requis";
    if (!phone.trim()) newErrors.phone = "Le téléphone est requis";
    if (!commune.trim()) newErrors.commune = "La commune est requise";
    if (!profession.trim()) newErrors.profession = "La profession est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("[Profile] User tapped Envoyer ma demande");

    if (!validate()) {
      console.log("[Profile] Validation failed", errors);
      return;
    }

    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      region: region.trim() || undefined,
      commune: commune.trim(),
      profession: profession.trim(),
    };
    console.log("[Profile] POST /api/members/register", payload);

    try {
      const response = await apiCall<{ membershipNumber: string }>(
        "/api/members/register",
        { method: "POST", body: JSON.stringify(payload) }
      );

      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log("[Profile] Registration success:", response.membershipNumber);
      router.push({
        pathname: "/member/card",
        params: { membershipNumber: response.membershipNumber },
      });
    } catch (error: any) {
      setLoading(false);
      const msg: string = error?.message || "";
      console.error("[Profile] Registration error:", msg);

      // 409 duplicate phone — message contains membershipNumber
      const numMatch = msg.match(/([A-Z0-9\-]{6,})/);
      if (msg.includes("409") || msg.toLowerCase().includes("déjà") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")) {
        const existingNumber = numMatch ? numMatch[1] : "";
        console.log("[Profile] Duplicate phone, existing number:", existingNumber);
        Alert.alert(
          "Déjà inscrit",
          `Vous êtes déjà inscrit. Numéro: ${existingNumber}`,
          [
            {
              text: "Voir ma carte",
              onPress: () =>
                router.push({
                  pathname: "/member/card",
                  params: { membershipNumber: existingNumber },
                }),
            },
            { text: "OK", style: "cancel" },
          ]
        );
      } else {
        Alert.alert("Erreur", msg || "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="person.badge.plus.fill"
          android_material_icon_name="person-add"
          size={48}
          color={colors.primary}
        />
        <Text style={styles.title}>Adhérer au Parti</Text>
        <Text style={styles.subtitle}>
          Rejoignez l&apos;Alliance pour le Rassemblement Malien
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prénom *</Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : null]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Votre prénom"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.firstName ? (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : null]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Votre nom de famille"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.lastName ? (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Téléphone *</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : null]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+223 XX XX XX XX"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            editable={!loading}
          />
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Commune *</Text>
          <TextInput
            style={[styles.input, errors.commune ? styles.inputError : null]}
            value={commune}
            onChangeText={setCommune}
            placeholder="Votre commune"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.commune ? (
            <Text style={styles.errorText}>{errors.commune}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Profession *</Text>
          <TextInput
            style={[styles.input, errors.profession ? styles.inputError : null]}
            value={profession}
            onChangeText={setProfession}
            placeholder="Votre profession"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
          {errors.profession ? (
            <Text style={styles.errorText}>{errors.profession}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Région</Text>
          <TextInput
            style={styles.input}
            value={region}
            onChangeText={setRegion}
            placeholder="Votre région (optionnel)"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com (optionnel)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol
            ios_icon_name="info.circle.fill"
            android_material_icon_name="info"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Votre demande sera examinée par notre équipe. Vous recevrez une confirmation.
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: Platform.OS === "android" ? 48 : 0,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.background,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});


import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import * as Haptics from "expo-haptics";

const BACKEND_URL = "https://q4thnc8stu4bc4fcm2ekabu3ahgaahtu.app.specular.dev";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  commune?: string;
  profession?: string;
}

export default function MembershipScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");
  const [commune, setCommune] = useState("");
  const [profession, setProfession] = useState("");
  const [nina, setNina] = useState("");
  const [motivation, setMotivation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = "Le prénom est requis";
    if (!lastName.trim()) newErrors.lastName = "Le nom est requis";
    if (!phone.trim()) newErrors.phone = "Le téléphone est requis";
    if (!commune.trim()) newErrors.commune = "La commune est requise";
    if (!profession.trim()) newErrors.profession = "La profession est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log("[Profile] Bouton 'Envoyer ma demande' appuyé");

    if (!validate()) {
      console.log("[Profile] Validation échouée", errors);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading(true);
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      region: region.trim() || undefined,
      commune: commune.trim() || "Non spécifiée",
      profession: profession.trim() || "Non spécifiée",
      nina: nina.trim() || undefined,
      motivation: motivation.trim() || undefined,
    };
    console.log("[Profile] POST /api/members/register", payload);

    try {
      const response = await fetch(`${BACKEND_URL}/api/members/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 409) {
        console.log("[Profile] Déjà inscrit, numéro:", data.membershipNumber);
        Alert.alert(
          "Déjà inscrit",
          `Vous êtes déjà enregistré.\nNuméro: ${data.membershipNumber}`,
          [
            {
              text: "Voir ma carte",
              onPress: () =>
                router.push({
                  pathname: "/member/card",
                  params: { membershipNumber: data.membershipNumber },
                }),
            },
            { text: "OK", style: "cancel" },
          ]
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || `Erreur ${response.status}`);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      console.log("[Profile] Inscription réussie:", data.membershipNumber);
      Alert.alert(
        "Inscription réussie !",
        `Bienvenue ! Numéro: ${data.membershipNumber}`,
        [
          {
            text: "Voir ma carte",
            onPress: () =>
              router.push({
                pathname: "/member/card",
                params: { membershipNumber: data.membershipNumber },
              }),
          },
        ]
      );
    } catch (error: any) {
      console.error("[Profile] Erreur inscription:", error.message);
      Alert.alert("Erreur", error.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string, hasError?: boolean) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    hasError && styles.inputError,
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ARM</Text>
        </View>
        <Text style={styles.title}>Adhésion ARM</Text>
        <Text style={styles.subtitle}>
          Rejoignez l'Alliance pour le Rassemblement Malien
        </Text>
      </View>

      <View style={styles.form}>
        {/* Prénom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Prénom <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("firstName", !!errors.firstName)}
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              if (errors.firstName) setErrors((e) => ({ ...e, firstName: undefined }));
            }}
            placeholder="Votre prénom"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("firstName")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
        </View>

        {/* Nom */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Nom <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("lastName", !!errors.lastName)}
            value={lastName}
            onChangeText={(t) => {
              setLastName(t);
              if (errors.lastName) setErrors((e) => ({ ...e, lastName: undefined }));
            }}
            placeholder="Votre nom de famille"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("lastName")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
        </View>

        {/* Téléphone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Téléphone <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("phone", !!errors.phone)}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
            }}
            placeholder="+223 XX XX XX XX"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            editable={!loading}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={inputStyle("email")}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com (optionnel)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Région */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Région</Text>
          <TextInput
            style={inputStyle("region")}
            value={region}
            onChangeText={setRegion}
            placeholder="Votre région (optionnel)"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("region")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Commune */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Commune <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("commune", !!errors.commune)}
            value={commune}
            onChangeText={(t) => {
              setCommune(t);
              if (errors.commune) setErrors((e) => ({ ...e, commune: undefined }));
            }}
            placeholder="Votre commune"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("commune")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.commune ? <Text style={styles.errorText}>{errors.commune}</Text> : null}
        </View>

        {/* Profession */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Profession <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={inputStyle("profession", !!errors.profession)}
            value={profession}
            onChangeText={(t) => {
              setProfession(t);
              if (errors.profession) setErrors((e) => ({ ...e, profession: undefined }));
            }}
            placeholder="Votre profession"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            editable={!loading}
            onFocus={() => setFocusedField("profession")}
            onBlur={() => setFocusedField(null)}
          />
          {errors.profession ? <Text style={styles.errorText}>{errors.profession}</Text> : null}
        </View>

        {/* NINA */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NINA</Text>
          <TextInput
            style={inputStyle("nina")}
            value={nina}
            onChangeText={setNina}
            placeholder="Numéro d'identification (optionnel)"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            editable={!loading}
            onFocus={() => setFocusedField("nina")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        {/* Motivation */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Motivation</Text>
          <TextInput
            style={[inputStyle("motivation"), styles.textArea]}
            value={motivation}
            onChangeText={setMotivation}
            placeholder="Pourquoi souhaitez-vous adhérer ? (optionnel)"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            editable={!loading}
            onFocus={() => setFocusedField("motivation")}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <AnimatedPressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Envoyer ma demande</Text>
          )}
        </AnimatedPressable>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
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
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
  },
  headerBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerBadgeText: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
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
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryMuted,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});

import React from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/styles/commonStyles";

const logoSource = require("@/assets/images/f017b698-5f03-4bb9-bbf0-a9094cbe948a.jpeg");

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Image
          source={logoSource}
          style={styles.logo}
          contentFit="cover"
        />
        <Text style={styles.title}>Alliance ARM</Text>
        <Text style={styles.subtitle}>Fraternité · Liberté · Égalité</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingBottom: 40,
  },
  hero: {
    width: "100%",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.secondary,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.surface,
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 6,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

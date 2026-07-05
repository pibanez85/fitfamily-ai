import { Dumbbell } from "lucide-react-native";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { radius } from "@/theme/colors";
import { gymImages } from "@/theme/images";

// El hero va siempre sobre una foto oscura: usa colores fijos para mantener
// contraste correcto en tema claro y oscuro.
const heroColors = {
  surface: "#111823",
  overlay: "rgba(3, 7, 18, 0.58)",
  primary: "#2dd4bf",
  energy: "#facc15",
  text: "#f8fafc",
  shadow: "#000000",
};

type BrandHeroProps = {
  subtitle?: string;
};

export function BrandHero({ subtitle }: BrandHeroProps) {
  return (
    <ImageBackground source={{ uri: gymImages.hero }} imageStyle={styles.image} style={styles.wrapper}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.logo}>
            <Dumbbell size={28} color="#071013" />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI Coach</Text>
          </View>
        </View>
        <Text style={styles.name}>FitFamily AI</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 230,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: heroColors.surface,
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  image: {
    borderRadius: radius.lg,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: heroColors.overlay,
  },
  content: {
    gap: 12,
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: heroColors.primary,
    shadowColor: heroColors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.22)",
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    color: heroColors.energy,
    fontSize: 12,
    fontWeight: "900",
  },
  name: {
    color: heroColors.text,
    fontSize: 36,
    fontWeight: "900",
  },
  subtitle: {
    color: "#dbeafe",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 290,
  },
});

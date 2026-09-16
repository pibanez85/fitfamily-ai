import { Leaf } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme/theme";
export function BrandHero({ subtitle }: { subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.hero}>
      <View style={[styles.logo, { backgroundColor: colors.primarySoft }]}>
        <Leaf size={31} color={colors.primary} />
      </View>
      <Text style={[styles.brand, { color: colors.text }]}>
        fitfamily<Text style={{ color: colors.primary }}>.</Text>
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>
        Tu bienestar empieza{"\n"}con un pequeño paso.
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  hero: { gap: 18, paddingVertical: 15, marginBottom: 12 },
  logo: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  title: { fontSize: 35, fontWeight: "700", lineHeight: 41, letterSpacing: -1.4 },
  subtitle: { fontSize: 15, lineHeight: 23 },
});

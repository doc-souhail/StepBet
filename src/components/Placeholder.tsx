import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  links?: { label: string; href: string }[];
};

// Temporary screen content so we can check navigation works.
export default function Placeholder({ title, subtitle, links = [] }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {links.map((l) => (
        <Link key={l.href} href={l.href as any} style={styles.link}>
          {l.label}
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
    justifyContent: "center",
  },
  title: { fontSize: 32, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 16, color: colors.muted },
  link: {
    fontSize: 18,
    color: colors.accent,
    fontWeight: "600",
    paddingVertical: spacing.sm,
  },
});

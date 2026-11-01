import { Text, View } from "react-native";

type Props = {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
};

export default function StatTile({
  label,
  value,
  sub,
  highlight = false,
}: Props) {
  return (
    <View className="flex-1 bg-card border border-line rounded-3xl p-4">
      <Text className="text-muted text-xs font-semibold tracking-widest">
        {label}
      </Text>
      <Text
        className={`text-3xl font-extrabold mt-1 ${highlight ? "text-accent" : "text-ink"}`}
      >
        {value}
      </Text>
      {sub ? <Text className="text-muted text-xs mt-1">{sub}</Text> : null}
    </View>
  );
}

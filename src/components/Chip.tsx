import { Pressable, Text } from "react-native";

type Props = { label: string; active: boolean; onPress: () => void };

// Selectable pill used in forms
export default function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2.5 mr-2 mb-2 border ${
        active ? "bg-accent border-accent" : "bg-card border-line"
      }`}
    >
      <Text
        className={active ? "text-black font-bold" : "text-ink font-semibold"}
      >
        {label}
      </Text>
    </Pressable>
  );
}

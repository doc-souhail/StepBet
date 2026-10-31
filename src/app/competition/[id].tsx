import { useLocalSearchParams } from "expo-router";
import Placeholder from "../../components/Placeholder";

export default function Competition() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Placeholder title="Leaderboard" subtitle={`Competition id: ${id}`} />;
}

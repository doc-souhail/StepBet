import { Text, View } from "react-native";
import { parseISO } from "../lib/dates";
import { DayRow } from "../lib/stats";

const LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const HEIGHT = 120;

type Props = { days: DayRow[]; goal: number; today: string };

export default function BarChart({ days, goal, today }: Props) {
  const max = Math.max(goal, ...days.map((d) => d.steps), 1);

  return (
    <View>
      <View style={{ height: HEIGHT }} className="flex-row items-end">
        {/* Goal line */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: (goal / max) * HEIGHT,
            borderTopWidth: 1,
            borderColor: "#3A3C42",
            borderStyle: "dashed",
          }}
        />
        {days.map((d) => {
          const future = d.day > today;
          const h = d.steps > 0 ? Math.max(6, (d.steps / max) * HEIGHT) : 3;
          return (
            <View
              key={d.day}
              className="flex-1 items-center justify-end mx-0.5"
              style={{ height: HEIGHT }}
            >
              <View
                className="w-full rounded-t-lg"
                style={{
                  height: h,
                  backgroundColor: d.steps >= goal ? "#C6F432" : "#3A3C42",
                  opacity: future ? 0.25 : 1,
                }}
              />
            </View>
          );
        })}
      </View>
      <View className="flex-row mt-2">
        {days.map((d) => (
          <Text
            key={d.day}
            className={`flex-1 text-center text-xs ${d.day === today ? "text-accent font-bold" : "text-muted"}`}
          >
            {LETTERS[parseISO(d.day).getDay()]}
          </Text>
        ))}
      </View>
    </View>
  );
}

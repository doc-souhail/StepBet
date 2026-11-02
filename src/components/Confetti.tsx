import { useEffect, useMemo } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

const COLORS = [
  "#C6F432",
  "#60A5FA",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
  "#FFFFFF",
];
const { width, height } = Dimensions.get("window");

type PieceProps = {
  x: number;
  delay: number;
  size: number;
  color: string;
  duration: number;
  drift: number;
};

function Piece({ x, delay, size, color, duration, drift }: PieceProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    // Falls from top to bottom twice, then stays out of sight
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), 2, false),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + t.value * (height + 80) },
      { translateX: Math.sin(t.value * 8) * drift },
      { rotate: `${t.value * 720}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: 0,
          width: size,
          height: size * 1.6,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function Confetti({ count = 36 }: { count?: number }) {
  // Random values are generated once, not on every render
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        delay: Math.random() * 1200,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        duration: 2800 + Math.random() * 1800,
        drift: 10 + Math.random() * 25,
      })),
    [count],
  );

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {pieces.map((p) => (
        <Piece key={p.id} {...p} />
      ))}
    </View>
  );
}

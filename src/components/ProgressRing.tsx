import { ReactNode, useEffect } from "react";
import { View } from "react-native";
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
};

// Circular progress: progress goes from 0 to 1 (more than 1 stays full)
export default function ProgressRing({
  progress,
  size = 180,
  stroke = 14,
  children,
}: Props) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 900 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - p.value),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center"
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#26272B"
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#C6F432"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="items-center">{children}</View>
    </View>
  );
}

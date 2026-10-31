module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#0A0A0B",
        card: "#16171A",
        line: "#26272B",
        ink: "#F4F4F5",
        muted: "#8B8D94",
        accent: "#C6F432",
      },
    },
  },
  plugins: [],
};

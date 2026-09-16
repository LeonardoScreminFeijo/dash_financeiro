import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        ink: "#17211d",
        canvas: "#f6f7f2",
        pine: "#176b4e",
        coral: "#cc5b43",
      },
    },
  },
  plugins: [],
};

export default config;

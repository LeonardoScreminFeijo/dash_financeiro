import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: [".next/**", "node_modules/**"] },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: { parser: tsParser },
    plugins: { "@next/next": nextPlugin, "react-hooks": reactHooksPlugin, "@typescript-eslint": tsPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...reactHooksPlugin.configs.recommended.rules },
  },
];

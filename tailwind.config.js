/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        groww: {
          green: "#00D09C",
          dark: "#0B1215",
          slate: "#121A1F",
          border: "#22303A",
          indigo: "#5367FF",
          amber: "#FFB627",
          coral: "#FF5A5F"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"]
      }
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B0F14",
          panel: "#141A21",
          panelAlt: "#1B232C",
          border: "#29323C",
        },
        ink: {
          primary: "#E7ECF2",
          muted: "#8B96A5",
          faint: "#5B6572",
        },
        signal: {
          ok: "#35C979",
          okDim: "#1F5A3C",
          warn: "#F2B033",
          warnDim: "#6B4E14",
          crit: "#EF5757",
          critDim: "#63201F",
          plan: "#4C8DFF",
        },
      },
      fontFamily: {
        display: ["var(--font-barlow)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
    },
  },
  plugins: [],
};

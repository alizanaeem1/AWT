/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "#111827",
        card: "#1f2937",
        /** Dashboard mock: deep navy + indigo accent */
        app: {
          bg: "#0b0c14",
          surface: "#12141f",
          card: "#16182a",
          "card-raised": "#1a1d2e",
          border: "rgba(255, 255, 255, 0.06)"
        },
        brand: {
          DEFAULT: "#6366f1",
          muted: "rgba(99, 102, 241, 0.12)",
          soft: "rgba(99, 102, 241, 0.2)"
        }
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04)"
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:       "#0F111A",
        secondary:     "#171C26",
        card:          "#1E2433",
        textPrimary:   "#F8FAFC",
        textSecondary: "#CBD5E1",
        accent:        "#64748B",
        accentHover:   "#475569",
        border:        "#334155",
        success:       "#10B981",
        warning:       "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
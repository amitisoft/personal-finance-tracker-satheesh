/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe8ff",
          500: "#335cff",
          700: "#1d3a9f",
          900: "#0f1d52",
        },
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 29, 82, 0.08)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

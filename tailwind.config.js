/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [{
      default: {
        "primary": "#0E1826",
        "secondary": "#34C5C5",
        "accent": "#F4B019",
        "neutral": "#3d4451",
        "base-100": "#ffffff",
      },
    },
      "night"]
  },
  // eslint-disable-next-line no-undef
  plugins: [require("daisyui")],
}


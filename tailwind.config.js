/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ["winter", "night", "valentine", "cyberpunk", "retro", "aqua",
      "light", "pastel", "nord", "forest", "lemonade", "luxury", "dark"]
  },
  // eslint-disable-next-line no-undef
  plugins: [require("daisyui")],
  variants: {
    borderWidth: ['responsive', 'first', 'hover', 'focus'],
  },
}


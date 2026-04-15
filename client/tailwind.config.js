/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
     screens: {
      'sm': '576px',
      // => @media (min-width: 576px) { ... }

      'md': '960px',
      // => @media (min-width: 960px) { ... }

      'lg': '1440px',
      // => @media (min-width: 1440px) { ... }
    },
    colors: {
      lightBg: '#E2E8F0',
      lightprimary: '#1E40AF',
      lightsecondary: '#3B82F6',
      lighttext: '#1E293B',
    },
  },
  plugins: [],
}
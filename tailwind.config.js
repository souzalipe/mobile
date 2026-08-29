/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // status de urgência (alinhado com vw_proximas_contas.urgencia)
        atrasado: '#ef4444',
        'vence-hoje': '#f97316',
        proximo: '#eab308',
        normal: '#22c55e',
      },
    },
  },
  plugins: [],
};

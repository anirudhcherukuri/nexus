/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#080817',
          surface: '#0D1024',
          sidebar: '#111127',
          card: 'rgba(25, 25, 55, 0.78)',
          cardSolid: '#141432',
          glass: 'rgba(75, 65, 130, 0.13)',
          glassHover: 'rgba(121, 87, 232, 0.18)',
          purple: '#9875FF',
          violet: '#7957E8',
          blue: '#55A8FF',
          cyan: '#42D9E8',
          success: '#35D6A0',
          warning: '#F5C66B',
          danger: '#FF718A',
          text: '#F4F2FF',
          muted: '#A6A4C3',
          subtle: '#6E6B94',
          border: 'rgba(160, 140, 255, 0.16)',
          borderHover: 'rgba(160, 140, 255, 0.36)',
        },
      },
      boxShadow: {
        'glow-purple': '0 0 20px -3px rgba(152, 117, 255, 0.35)',
        'glow-violet': '0 0 25px -3px rgba(121, 87, 232, 0.45)',
        'glow-cyan': '0 0 20px -3px rgba(66, 217, 232, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'card': '0 4px 20px 0 rgba(8, 8, 23, 0.65)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'radial-gradient': 'radial-gradient(circle at 50% 0%, rgba(121, 87, 232, 0.15) 0%, rgba(8, 8, 23, 0) 70%)',
        'ambient-purple': 'radial-gradient(800px circle at 80% 20%, rgba(152, 117, 255, 0.08), transparent 60%), radial-gradient(600px circle at 20% 80%, rgba(66, 217, 232, 0.06), transparent 50%)',
      }
    },
  },
  plugins: [],
}

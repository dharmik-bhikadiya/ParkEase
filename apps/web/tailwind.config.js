/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parkease: {
          bg: '#F7F9F5',
          card: '#FFFFFF',
          primary: '#72C98B',
          'primary-hover': '#5CB976',
          dark: '#176B4D',
          soft: '#E8F6EC',
          text: '#18342A',
          muted: '#58746B',
          border: '#E1E9E3',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(23, 107, 77, 0.04)',
        'soft-md': '0 8px 24px rgba(23, 107, 77, 0.06)',
        'soft-lg': '0 16px 36px rgba(23, 107, 77, 0.08)',
        'glow': '0 0 20px rgba(114, 201, 139, 0.35)',
      },
    },
  },
  plugins: [],
}

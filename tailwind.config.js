import colors from 'tailwindcss/colors';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: colors.white,
        card: colors.white,
        cardBorder: '#bcc3ac'
      }
    }
  },
  plugins: [],
}

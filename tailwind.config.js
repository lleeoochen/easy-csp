import colors from 'tailwindcss/colors';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#4abce3',
        'btn-background': colors.white,
        card: colors.white,
        cardHeader: '#96d7b3'
      }
    }
  },
  plugins: [],
}

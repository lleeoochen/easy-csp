import colors from 'tailwindcss/colors';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'background': '#2b91ba',
        'btn-background': colors.white,
        'card': colors.white,
        'primary-bg': '#2e6d9c',
        'primary-fg': colors.white,
        'secondary-bg': colors.gray['300'],
        'secondary-fg': colors.black,
      }
    }
  },
  plugins: [],
}

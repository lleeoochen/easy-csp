import colors from 'tailwindcss/colors';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'background': 'var(--color-background)',
        'btn-background': colors.white,
        'card': colors.white,
        'primary-bg': 'var(--color-primary-bg)',
        'primary-fg': 'var(--color-primary-fg)',
        'secondary-bg': 'var(--color-secondary-bg)',
        'secondary-fg': 'var(--color-secondary-fg)',
        'tabs-bar-bg': 'var(--color-tabs-bar-bg)',
        'tabs-bar-fg': 'var(--color-tabs-bar-fg)',
        'tabs-bar-active-bg': 'var(--color-tabs-bar-active-bg)',
        'tabs-bar-active-fg': 'var(--color-tabs-bar-active-fg)',
      },
      width: {
        'fill': 'fill-available',
        'webkit-fill': '-webkit-fill-available',
        'moz-fill': '-moz-available',
      },
      height: {
        'fill': 'fill-available',
        'webkit-fill': '-webkit-fill-available',
        'moz-fill': '-moz-available',
      },
    }
  },
  plugins: [],
}

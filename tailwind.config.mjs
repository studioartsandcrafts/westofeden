/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		fontFamily: {
			'sans': ['"Archivo Narrow"', 'Arial Narrow', 'Arial', 'sans-serif'],
			'serif': ['"Charter"', 'Georgia', 'serif'],

		},
		extend: {
			colors: {
				'fg': 'var(--c-fg)',
				'bg': 'var(--c-bg)'
			}
		},
	},
	plugins: [],
}

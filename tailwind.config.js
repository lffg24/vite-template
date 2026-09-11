/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
	container: {
		center: true,
		padding: '2rem',
		screens: {
			'2xl': '1400px'
		}
	},
	extend: {
		colors: {
			/* Espacio de nombres ADITIVO. No se toca ninguna clave existente:
			   `bg-primary` sigue siendo el gris de ShadCN.

			   Los valores viven en `index.css` y son los de la casa: violeta
			   sobre lienzo slate, los mismos que Psicosocial escribe a mano en
			   su marcado. Este namespace es lo que permite que manana se migre
			   el resto sin tocar pantalla por pantalla. */
			rel: {
				primary: {
					DEFAULT: 'hsl(var(--rel-primary))',
					foreground: 'hsl(var(--rel-primary-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--rel-accent))',
					subtle: 'hsl(var(--rel-accent-subtle))'
				},
				turquoise: {
					DEFAULT: 'hsl(var(--rel-turquoise))',
					foreground: 'hsl(var(--rel-turquoise-foreground))'
				},
				sky: {
					DEFAULT: 'hsl(var(--rel-sky))',
					foreground: 'hsl(var(--rel-sky-foreground))'
				},
				dark: 'hsl(var(--rel-dark))',
				canvas: 'hsl(var(--rel-canvas))',
				surface: {
					DEFAULT: 'hsl(var(--rel-surface))',
					subtle: 'hsl(var(--rel-surface-subtle))'
				},
				border: {
					DEFAULT: 'hsl(var(--rel-border))',
					strong: 'hsl(var(--rel-border-strong))'
				},
				muted: 'hsl(var(--rel-muted-foreground))',
				success: {
					DEFAULT: 'hsl(var(--rel-success))',
					foreground: 'hsl(var(--rel-success-foreground))',
					subtle: 'hsl(var(--rel-success-subtle))'
				},
				info: {
					DEFAULT: 'hsl(var(--rel-info))',
					foreground: 'hsl(var(--rel-info-foreground))',
					subtle: 'hsl(var(--rel-info-subtle))'
				},
				warning: {
					DEFAULT: 'hsl(var(--rel-warning))',
					foreground: 'hsl(var(--rel-warning-foreground))',
					subtle: 'hsl(var(--rel-warning-subtle))'
				},
				danger: {
					DEFAULT: 'hsl(var(--rel-danger))',
					foreground: 'hsl(var(--rel-danger-foreground))',
					subtle: 'hsl(var(--rel-danger-subtle))'
				},
				neutral: {
					DEFAULT: 'hsl(var(--rel-neutral))',
					subtle: 'hsl(var(--rel-neutral-subtle))'
				}
			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			}
		},
		fontFamily: {
			'rel-heading': 'var(--rel-font-heading)',
			'rel-body': 'var(--rel-font-body)'
		},
		transitionDuration: {
			'rel-micro': 'var(--rel-motion-micro)',
			'rel-panel': 'var(--rel-motion-panel)',
			'rel-context': 'var(--rel-motion-context)'
		},
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)',
			'rel-control': 'var(--rel-radius-control)',
			'rel-card': 'var(--rel-radius-card)',
			'rel-panel': 'var(--rel-radius-panel)'
		},
		keyframes: {
			'accordion-down': {
				from: {
					height: 0
				},
				to: {
					height: 'var(--radix-accordion-content-height)'
				}
			},
			'accordion-up': {
				from: {
					height: 'var(--radix-accordion-content-height)'
				},
				to: {
					height: 0
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out'
		}
	}
  },
  plugins: [require("tailwindcss-animate")],
};

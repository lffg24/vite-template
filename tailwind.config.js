/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      /* `transitionDuration` estaba declarado aqui Y mas abajo, en este mismo
         objeto. En JavaScript la segunda clave gana, asi que las tres
         duraciones `rel-*` nunca llegaron a generarse: las siete clases
         `duration-rel-micro|panel|context` repartidas por CX y Capacitaciones
         caian al valor por defecto sin que nada fallara. Estan unificadas mas
         abajo, en una sola declaracion. */
      fontFamily: {
        'rel-heading': 'var(--rel-font-heading)',
        'rel-body': 'var(--rel-font-body)',
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
			/* Espacio de nombres ADITIVO. No toca ninguna clave existente:
			   `bg-primary` sigue siendo el de la casa.

			   Los valores viven en `index.css` y REPITEN los tokens de marca,
			   no proponen ninguno. Existe para que Capacitaciones consuma el
			   sistema sin tocar las clases que ya usan las pantallas hechas.  */
			rel: {
				primary: {
					DEFAULT: 'hsl(var(--rel-primary))',
					foreground: 'hsl(var(--rel-primary-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--rel-accent))',
					ink: 'hsl(var(--rel-accent-ink))',
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

        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        input: "hsl(var(--input))",
        "input-focus": "hsl(var(--input-focus))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "foreground-soft": "hsl(var(--foreground-soft))",
        surface: "hsl(var(--surface))",
        "surface-subtle": "hsl(var(--surface-subtle))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        overlay: "hsl(var(--overlay))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          /* La marca cuando hace de TEXTO sobre superficie clara. Ver la nota
             larga de `--primary` en `index.css`. */
          ink: "hsl(var(--primary-ink))",
          hover: "hsl(var(--primary-hover))",
          active: "hsl(var(--primary-active))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          subtle: "hsl(var(--info-subtle))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          subtle: "hsl(var(--success-subtle))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          subtle: "hsl(var(--warning-subtle))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
          subtle: "hsl(var(--danger-subtle))",
        },
        risk: {
          none: "hsl(var(--risk-none))",
          low: "hsl(var(--risk-low))",
          medium: "hsl(var(--risk-medium))",
          high: "hsl(var(--risk-high))",
          "very-high": "hsl(var(--risk-very-high))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          primary: "hsl(var(--brand-primary))",
          turquoise: "hsl(var(--brand-turquoise))",
          sky: "hsl(var(--brand-sky))",
          dark: "hsl(var(--brand-dark))",
          canvas: "hsl(var(--brand-canvas))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          muted: "hsl(var(--sidebar-muted))",
          hover: "hsl(var(--sidebar-hover))",
          active: "hsl(var(--sidebar-active))",
          "active-foreground": "hsl(var(--sidebar-active-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        'rel-control': 'var(--rel-radius-control)',
        'rel-card': 'var(--rel-radius-card)',
        'rel-panel': 'var(--rel-radius-panel)',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        floating: "var(--shadow-floating)",
        "rel-card": "var(--rel-shadow-card)",
        "rel-soft": "var(--rel-shadow-soft)",
        "rel-floating": "var(--rel-shadow-floating)",
      },
      /* Las seis duraciones en una sola clave. Ver la nota del principio de
         `extend`: estaban en dos declaraciones y la segunda borraba a la
         primera. */
      backgroundImage: {
        /* El degradado de marca, UNA vez.
           Los tres botones de las pantallas de acceso llevaban cada uno el
           suyo, y los tres recorrian demasiada distancia: uno iba del turquesa
           al azul marino, y sobre un degradado asi NINGUN color de texto pasa
           el contraste de punta a punta —blanco se pierde en el extremo claro,
           oscuro se pierde en el oscuro—. No era un defecto de un boton: era
           un degradado mal elegido, repetido tres veces.
           Los tres pasos de este se quedan dentro de la misma banda de
           luminosidad, asi que el texto oscuro se lee en todo el recorrido
           (5,6:1 en el peor punto). */
        marca:
          "linear-gradient(90deg, hsl(var(--primary-hover)) 0%, hsl(var(--primary)) 55%, hsl(var(--brand-sky)) 100%)",
      },
      transitionDuration: {
        /* `DEFAULT` es el cambio con mas alcance de todo el sistema de
           movimiento: hay 180 sitios que escriben `transition` a secas, y
           Tailwind les daba 150 ms con la curva `ease`, que arranca y frena
           igual. Eso es exactamente lo que se percibe como «plano» o
           «barato». Con esto, esos 180 sitios pasan a la curva de la casa
           sin tocar ni uno. */
        DEFAULT: "var(--motion-enter)",
        press: "var(--motion-press)",
        exit: "var(--motion-exit)",
        enter: "var(--motion-enter)",
        context: "var(--motion-context)",
        attention: "var(--motion-attention)",
        fast: "var(--motion-fast)",
        standard: "var(--motion-standard)",
        slow: "var(--motion-slow)",
        "rel-micro": "var(--rel-motion-micro)",
        "rel-panel": "var(--rel-motion-panel)",
        "rel-context": "var(--rel-motion-context)",
      },
      /* Curvas de salida. Sin esto, toda transicion usa `ease` y se percibe
         plana; ver la nota de `--rel-ease-*` en `index.css`. */
      transitionTimingFunction: {
        /* Misma idea que la duracion por defecto: `ease-out` sale deprisa y
           aterriza despacio, que es como se mueven las cosas reales. `ease`
           no, y por eso se nota. */
        DEFAULT: "var(--rel-ease-out)",
        "rel-out": "var(--rel-ease-out)",
        "rel-inout": "var(--rel-ease-inout)",
        "rel-spring": "var(--rel-ease-spring)",
      },
      keyframes: {
        /* Entrada estandar: sube 8 px y aparece. Los 8 px no son decorativos
           — son los que hacen que el ojo lea «esto acaba de llegar» en vez de
           «esto parpadeo». Mas recorrido y el bloque se arrastra. */
        entrada: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /* El barrido del esqueleto. Un esqueleto quieto se lee como roto; uno
           que recorre se lee como «en camino». */
        barrido: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        "accordion-down": {
          from: {
            height: 0,
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: 0,
          },
        },
      },
      animation: {
        entrada: "entrada var(--motion-enter) var(--rel-ease-out) both",
        barrido: "barrido 1.6s var(--rel-ease-inout) infinite",
        "accordion-down": "accordion-down var(--motion-enter) var(--rel-ease-out)",
        "accordion-up": "accordion-up var(--motion-exit) var(--rel-ease-out)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

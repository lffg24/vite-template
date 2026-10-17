# Ilustraciones compartidas · preparación del release móvil Psicosocial

Este directorio adapta el sistema de ilustraciones de la rama de Capacitaciones
al tema semántico de `main`. El registro tipado concentra los recursos aprobados;
`Illustration` controla tamaño, proporción, carga y texto alternativo. Las
composiciones de estado vacío, cabecera y formulario usan el mismo registro.

Las tres escenas WebP iniciales (`buscar`, `alerta` y `archivos-informacion`)
proceden del conjunto de Capacitaciones. `recuperacionAcceso` registra la imagen
que ya existe en producción. Las escenas se importan desde el registro para que
Vite las cargue con el fragmento que las usa, y no se copió todo el catálogo de
Capacitaciones. No hay ilustraciones conectadas aún a pantallas de Psicosocial.

Al definir cada pantalla:

1. Identificar rol, tarea y estado real (vacío, sin resultados, error, permiso,
   éxito). Elegir una escena que aclare el estado sin sustituir el mensaje.
2. Registrar la escena aprobada con un nombre estable en
   `illustration.registry.ts`. Mantener WebP optimizado con transparencia cuando
   el recurso fuente lo permita; evitar rutas de imagen repetidas en páginas.
3. Usar `Illustration` directamente o una composición compartida. Una escena
   decorativa lleva `alt=""`; si aporta información, usar `decorative={false}` y
   una descripción breve. Reservar `priority` para la imagen principal visible.
4. En móvil, dejar la acción tras el texto, conservar objetivos táctiles y usar
   el espacio seguro inferior en sheets. Validar 360, 390, 768 y 1280 px, teclado
   y lector de pantalla.
5. Mantener los colores oficiales de riesgo en resultados y gráficos: el color
   de una ilustración no comunica nivel de riesgo.

No se ha definido todavía el recorrido móvil ni las pantallas del primer
incremento; los componentes quedan disponibles para esa decisión.

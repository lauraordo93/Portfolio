# Portfolio personal - Laura Ordóñez

Portfolio personal desarrollado con **HTML, CSS y JavaScript**, enfocado en presentar mi perfil como **Desarrolladora Full Stack**, mi experiencia profesional en **Reservator S.L.** (plataforma ReservatorStore), mi stack tecnológico y mis proyectos académicos.

Es una web estática, sin dependencias de compilación, compatible con GitHub Pages.

## Diseño

Dirección visual "modo developer nocturno":

- Fondo oscuro `#0C0F11`, cian `#00BCD4` como color de acción y naranja `#FF9412` como acento.
- Tipografías: **Orbitron** (nombre y títulos de sección), **Fira Sans** (texto) y **Fira Code** (etiquetas y detalles técnicos).
- Todos los colores, radios y espaciados están definidos como variables CSS al principio de `css/styles.css`.
- **Modo claro y oscuro**: botón en la barra de navegación. Se recuerda la elección de cada visitante y, si no ha elegido, se usa la preferencia de su sistema. El hero mantiene siempre la paleta oscura.

## Secciones

- **Inicio**: foto, nombre, rol, stack principal y accesos a proyectos, CV, GitHub y LinkedIn.
- **01 · Sobre mí**: presentación, áreas destacadas y datos rápidos.
- **02 · Tech Stack**: presentado como un archivo `stack.js` en una ventana de editor, con números de línea, colores de sintaxis y los logos de cada tecnología.
- **03 · Experiencia y formación**: timeline con Reservator S.L. y la formación DAM.
- **04 · Proyectos destacados**: web oficial del saxofonista Carlos Ordóñez (carlosordonezmusic.es, MVC y SEO) y Gestor de Persistencia Multi-Formato.
- **05 · Servicios**: desarrollo de páginas web a medida, forma de trabajo y petición de presupuesto.
- **06 · Contacto**: formulario que llega a laura.ordonez.dev@gmail.com (FormSubmit), correo con botón de copiar, redes y descarga del CV.

## Pantalla de inicio

Al entrar en la web aparece una pantalla de arranque estilo BIOS que, al terminar, deja elegir a dónde ir: INTRO (portfolio), P (proyectos), S (servicios) o C (contacto), con el teclado o pulsando las opciones. Se muestra una vez por visita (sessionStorage) y no aparece si se llega con un enlace a una sección (por ejemplo `#contacto`). Para volver a verla, abre la web en una pestaña nueva o de incógnito.

## Secreto

Si alguien teclea el código Konami (↑ ↑ ↓ ↓ ← → ← → B A), o toca 5 veces seguidas el icono `</>` del logo en móvil, aparece una caja de diálogo estilo RPG de 16 bits con un mensaje y un acceso al formulario de contacto. Se cierra con Escape o con el botón "Cerrar".

## Animaciones

- Entrada escalonada del hero y nombre que se "decodifica" al cargar.
- Tarjetas que aparecen en cascada al hacer scroll.
- Línea del timeline que se dibuja al bajar y puntos que se iluminan.
- Brillo cian que sigue al ratón en las tarjetas (solo ordenador).
- Cambio de tema con efecto círculo desde el interruptor (View Transitions API; en otros navegadores cambia directamente).
- Check animado al enviar el formulario.
- Escaparate de la web de Carlos: un móvil con la página completa (`img/webCarlos-movil.webp`) que se recorre al pasar el ratón, o solo mientras está en pantalla en dispositivos táctiles. Si la web de Carlos cambia, sustituye esa imagen por una captura nueva de página completa.

Todas se desactivan con `prefers-reduced-motion`.

## Accesibilidad y rendimiento

- Contraste AA en textos y botones (texto oscuro sobre cian).
- Estados `:focus-visible` en todos los elementos interactivos y enlace "Saltar al contenido".
- Menú móvil con `aria-expanded`, cierre con Escape y al pulsar fuera.
- Zonas táctiles de al menos 44 px.
- `prefers-reduced-motion`: desactiva animaciones, transiciones y partículas.
- Los vídeos de YouTube se cargan solo al pulsar (miniatura + iframe bajo demanda).

## Tecnologías utilizadas en el proyecto

- HTML5, CSS3 y JavaScript
- Intersection Observer API
- Particles.js
- Font Awesome
- Google Fonts
- Devicon

## Estructura del proyecto

```text
Portfolio/
|-- css/
|   `-- styles.css
|-- documentos/
|   `-- CV_Laura Ordonez.pdf
|-- img/
|   |-- laura_mejorada.jpg
|   |-- webCarlos.png
|   `-- ...
|-- js/
|   |-- animaciones.js  # nombre que se decodifica, timeline y brillo en tarjetas
|   |-- contacto.js     # envío del formulario con FormSubmit
|   |-- inicio.js       # pantalla de inicio estilo BIOS
|   |-- menuPort.js     # menú móvil, header al hacer scroll y enlace activo
|   |-- particles.js    # fondo de partículas sutil
|   |-- proyectos.js    # vídeos bajo demanda y botón de copiar correo
|   |-- secreto.js      # easter egg: código Konami y caja de diálogo RPG
|   |-- reveal.js       # aparición suave de bloques al hacer scroll
|   `-- tema.js         # botón de modo claro / oscuro
|-- 404.html            # página de error con el diseño del portfolio
|-- index.html
|-- privacidad.html    # política de privacidad (RGPD)
|-- aviso-legal.html   # aviso legal (LSSI)
|-- robots.txt
|-- site.webmanifest
|-- sitemap.xml
`-- README.md
```

## Cómo ejecutar el proyecto

1. Clona o descarga el repositorio.
2. Abre `index.html` en el navegador, o usa **Live Server** en VS Code.

## Despliegue en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub.
2. Entra en `Settings > Pages`.
3. Selecciona la rama principal y la carpeta raíz.
4. Guarda y espera a que GitHub genere la URL pública.

## Contacto

- Email: [laura.ordonez.dev@gmail.com](mailto:laura.ordonez.dev@gmail.com)
- GitHub: [lauraordo93](https://github.com/lauraordo93)
- LinkedIn: [Laura Ordóñez](https://linkedin.com/in/laura-ordoñez-737532300)

## Privacidad y aviso legal

`aviso-legal.html` recoge los datos del titular, las condiciones de uso y la propiedad intelectual. Si te das de alta como autónoma o cambias de domicilio, actualiza los datos en `aviso-legal.html` y en `privacidad.html`.


`privacidad.html` explica qué datos recoge el formulario, para qué se usan, qué servicios externos intervienen y cómo ejercer los derechos RGPD. Está enlazada desde la casilla del formulario y desde el footer. Revisa el texto si cambias de servicio de formulario, añades estadísticas o cambias el plazo de conservación.

## Formulario de contacto

El formulario usa [FormSubmit](https://formsubmit.co), gratuito y compatible con GitHub Pages.

1. Publica la web y envía un mensaje de prueba desde el formulario.
2. Abre el correo de FormSubmit en laura.ordonez.dev@gmail.com y pulsa **Activate Form**.
3. A partir de ahí, cada mensaje llega directamente al correo.
4. Opcional: FormSubmit te dará una dirección aleatoria; ponla en `FORM_ENDPOINT` (`js/contacto.js`) y en el `action` del formulario para no mostrar tu correo en el código.

## SEO

- Título y descripción optimizados, etiquetas Open Graph y Twitter (tarjeta con imagen al compartir el enlace).
- Datos estructurados JSON-LD (`Person` y `WebSite`) para que Google entienda quién eres y qué haces.
- `sitemap.xml` con la URL del portfolio.
- Imágenes en WebP con alternativa JPG/PNG, precarga de la foto del hero y favicon ligero en SVG/PNG.
- `robots.txt` preparado: Google solo lo lee en la raíz del dominio, así que se activará cuando uses un dominio propio.

### Alta en Google Search Console

1. Entra en https://search.google.com/search-console y añade una propiedad de tipo **Prefijo de URL** con `https://lauraordo93.github.io/Portfolio/`.
2. Verifica con el método **Etiqueta HTML**: copia el código, descomenta la línea `google-site-verification` del `<head>` de `index.html`, pega el código, sube el cambio y pulsa **Verificar**.
3. En **Sitemaps**, envía `sitemap.xml`.
4. En **Inspección de URLs**, pega la URL del portfolio y pulsa **Solicitar indexación**.

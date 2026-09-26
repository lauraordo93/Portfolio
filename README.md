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
- **02 · Tech Stack**: tecnologías agrupadas en Frontend, Backend, Bases de datos y Herramientas.
- **03 · Experiencia y formación**: timeline con Reservator S.L. y la formación DAM.
- **04 · Proyectos destacados**: web oficial del saxofonista Carlos Ordóñez (carlosordonezmusic.es, MVC y SEO) y Gestor de Persistencia Multi-Formato.
- **05 · Servicios**: desarrollo de páginas web a medida, forma de trabajo y petición de presupuesto.
- **06 · Contacto**: formulario que llega a laura.ordonez.dev@gmail.com (FormSubmit), correo con botón de copiar, redes y descarga del CV.

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
|   |-- contacto.js     # envío del formulario con FormSubmit
|   |-- menuPort.js     # menú móvil, header al hacer scroll y enlace activo
|   |-- particles.js    # fondo de partículas sutil
|   |-- proyectos.js    # vídeos bajo demanda y botón de copiar correo
|   |-- reveal.js       # aparición suave de bloques al hacer scroll
|   `-- tema.js         # botón de modo claro / oscuro
|-- 404.html            # página de error con el diseño del portfolio
|-- index.html
|-- privacidad.html    # política de privacidad (RGPD)
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

## Privacidad

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

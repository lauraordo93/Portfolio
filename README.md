# Portfolio personal - Laura Ordóñez

Portfolio personal desarrollado con **HTML, CSS y JavaScript**, enfocado en presentar mi perfil como **Desarrolladora Full Stack Junior**, mi experiencia profesional en **Reservator S.L.** (plataforma ReservatorStore), mi stack tecnológico y mis proyectos académicos.

Es una web estática, sin dependencias de compilación, compatible con GitHub Pages.

## Diseño

Dirección visual "modo developer nocturno":

- Fondo oscuro `#0C0F11`, cian `#00BCD4` como color de acción y naranja `#FF9412` como acento.
- Tipografías: **Orbitron** (nombre y títulos de sección), **Fira Sans** (texto) y **Fira Code** (etiquetas y detalles técnicos).
- Todos los colores, radios y espaciados están definidos como variables CSS al principio de `css/styles.css`.

## Secciones

- **Inicio**: foto, nombre, rol, stack principal y accesos a proyectos, CV, GitHub y LinkedIn.
- **01 · Sobre mí**: presentación, áreas destacadas y datos rápidos.
- **02 · Tech Stack**: tecnologías agrupadas en Frontend, Backend, Bases de datos y Herramientas.
- **03 · Experiencia y formación**: timeline con Reservator S.L. y la formación DAM.
- **04 · Proyectos destacados**: TFG (Página Web Vertical) y Gestor de Persistencia Multi-Formato.
- **05 · Contacto**: correo con botón de copiar, redes y descarga del CV.

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
|   |-- menuPort.js     # menú móvil, header al hacer scroll y enlace activo
|   |-- particles.js    # fondo de partículas sutil
|   |-- proyectos.js    # vídeos bajo demanda y botón de copiar correo
|   `-- reveal.js       # aparición suave de bloques al hacer scroll
|-- index.html
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

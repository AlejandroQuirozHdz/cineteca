# El precio de una mentira · Cine 1BIO1

Página tipo cine para proyectar el cortometraje animado del grupo **1BIO1** sobre ética y responsabilidad social en la inteligencia artificial.
Materia: Comunicación y Habilidades Digitales · Maestra: Ana Rita Ramírez Hernández.

Equipo: ALPIZAR REYES YAMILET LEYNADI · CHAVEZ GUERRERO BRIANA DANAE · GOMEZ SANCHEZ YATZIRI DANIELA · QUIROZ HERNÁNDEZ ESTRELLA MICHEL.

**Página publicada:** <https://alejandroquirozhdz.github.io/cineteca/>

## Qué hay en el repositorio

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página: marquesina, boleto, sala con telón, programa, frases, reparto y guion |
| `css/cine.css` | Estilos (adaptados a celular, tableta y computadora) |
| `js/cine.js` | Reproductor (telón, cuenta regresiva, controles, atajos) y guion interactivo |
| `js/datos.js` | Escenas y diálogo con tiempos, sacados del guion de la caricatura |
| `video/el-precio-de-una-mentira.mp4` | La película: caricatura animada, 8:00 exactos, 1920×1080 |
| `img/` | Póster, escenas, retratos de los personajes, imagen para compartir y favicon |
| `.nojekyll` | Le dice a GitHub Pages que publique los archivos tal cual |

## Encender la página (solo la primera vez)

En el repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**.
En uno o dos minutos queda en <https://alejandroquirozhdz.github.io/cineteca/>.

## Cambiar algo y volver a subir

El video pesa más de 25 MB. La página de GitHub no acepta archivos de más de 25 MB cuando los arrastras al navegador, así que los cambios se suben con **GitHub Desktop** o con la **terminal** (límite de 100 MB por archivo):

```bash
cd cineteca
git add .
git commit -m "Describe el cambio"
git push
```

## Verla en tu computadora

Doble clic en `index.html` funciona. El resplandor de color alrededor de la pantalla solo aparece en la página publicada (los navegadores lo bloquean en archivos locales).

## Cómo se usa

- **Cortar y entrar** (en el boleto) o **Comenzar la función**: se apagan las luces, se abre el telón, cuenta regresiva y empieza la película.
- **Programa de mano**, **Frases**, **Reparto** y **Guion**: cualquier escena, frase o nombre lleva a ese momento de la película.
- Atajos con la sala a la vista: `Espacio` o `K` reproducir/pausar · `F` pantalla completa · `M` silencio · `L` luces de la sala · `←` `→` cinco segundos.

## Transparencia

El guion en diálogo, las voces de los personajes y la animación se hicieron con inteligencia artificial, como pedía la tarea. Las decisiones, la revisión y la responsabilidad de lo que dice son del equipo. La nota completa está al final de la página.

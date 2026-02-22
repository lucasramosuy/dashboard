# OAT_DOCS.md – Guía de Referencia UI (Oat UI)

Este documento sirve como referencia técnica para que **Gemini** genere interfaces coherentes con el sistema de diseño de **Oat**.

---

## 1. Principio Fundamental

Oat estiliza elementos HTML nativos mediante selectores globales.
**No se deben añadir clases** a menos que sea estrictamente necesario para *layout* o estados específicos.

---

## 2. Estructura de Layout (Astro + Oat)

Para un dashboard con sidebar, usar la siguiente estructura semántica:

```html
<body data-theme="light">
  <header class="oat-header">
    <nav>
      <strong>Dashboard</strong>
      <ul>
        <li><a href="/">Inicio</a></li>
      </ul>
    </nav>
  </header>

  <main class="oat-container">
    <aside>
      <nav>
        <ul>
          <li><a href="/subjects">Materias</a></li>
          <li><a href="/tasks">Tareas</a></li>
        </ul>
      </nav>
    </aside>

    <section>
      <h1>Título de la Página</h1>
    </section>
  </main>
</body>
```

## 3. Componentes Comunes

Tarjetas (Cards)
Oat usa <article> para representar contenedores con sombra y padding.

```html
<article>
  <header>Título de la Tarjeta</header>
  <p>Contenido descriptivo de la materia o tarea.</p>
  <footer>Acciones o metadata</footer>
</article>
```

```html
Formularios
No usar clases en inputs. Oat los captura por su tipo.

```html
<form>
  <label for="name">Nombre</label>
  <input type="text" id="name" name="name" placeholder="Ej: Matemática" required />

  <label for="status">Estado</label>
  <select id="status">
    <option value="todo">Pendiente</option>
    <option value="done">Completada</option>
  </select>

  <button type="submit">Guardar</button>
</form>
```

Badges y Estados (Custom)

Como Oat es limitado en badges, usamos clases propias definidas en theme.css:

.oat-badge-success: Verde (Normal)

.oat-badge-warning: Amarillo (Alerta)

.oat-badge-danger: Rojo (Peligro)

## 4. Variables CSS (Theming)

Para ajustes finos en componentes React, usar estas variables:

```html
css
--oat-color-bg: Fondo principal;
--oat-color-fg: Color de texto;
--oat-color-accent: Color de marca / botones principales;
--oat-border-radius: Generalmente 4px o 8px;
```

## 5. Interactividad (Oat JS)

Oat maneja diálogos nativos. Para abrir un modal:

```html
javascript
// En React o JS nativo
const dialog = document.querySelector('dialog');
dialog.showModal();
```

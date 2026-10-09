# Entorno de Claude para New store (skills y herramientas)

Este archivo lo lee Claude en otra máquina para reproducir el entorno usado en este proyecto.
**Instrucción para Claude:** ejecuta los pasos de abajo en orden, desde la raíz del proyecto (la carpeta donde clonaste este repo o su carpeta padre). No pidas ni escribas claves API; las pone el usuario.

## 1. Skills de proyecto (carpeta `.claude/skills` del proyecto)

Instalación con el CLI `skills` (requiere Node.js):

```bash
npx --yes skills add Leonxlnx/taste-skill --yes
npx --yes skills add nextlevelbuilder/ui-ux-pro-max-skill --yes
npx --yes skills add vercel-labs/agent-skills --skill web-design-guidelines --yes
```

Skills resultantes y su origen (repo GitHub → ruta):

| Skill | Origen |
|---|---|
| brandkit | Leonxlnx/taste-skill → skills/brandkit |
| design-taste-frontend | Leonxlnx/taste-skill → skills/taste-skill |
| design-taste-frontend-v1 | Leonxlnx/taste-skill → skills/taste-skill-v1 |
| full-output-enforcement | Leonxlnx/taste-skill → skills/output-skill |
| gpt-taste | Leonxlnx/taste-skill → skills/gpt-tasteskill |
| high-end-visual-design | Leonxlnx/taste-skill → skills/soft-skill |
| image-to-code | Leonxlnx/taste-skill → skills/image-to-code-skill |
| imagegen-frontend-mobile | Leonxlnx/taste-skill → skills/imagegen-frontend-mobile |
| imagegen-frontend-web | Leonxlnx/taste-skill → skills/imagegen-frontend-web |
| industrial-brutalist-ui | Leonxlnx/taste-skill → skills/brutalist-skill |
| minimalist-ui | Leonxlnx/taste-skill → skills/minimalist-skill |
| redesign-existing-projects | Leonxlnx/taste-skill → skills/redesign-skill |
| stitch-design-taste | Leonxlnx/taste-skill → skills/stitch-skill |
| banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max | nextlevelbuilder/ui-ux-pro-max-skill → .claude/skills/<nombre> |
| web-design-guidelines | vercel-labs/agent-skills → skills/web-design-guidelines |
| playwright-cli | skill de Playwright CLI (`npm i -g @playwright/cli`; instalar su skill con `playwright-cli install --skills` si está disponible) |

## 2. Skills de usuario (carpeta `~/.claude/skills`)

- **design-loop**: skill propia, incluida en este repo en `claude-setup/skills/design-loop/SKILL.md`. Copiar a `~/.claude/skills/design-loop/SKILL.md`.
- **graphify**: instalar el paquete y su skill:
  ```bash
  uv tool install graphifyy      # o: pipx install graphifyy / pip install graphifyy
  graphify install               # copia el skill a ~/.claude/skills/graphify (versión usada: 0.9.50)
  ```
  Añadir a `~/.claude/CLAUDE.md`: `- **graphify** (~/.claude/skills/graphify/SKILL.md) - any input to knowledge graph. Trigger: /graphify`
- **ui-ux-pro-max** (plugin), en Claude Code:
  ```
  /plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
  /plugin install ui-ux-pro-max@ui-ux-pro-max-skill
  ```
  (versión usada: 2.5.0)

## 3. Servidores MCP (herramientas)

```bash
claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp
claude mcp add --transport http --scope user higgsfield https://mcp.higgsfield.ai/mcp
claude mcp add --transport http --scope user stitch https://stitch.googleapis.com/mcp --header "X-Goog-Api-Key: <TU_CLAVE_DE_STITCH>"
```

- `figma` y `higgsfield` piden autorización OAuth la primera vez (el usuario la hace en `/mcp`).
- `stitch` necesita una API key de Google Stitch **propia** (no está en el repo a propósito). Los diseños del proyecto están en el proyecto "New store" de Stitch; los enlaces privados requieren la cuenta propietaria en Chrome.

## 4. Plugins / integraciones de la app

- Claude in Chrome (extensión de Chrome) para abrir los diseños de Stitch con la sesión del usuario.
- Plugin `figma` (skills `figma-use`, `figma-generate-design`, etc.) desde el marketplace `claude-plugins-official` (`/plugin install figma@claude-plugins-official`).

## 5. Ejecutar el sitio

Sitio estático en esta carpeta (`lab-lab`). Las subpáginas se generan con:

```bash
node build.mjs
```

Previsualizar con cualquier servidor estático (p. ej. `npx serve .`). Publicado en GitHub Pages: https://annnnndy0.github.io/new-store/

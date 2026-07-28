---
target: columna derecha de /tool (resultados + export) y paginado del centro
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-07-28T05-02-42Z
slug: src-app-tool-page-tsx
---
Method: dual-agent (A: a62e7354f31c24f8c · B: a56fdaf10b4c117f2)

## Puntaje de salud de diseño (heurísticas de Nielsen)

| # | Heurística | Score | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Cantidad de resultados y posición de página se muestran bien |
| 2 | Sistema ↔ mundo real | 2 | Mezcla de español (paginador, checkbox, placeholder) e inglés (labels de dominio) en la misma vista |
| 3 | Control y libertad | 3 | Prev/Next funciona; sin salto directo a página en listas de 6+ páginas |
| 4 | Consistencia | 3 | El mismo Pager en ambas columnas — bien; roto por la mezcla de idioma |
| 5 | Prevención de errores | 3 | Estados disabled del query razonables |
| 6 | Reconocer > recordar | 3 | Selección cruzada lista↔documento bien resuelta |
| 7 | Flexibilidad y eficiencia | 1 | Sin paginado por teclado, sin filtro "solo truncados" |
| 8 | Estética minimalista | 1 | Columna de 340px con rank+chunk+offset+badge+barra+score en ~300px fuerza wrap de 2-3 líneas |
| 9 | Recuperación de errores | 3 | QueryError presente |
| 10 | Ayuda y documentación | 2 | Único canal de ayuda es un tooltip nativo en "truncated" |

**Total: 24/40 — Aceptable**, débil específicamente en eficiencia y minimalismo.

## Veredicto de especificidad de diseño

La cáscara de tres columnas, los paneles `panel-inset-bg`, la barra-de-hilo como score y la aguja como marcador de selección sí están autorados para Aguja — ningún otro producto llegaría a "score = tensión de hilo". Pero el paginador en sí (Anterior/Siguiente + "página X de Y", bordes planos) es chrome de tabla admin genérico que ignora el propio vocabulario de DESIGN.md (controles segmentados `rounded.full`, motivo de hilo/puntada ya usado en los boundaries). Más importante: el modelo de layout de fondo — un panel que scrollea como página entera en vez de una "pantalla" de instrumento con scroll interno acotado — no está especificado en ningún lado de DESIGN.md, y es justamente lo que está fallando acá.

**Escaneo determinístico (detect.mjs):** exit 0, sin hallazgos (`[]`) sobre los 4 archivos tocados. Ningún falso positivo que reportar porque no hubo positivos.

**Evidencia de navegador:** con un documento de 45.189 caracteres a tamaño de chunk 100 (452 chunks), en viewport 1600×1000:
- El paginador central (`página X de Y`) queda en **y≈11014px** — muy por debajo del fold.
- Con una query real ejecutada (78 resultados), el botón "Download summary image" queda en **y≈1364px** — también fuera del viewport inicial.
- La columna derecha, antes de correr una query, está completamente vacía en el viewport inicial (sin placeholder alguno mientras tanto).

## Carga cognitiva: 3/8 fallos (moderada-alta)

Falla — **Chunking** (5+ piezas de dato por fila en 300px). Falla — **Jerarquía visual** (el score, lo más importante para un debugger, cae a una segunda línea envuelta en vez de quedar escaneable). Falla — **Progressive disclosure** (las 15 filas con toda su metadata se renderizan de una, sin vista resumen). Pasan: foco único, agrupación, una cosa a la vez, elecciones mínimas, memoria de trabajo (la sincronización de selección compensa).

## Viaje emocional

Exportar es el momento peak-end de toda la sesión de debugging — el artefacto que el usuario realmente se lleva. Que quede enterrado debajo de una lista larga y todavía desbordada es exactamente lo opuesto de lo que un buen final de flujo necesita.

## Lo que funciona

1. **Sincronización de selección bidireccional** entre chip de chunk y fila de resultado, calculada durante el render (mismo commit que el click) — prolijo.
2. **Badge de truncamiento inline** con conteo exacto de tokens — sirve directamente la misión de "nunca esconder un fallo" del producto.
3. El componente `Pager` es idéntico entre ambas columnas — consistencia real.

## Problemas prioritarios

- **[P0] Qué:** la columna derecha no tiene altura acotada ni scroll interno — es `flex flex-col gap-6` dentro de un grid, sin límite de alto propio.
  **Por qué importa:** el paginado limitó la *cantidad* de filas, no la *altura* renderizada; con filas que wrappean a 2-3 líneas, 15 resultados ya superan el viewport.
  **Fix:** darle a la columna derecha un alto acotado (`md:h-[calc(100vh-Npx)]`) con `overflow-y-auto` solo en la lista de resultados, dejando ModelStatus/QueryInput/SummaryImage como regiones fijas (`flex-shrink-0`) fuera del scroll.

- **[P0] Qué:** `SummaryImage` depende de la longitud de la lista de arriba.
  **Fix:** moverlo a una posición fija que no dependa de cuántos resultados haya — cerca de ModelStatus/QueryInput arriba, o como pie fijo de la columna.

- **[P1] Qué:** cada fila de resultado no tiene un layout con presupuesto de ancho fijo para rank+chunk+offset+badge antes de que aparezca el score.
  **Por qué importa:** empuja el score fuera de la primera línea visible, invirtiendo la prioridad de escaneo.
  **Fix:** template de fila en dos líneas fijas (línea 1: identidad del chunk, línea 2: score+barra+badge alineados a la derecha), dándole a la paginación una altura de fila predecible.

- **[P1] Qué:** mezcla de español e inglés en la misma vista (paginador/checkbox en español, resultados/badges en inglés).
  **Fix:** unificar a un solo idioma de interfaz.

- **[P2] Qué:** el Pager ignora el motivo de hilo/puntada ya establecido en ChunkedDocument.
  **Fix:** pista de puntos `rounded.full`, relleno violeta en la página activa, ecoando las marcas de boundary de chunk.

## Riesgos por persona

**Riley (stress tester):** 78 resultados es exactamente el caso real que rompió esto; falta ver qué pasa en la página donde *todas* las filas están truncadas (peor caso de wrap), y si seleccionar un resultado de una página lejana realmente hace scroll a la vista o solo actualiza estado fuera de pantalla.

**Sam (accesibilidad):** el tratamiento de foco es solo `hover:border-violet/60` en el Pager y en las filas de resultado, sin `:focus-visible` distintivo — un usuario de teclado tabulando por 15+ controles no tiene indicador claro más allá del default del navegador.

## Observaciones menores

- El `ThreadBar` mide 96px fijos, uno de los elementos más anchos en una columna de 300px — contribuye directamente al wrap.
- La columna derecha no muestra ningún placeholder mientras no hay query — queda completamente en blanco.

## Preguntas para pensar

- ¿Cómo se vería esta columna como una "pantalla" de instrumento de alto fijo con scroll interno, en vez de una página que sigue creciendo?
- ¿Debería "descargar resumen" ser una capacidad persistente del panel, en vez de un pie de lista?
- ¿El paginado resuelve el problema real, o hace falta además un filtro "mostrar solo truncados" para el caso de uso real de debugging de Aguja?

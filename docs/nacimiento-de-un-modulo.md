# Nacimiento de un módulo

Lo que hay que decidir, en orden, para que un módulo exista. Cada punto tiene
**quién lo hace cumplir** — si no hay guard, no es una regla: es una intención.

---

## 1 · La `key`

Corta, sin acentos, en minúscula. `lab`, `compra`, `deposito`.

**Es permanente.** La `key` viaja en el manifiesto, en la tabla `modules`, en
los entitlements, en los eventos, en las URLs de los grants y —desde
UI-0a-bis— **es también el nombre del ícono**. Cambiarla no es un rename: es
partir en dos la identidad de un módulo que ya está en producción.

> **Corolario del ícono:** no hay campo de ícono en el manifiesto. Un segundo
> campo que siempre valdría lo mismo que la `key` es indirección sin
> consumidor. El paquete pone el dibujo; el manifiesto pone la `key`.

**Lo hace cumplir:** `ModuleKey` en `enums.json` — una key que no esté ahí no
compila en ningún repo.

---

## 2 · El rótulo — `nombre_es`

En castellano, como lo lee una persona. **Laboratorio**, no `lab`.

Es lo que aparece en el riel, en el armador y en la landing. La `key` es para
las máquinas; el rótulo es para la gente, y no tienen por qué parecerse.

**Lo hace cumplir:** nada automático. Es revisión humana, y por eso está
escrito acá.

---

## 3 · La clase de negocio — `kind`

**La pregunta no es si el módulo se contrata** —eso es `clase`, y distingue
`comercial` de `plataforma`—. La pregunta es **qué clase de negocio resuelve**.

| | Qué es | Ejemplos | Cuántos tiene una organización |
|---|---|---|---|
| **vertical** | gestión específica de **un tipo de negocio** | `lab`, `vet`, `milk`, `farm`, `taller`, `comercio` | generalmente **uno** |
| **horizontal** | **administración general**, la sirva quien la sirva | `compra`, `factura`, `nucleo`, `talento`, `visibilidad`, `conecta`, `deposito` | **varias** |

En la landing son los **arcos** y las **piezas de puzzle**, y esa diferencia de
aspecto ya existe antes que este campo.

> **Si dudás, probablemente sea vertical.** Los horizontales son administración
> general: un conjunto **casi cerrado**, porque la administración de una
> organización tiene un número acotado de formas. Los verticales van a ser
> **decenas** — hay un vertical por cada tipo de negocio que exista.

**`null` es sólo para `clase: plataforma`.** `foundation` y `padron` no son ni
verticales ni horizontales: son infraestructura siempre encendida, nunca
aparecen en el armador ni en el riel. Ponerles una de las dos sería escribir
algo falso en el contrato para que el tipo quedara más corto.

**Lo hace cumplir:** guard **bidireccional** en `scripts/verify-v0.mjs` —
comercial **exige** valor, plataforma **exige** ausencia. Los dos rojos se
vieron fallar nombrando el módulo.

---

## 4 · El subdominio — `subdomain`

La **etiqueta**, no el host completo: `"lab"`, no `"lab.suynda.com"`. Foundation
compone la URL con su `PLATFORM_BASE_DOMAIN`.

**Por qué la etiqueta y no el host:** el manifiesto lo comparten todos los
entornos. Guardar `lab.suynda.com` metería producción adentro de un contrato
que también usan staging y local.

**`null` cuando el módulo todavía no tiene destino desplegado** — los que en el
armador figuran como «Pronto». Entonces `/v1/shell` devuelve `url: null` y el
riel muestra el módulo **sin enlace**. Un subdominio inventado sería un enlace
roto, que es peor que no tener enlace.

**Lo hace cumplir:** guard en `verify-v0.mjs` — el campo tiene que **estar** en
cada entrada, pudiendo valer `null`. Ausente ≠ `null`: `null` es una
declaración, ausente es un olvido.

---

## 5 · El ícono — en `suynda-ui`, no acá

Un glifo **24×24, de línea, en `currentColor`**, nombrado por la `key`, más su
**marco**: bloque si es vertical, pieza de puzzle si es horizontal.

Vive en el paquete porque **el mismo juego viste el riel, la landing y el
marketing**: un ícono de módulo es identidad de marca, no adorno de una
pantalla. Y por eso su firma es **viendo**, no leyendo.

**El faltante NO se degrada en silencio.** Sin dibujo, B.2-27 muestra un
**placeholder visiblemente roto** —caja punteada con `?`—. Un genérico mudo es
el bug que esto viene a matar: hoy, en el riel de Visibilidad, Compra y Talento
son cuadraditos idénticos.

**Lo hace cumplir:** test en `suynda-ui` — **toda key comercial tiene dibujo**.

---

## 6 · La fila en `modules`

No se escribe a mano. Foundation siembra `modules` desde `MODULES`
(`src/seed/run.ts`), y el manifiesto es la única fuente.

**Lo hace cumplir:** `anti-resurreccion.pgtest` — compara `MODULES` contra la
tabla y falla si alguien editó la fila por afuera.

---

## El resumen, para copiar

| Punto | Dónde vive | Quién lo hace cumplir |
|---|---|---|
| `key` | `enums.json` → `ModuleKey` | el tipo: no compila |
| `nombre_es` | `data/modules.json` | revisión humana |
| `clase` | `data/modules.json` | `ModuleClass` |
| `kind` | `data/modules.json` | guard bidireccional en `verify-v0.mjs` |
| `subdomain` | `data/modules.json` | guard de presencia en `verify-v0.mjs` |
| ícono | `suynda-ui`, por `key` | test «toda key comercial tiene dibujo» |
| fila en `modules` | siembra desde `MODULES` | `anti-resurreccion.pgtest` |

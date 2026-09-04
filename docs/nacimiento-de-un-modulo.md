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

> **Un caso registrado, porque enseña.** Al armar el orden de los horizontales,
> el fundador escribió el ciclo como *«compra, deposito, **venta**, nucleo»* —
> pero el módulo se llama **Factura**. El rótulo nombra **el papel** y él lo
> pensó por **el acto**. Se decidió **conservar Factura**, y la razón es local:
> en Paraguay el papel ES el producto — la factura electrónica, SIFEN. Queda
> anotado para que nadie lo «corrija» más adelante creyendo que fue un
> descuido.

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

## 4-bis · El orden — `orden`

Un entero, **numerado de diez en diez**. Único **dentro de su `kind`**:
verticales y horizontales son dos listas distintas y las dos arrancan en 10.

### Los horizontales tienen tres bloques, y no son siete ítems sueltos

```
compra → deposito → factura → nucleo     el ciclo: entra · se guarda · sale · cierra
talento                                   la gente, que es otro eje
conecta → visibilidad                     lo que habla hacia afuera
```

Los primeros cuatro son **una cadena de causa**: lo que se compra se deposita,
lo que se deposita se vende, y las tres cosas terminan en contabilidad.
`talento` queda solo porque no pertenece a esa cadena ni a la de afuera. Los
dos últimos son los únicos que le hablan a alguien fuera de la organización.

> **EL MÓDULO NUEVO SE UBICA EN SU BLOQUE, NO AL FINAL.** Si nace algo del
> ciclo del negocio, entra entre `nucleo` y `talento` —no después de
> `visibilidad`—. Un orden que se explica deja de explicarse el día que alguien
> agrega al final por comodidad. Los huecos de diez existen justamente para
> que ubicarlo bien no cueste nada.

### Los verticales llevan orden, pero ese orden NO afirma prioridad

**Ningún vertical va antes que otro por razón de negocio** — en el riel casi
siempre hay uno solo, y decidir que Lab «va antes» que Vet sería inventar una
jerarquía que no existe.

Pero donde se los lista juntos —el armador de alta, el marketing— hace falta
**alguna** secuencia estable, y la landing ya publica una desde julio:
`lab · vet · taller · milk · farm · comercio`. Se hereda ésa.

**Es un desempate mecánico heredado, no una decisión nueva.** La casa ya
decidió; no se vuelve a decidir.

### Por qué vive acá y no en cada repo

Si cada consumidor ordena por su cuenta, el hub ordena de una forma,
Visibilidad de otra y Lab de una tercera — la misma deriva que el ícono y el
subdominio vinieron a cerrar. **La plataforma dice QUÉ se muestra y en qué
secuencia; quien pinta decide CÓMO** — riel vertical, barra inferior, franja.

**Lo hace cumplir:** guard en `verify-v0.mjs`, presencia **y unicidad por
`kind`**. El duplicado se chequea porque no rompe nada visible: deja dos
módulos empatados y el desempate lo resuelve el motor de base como quiera —
o sea distinto entre consultas, y el riel se mueve solo entre visitas.

---

## 5 · El ícono — en `suynda-ui`, no acá

Una **silueta maciza**, nombrada por la `key`, pintada por máscara sobre
`currentColor`. En el riel va **pelada, sin marco**: la caja es `B.2-27` y
meterle otro adentro sería un marco dentro de un marco.

**Y el origen depende del `kind`:**

- **Vertical** → el arte aprobado de `4 Brand ID/`, **extraído**, en PNG.
  Motivo separado del arco por componentes conectados. **No se redibuja ni se
  retoca:** si el arte cambia, se vuelve a extraer. Un retoque es un redibujo.
- **Horizontal** → un SVG dibujado para el riel, elegido **por silueta**: en
  una columna que se mira todos los días el ojo busca forma, no lee.

Vive en el paquete porque **el mismo juego viste el riel, la landing y el
marketing**: un ícono de módulo es identidad de marca, no adorno de una
pantalla. Y por eso su firma es **viendo**, no leyendo.

**El faltante NO se degrada en silencio.** Sin dibujo se muestra
`.glifo--sin-dibujo`: caja punteada con `?`. Un genérico mudo es el bug que
esto viene a matar — hoy el hub cablea dos emoji con `?? '▦'` y once módulos
comparten el mismo cuadradito.

**Lo hace cumplir:** `tests/iconos.test.ts` en `suynda-ui`, contra este mismo
manifiesto — toda key comercial tiene dibujo, y **ningún vertical puede
aparecer como SVG**: si aparece, alguien lo redibujó.

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
| `orden` | `data/modules.json` | guard de presencia y unicidad por `kind` |
| ícono | `suynda-ui`, por `key` | test «toda key comercial tiene dibujo» |
| fila en `modules` | siembra desde `MODULES` | `anti-resurreccion.pgtest` |

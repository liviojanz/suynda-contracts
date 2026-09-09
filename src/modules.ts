/**
 * Modules seed — Foundation seeds its `modules` table from data/modules.json.
 * Platform modules (clase = plataforma) never appear in the armador; gate is clase, not a flag.
 */

import modulesData from "../data/modules.json" with { type: "json" };
import type { ModuleClass, ModuleKey, ModuleLevel } from "./enums.js";

/**
 * La clase de negocio de un modulo, que NO es lo mismo que `clase`.
 *
 * - **vertical**: gestion especifica de UN TIPO DE NEGOCIO — lab, vet, taller,
 *   milk, farm, comercio. Son los arcos de la franja de la landing, y una
 *   organizacion generalmente tiene UNO.
 * - **horizontal**: administracion general, la sirva quien la sirva — compra,
 *   factura, nucleo, talento, visibilidad, conecta, deposito. Son las piezas
 *   de puzzle, y una organizacion tiene VARIAS.
 *
 * `clase` dice si el modulo se contrata (`comercial`) o es infraestructura
 * siempre encendida (`plataforma`). `kind` dice que clase de negocio resuelve.
 * Son preguntas distintas y por eso son dos campos.
 */
// RC-wire v0.13.0 (D28): la fuente material es data/enums.json (ModuleKind);
// acá sólo se re-exporta para que el path público de siempre no cambie.
export type { ModuleKind } from "./enums.js";
import type { ModuleKind } from "./enums.js";

export interface ModuleSeed {
  key: ModuleKey;
  clase: ModuleClass;
  /** null for plataforma; 1 or 2 for comercial. */
  nivel: ModuleLevel;
  nombre_es: string;
  descripcion_es: string;
  activo: boolean;
  /**
   * Subdominio del modulo. Foundation compone la URL con su
   * `PLATFORM_BASE_DOMAIN`, asi que el manifiesto queda libre de entorno:
   * `compra.suynda.com` en produccion y otro dominio en staging salen del
   * mismo dato.
   *
   * `null` cuando el modulo todavia no tiene destino desplegado — los que en
   * el armador figuran como "Pronto". Un subdominio inventado seria un enlace
   * roto en el riel, que es lo que el `url` nullable vino a evitar.
   *
   * NO hay campo de icono: el icono ES la `key`. Un segundo campo que siempre
   * valdria lo mismo es indireccion sin consumidor.
   */
  subdomain: string | null;
  /**
   * `null` EXACTAMENTE para `clase: "plataforma"`. Plataforma y Datos maestros
   * no son ni verticales ni horizontales: son infraestructura, nunca aparecen
   * en el armador ni en el riel, y ponerles una de las dos seria escribir algo
   * falso en el contrato para que el tipo quede mas corto.
   *
   * El campo ESTA en las 15 entradas; en dos vale `null`, que es una
   * declaracion y no un olvido. El guard del verificador exige justamente eso:
   * comercial con valor, plataforma sin el.
   */
  kind: ModuleKind | null;
  /**
   * La secuencia canonica dentro de su `kind`. `null` para `plataforma`, que
   * no aparece en ningun listado.
   *
   * NUMERADO DE DIEZ EN DIEZ a proposito: el modulo dieciseis se ubica en su
   * bloque sin renumerar a los otros quince. Un orden correlativo obliga a
   * tocar todo el archivo cada vez que nace algo.
   *
   * VIVE ACA Y NO EN CADA REPO por la misma razon que el icono y el
   * subdominio: si cada consumidor ordena por su cuenta, el hub ordena de una
   * forma, Visibilidad de otra y Lab de una tercera. El QUE se muestra lo dice
   * la plataforma; el COMO —riel vertical, barra inferior, franja— lo decide
   * quien pinta.
   *
   * Unico DENTRO de su `kind`, no entre todos: verticales y horizontales son
   * dos listas distintas y las dos arrancan en 10.
   */
  orden: number | null;
}

export const MODULES = modulesData as readonly ModuleSeed[];

export function moduleByKey(key: ModuleKey): ModuleSeed | undefined {
  return MODULES.find((m) => m.key === key);
}

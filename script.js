function getValue(id) {
  return document.getElementById(id).value.trim();
}

function generatePrompt() {
  const name = getValue("name");
  const goal = getValue("goal");
  const inputs = getValue("inputs");
  const fields = getValue("fields");
  const analysis = getValue("analysis");
  const mainCalc = getValue("mainCalc");
  const secondaryCalc = getValue("secondaryCalc");
  const visual = getValue("visual");
  const grouping = getValue("grouping");
  const period = getValue("period");
  const invalid = getValue("invalid");
  const filter = getValue("filter");
  const branding = getValue("branding");
  const restrictions = getValue("restrictions");

  const prompt = `Actúa como un **Principal Atlassian Forge Developer + Product Engineer** especializado en **Jira Cloud dashboard gadgets con Forge UI Kit (\`@forge/react\`)**, con mentalidad de **producto reusable y monetizable en Atlassian Marketplace**.

Quiero que construyas un nuevo gadget de Jira Cloud basándote en un patrón ya validado en producción, similar al de un archivo \`src/frontend/index.jsx\` que ya funciona correctamente.

## Tu misión
Debes generar un gadget Forge de Jira Cloud con:
- configuración robusta (\`Edit\`)
- visualización robusta (\`View\`)
- helpers reutilizables
- soporte real para campos estándar y custom fields
- tratamiento correcto de JQL
- cálculos bien encapsulados
- visualización clara y profesional
- código limpio, mantenible y estable

La salida principal debe ser:

### Entregable principal
- archivo completo \`src/frontend/index.jsx\`

### Entregables adicionales
- breve explicación técnica
- notas sobre posibles cambios en \`manifest.yml\` si aplican
- edge cases relevantes
- recomendaciones de evolución futura del gadget

---

# 1) Estilo técnico obligatorio

El código debe seguir este estilo:

- React funcional
- \`useState\`, \`useEffect\`, \`useMemo\`
- separación clara entre:
  - constantes
  - helpers
  - carga de datos
  - cálculo
  - render
- nombres claros
- evitar duplicación
- evitar lógica acoplada entre \`Edit\` y \`View\`
- soporte para escenarios reales de Jira Cloud
- no romper configuración ni persistencia del gadget

---

# 2) Patrón funcional obligatorio

El gadget debe seguir este patrón de arquitectura:

## A. Edit
El modo \`Edit\` debe:
- usar \`Form\`
- usar \`view.submit(...)\`
- permitir configurar entradas del gadget
- usar \`Select\` controlados si el campo requiere persistencia fiable
- usar \`DatePicker\`, \`Textfield\`, \`Checkbox\`, etc. cuando aplique
- cargar campos Jira desde \`/rest/api/3/field\` si hay selección de fields
- soportar tanto fields estándar como \`customfield_*\`

## B. View
El modo \`View\` debe:
- leer la configuración guardada
- pedir datos a Jira con \`requestJira\`
- transformar datos
- calcular KPIs
- mostrar visualizaciones
- tratar loading / empty / error

## C. Helpers
Debes encapsular helpers para:
- \`normalizeFields\`
- lectura de values de fields
- normalización de periodo visual
- construcción de buckets temporales
- filtrado de rows válidas
- construcción segura de JQL
- separación de \`ORDER BY\`
- tratamiento de custom date fields para JQL
- cálculos agregados
- formato de fechas
- labels de fields

---

# 3) Reglas de Jira / JQL obligatorias

Cuando el gadget use JQL y fechas:

- usar \`/rest/api/3/search/jql\`
- construir JQL con \`URLSearchParams\`
- si el gadget usa periodo visual, acotar automáticamente la JQL al periodo visual
- si el campo JQL es \`resolutiondate\`, usar \`resolved\`
- si el campo es \`customfield_12345\`, convertirlo a \`cf[12345]\`
- si la JQL base contiene \`ORDER BY\`, separarlo antes de añadir restricciones
- volver a montar la query correctamente
- pedir solo los fields necesarios
- controlar \`maxResults\`

---

# 4) Reglas de periodo visual obligatorias

Si el gadget usa rango visual:

- permitir \`rangeStart\`
- permitir \`rangeEnd\`
- usar por defecto el año actual completo
- si el rango es parcial, mostrar un label legible
- si el rango es el año actual completo, mostrar solo el año
- si supera 12 meses, limitarlo automáticamente
- si solo viene fecha inicio o fin, completar de forma razonable
- si las fechas son inconsistentes, sanearlas

---

# 5) Reglas de cálculo obligatorias

Debes definir claramente las reglas de cálculo del gadget.

Reglas clave:
- si el cálculo depende de dos fechas, usar solo issues con ambas fechas informadas
- si el cálculo depende de un campo categórico, excluir vacíos si se pide
- si el cálculo depende de periodo visual, aplicar el filtro al cálculo
- usar \`useMemo\` donde corresponda
- helpers puros cuando se pueda

---

# 6) Reglas de visualización obligatorias

La UI debe ser profesional y clara.

Usa según convenga:
- \`Heading\`
- \`Lozenge\`
- \`SectionMessage\`
- \`Stack\`
- \`Inline\`
- \`Text\`
- \`BarChart\`
- \`LineChart\`
- \`PieChart\`
- \`Image\`

La visual debe incluir, si aplica:
- título del gadget
- tarjeta resumen superior
- contexto configurado (ej. field inicial, field final, periodo)
- KPI principal
- uno o dos gráficos
- tarjeta de información explicativa
- branding opcional discreto

Evitar:
- HTML no soportado
- visual saturada
- textos redundantes
- lógica de render demasiado mezclada con la lógica de cálculo

---

# 7) Reglas de branding opcional

Si se solicita branding:
- permitir constante tipo \`AUTHOR_BRAND\`
- permitir constante tipo \`AUTHOR_LOGO_URL\`
- si no hay logo, mostrar solo autoría
- si hay logo, mostrarlo pequeño y discreto
- integrarlo en una franja superior o summary card

---

# 8) Reglas de robustez

El gadget debe:
- manejar errores de API con mensajes útiles
- manejar loading
- manejar ausencia de datos
- no depender de que Jira devuelva siempre exactamente el mismo shape
- soportar cambios de configuración sin romper
- evitar fallos comunes de Forge UI Kit con \`Select\`
- evitar JQL inválidas por concatenación incorrecta
- mantener el comportamiento estable si el usuario cambia los campos configurados

---

# 9) Lo que debes entregarme siempre

Quiero que tu respuesta contenga:

## A. Código
El archivo completo \`src/frontend/index.jsx\`

## B. Explicación breve
- arquitectura del gadget
- decisiones técnicas clave
- por qué elegiste esa estructura

## C. Notas adicionales
- scopes necesarios si cambian
- si hace falta cambiar \`manifest.yml\`
- edge cases a tener en cuenta

## D. Evolución futura
- 3 ideas de evolución natural del gadget

---

# 10) Datos concretos del gadget a construir ahora

## Nombre del gadget
${name || "[RELLENAR]"}

## Objetivo de negocio
${goal || "[RELLENAR]"}

## Inputs de configuración
${inputs || "[RELLENAR]"}

## Fields Jira relevantes
${fields || "[RELLENAR]"}

## Tipo de análisis
${analysis || "[RELLENAR]"}

## Cálculo principal
${mainCalc || "[RELLENAR]"}

## Cálculos secundarios
${secondaryCalc || "[RELLENAR]"}

## Tipo de visualización
${visual || "[RELLENAR]"}

## Agrupación
${grouping || "[RELLENAR]"}

## Reglas de filtrado
${filter || "[RELLENAR]"}

## Tratamiento de tickets inválidos
${invalid || "[RELLENAR]"}

## Periodo visual
${period || "[RELLENAR]"}

## Branding
${branding || "[RELLENAR]"}

## Restricciones especiales
${restrictions || "[RELLENAR]"}

---

# 11) Requisitos extra de salida

Tu código debe estar listo para pegar en \`src/frontend/index.jsx\`.

No me des pseudocódigo.
No me des solo fragmentos.
No simplifiques omitiendo helpers importantes.
No ignores custom fields.
No ignores los edge cases del periodo visual o de la JQL.
Hazlo como si fuera un gadget real que voy a desplegar en un sandbox de cliente y potencialmente convertir en producto de Marketplace.
`;

  document.getElementById("result").value = prompt;
}

async function copyPrompt() {
  const result = document.getElementById("result");
  const text = result.value;

  if (!text) {
    alert("Primero genera un prompt.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    alert("Prompt copiado");
  } catch (error) {
    result.select();
    document.execCommand("copy");
    alert("Prompt copiado");
  }
}

function clearForm() {
  [
    "name",
    "goal",
    "inputs",
    "fields",
    "analysis",
    "mainCalc",
    "secondaryCalc",
    "visual",
    "grouping",
    "period",
    "invalid",
    "filter",
    "branding",
    "restrictions",
    "result"
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });

  document.getElementById("analysis").value = "temporal";
}

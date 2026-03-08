function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value;
  }
}

function normalizeMultiline(value, fallback) {
  return value && value.trim() ? value.trim() : fallback;
}

function normalizeSimple(value, fallback) {
  return value && value.trim() ? value.trim() : fallback;
}

function inferDefaults({ analysis, visual, grouping, period, filter, invalid, restrictions }) {
  let inferredVisual = visual;
  let inferredGrouping = grouping;
  let inferredPeriod = period;
  let inferredFilter = filter;
  let inferredInvalid = invalid;
  let inferredRestrictions = restrictions;

  if (!inferredVisual) {
    if (analysis === "temporal") inferredVisual = "KPI + BarChart + LineChart";
    else if (analysis === "categórico") inferredVisual = "KPI + BarChart";
    else if (analysis === "KPI") inferredVisual = "KPI";
    else inferredVisual = "KPI + BarChart + LineChart";
  }

  if (!inferredGrouping) {
    if (analysis === "temporal") inferredGrouping = "mes";
    else if (analysis === "categórico") inferredGrouping = "categoría";
    else if (analysis === "KPI") inferredGrouping = "sin agrupación";
    else inferredGrouping = "mes";
  }

  if (!inferredPeriod) {
    if (analysis === "temporal" || analysis === "mixto") {
      inferredPeriod = "sí, máximo de 12 meses y año actual completo por defecto";
    } else {
      inferredPeriod = "si aplica, configurable";
    }
  }

  if (!inferredFilter) {
    if (analysis === "temporal" || analysis === "mixto") {
      inferredFilter = "Aplicar la JQL base y acotar automáticamente al periodo visual usando un campo fecha de referencia configurable.";
    } else {
      inferredFilter = "Aplicar la JQL base antes del cálculo y excluir issues fuera del criterio configurado.";
    }
  }

  if (!inferredInvalid) {
    inferredInvalid = "Excluir del cálculo los tickets que no tengan informados los campos necesarios para la métrica.";
  }

  if (!inferredRestrictions) {
    inferredRestrictions = "El gadget debe soportar campos estándar y custom fields, mantener una configuración estable y construir JQL válidas.";
  }

  return {
    visual: inferredVisual,
    grouping: inferredGrouping,
    period: inferredPeriod,
    filter: inferredFilter,
    invalid: inferredInvalid,
    restrictions: inferredRestrictions
  };
}

function buildSmartRecommendations({ analysis, fields, inputs, grouping }) {
  const notes = [];

  if ((analysis === "temporal" || analysis === "mixto") && !/fecha/i.test(fields + " " + inputs)) {
    notes.push("- Detecto análisis temporal o mixto sin campo fecha de referencia explícito; añade uno si el cálculo depende de eje temporal.");
  }

  if (grouping.toLowerCase().includes("mes") && !/fecha/i.test(fields + " " + inputs)) {
    notes.push("- La agrupación por mes requiere un campo fecha claro para filtrar, agrupar y construir el eje X.");
  }

  if (analysis === "categórico" && grouping.toLowerCase().includes("mes")) {
    notes.push("- Detecto mezcla entre análisis categórico y agrupación temporal; considera marcar el análisis como mixto si aplica.");
  }

  if (notes.length === 0) {
    notes.push("- La definición parece consistente para generar un gadget robusto.");
  }

  return notes.join("\n");
}

function applyPreset(type) {
  clearForm();

  const presets = {
    timeline: {
      name: "Timeline Date Metrics Gadget",
      goal: "Medir el tiempo medio entre dos fechas configurables con vista mensual y acumulada.",
      inputs: "- JQL base\n- campo fecha inicial\n- campo fecha final\n- rango visual inicio\n- rango visual fin\n- máximo de issues",
      fields: "- created\n- resolutiondate\n- customfield fecha",
      analysis: "temporal",
      mainCalc: "Diferencia media entre dos fechas por mes.",
      secondaryCalc: "- acumulado mensual\n- media total del periodo",
      visual: "KPI + BarChart + LineChart",
      grouping: "mes",
      period: "sí, máximo de 12 meses y año actual completo por defecto",
      invalid: "Excluir tickets sin ambas fechas informadas.",
      filter: "Aplicar la JQL base y acotar automáticamente al periodo visual usando el campo fecha final.",
      branding: "Capitole Consulting",
      restrictions: "Soportar custom fields de fecha y JQL acotada automáticamente."
    },
    sla: {
      name: "SLA Analytics Gadget",
      goal: "Analizar tiempos SLA por periodo visual y detectar tendencias mensuales.",
      inputs: "- JQL base\n- campo fecha inicio\n- campo fecha fin\n- rango visual\n- máximo de issues",
      fields: "- created\n- resolved\n- customfield SLA date",
      analysis: "temporal",
      mainCalc: "Tiempo medio entre inicio y fin del SLA.",
      secondaryCalc: "- acumulado mensual\n- media total del periodo",
      visual: "KPI + BarChart + LineChart",
      grouping: "mes",
      period: "sí, máximo de 12 meses y año actual completo por defecto",
      invalid: "Excluir tickets sin ambas fechas SLA.",
      filter: "Filtrar por el campo fecha final del SLA dentro del periodo visual.",
      branding: "Capitole Consulting",
      restrictions: "Usar JQL acotada y soportar fields custom de fecha."
    },
    aging: {
      name: "Aging by Status Gadget",
      goal: "Mostrar envejecimiento medio de tickets abiertos por estado.",
      inputs: "- JQL base\n- campo fecha de referencia\n- campo status\n- rango visual\n- máximo de issues",
      fields: "- created\n- status\n- updated",
      analysis: "mixto",
      mainCalc: "Días transcurridos desde la fecha de referencia hasta hoy.",
      secondaryCalc: "- media por estado\n- distribución por estado",
      visual: "KPI + BarChart + PieChart",
      grouping: "status",
      period: "sí, máximo de 12 meses y año actual completo por defecto",
      invalid: "Excluir tickets sin fecha de referencia o sin status.",
      filter: "Aplicar la JQL base y acotar por fecha de referencia si aplica.",
      branding: "Capitole Consulting",
      restrictions: "El gadget debe soportar agrupación categórica y KPIs."
    },
    workload: {
      name: "Workload by Assignee Gadget",
      goal: "Visualizar carga de tickets por responsable y evolución temporal.",
      inputs: "- JQL base\n- campo usuario\n- campo fecha de referencia\n- rango visual\n- máximo de issues",
      fields: "- assignee\n- created\n- resolved",
      analysis: "mixto",
      mainCalc: "Conteo de tickets por assignee.",
      secondaryCalc: "- porcentaje sobre total\n- evolución mensual",
      visual: "KPI + PieChart + BarChart",
      grouping: "assignee",
      period: "sí, máximo de 12 meses y año actual completo por defecto",
      invalid: "Excluir tickets sin assignee.",
      filter: "Aplicar la JQL base y filtrar por fecha de referencia dentro del periodo visual.",
      branding: "Capitole Consulting",
      restrictions: "Mantener estabilidad en agrupación por usuario."
    },
    budget: {
      name: "Budget vs Actual Cost Gadget",
      goal: "Mostrar desviación entre presupuesto y coste real con vista mensual y acumulada.",
      inputs: "- JQL base\n- campo numérico presupuesto\n- campo numérico coste real\n- campo fecha de referencia\n- rango visual\n- máximo de issues",
      fields: "- customfield numérico presupuesto\n- customfield numérico coste real\n- customfield fecha de referencia",
      analysis: "mixto",
      mainCalc: "Diferencia media entre presupuesto y coste real.",
      secondaryCalc: "- suma mensual de desviación\n- acumulado mensual\n- media total del periodo",
      visual: "KPI + BarChart + LineChart",
      grouping: "mes",
      period: "sí, con rango libre",
      invalid: "Excluir issues sin ambos campos numéricos o sin fecha de referencia.",
      filter: "Aplicar la JQL base y acotar automáticamente al periodo visual usando la fecha de referencia.",
      branding: "Personal brand",
      restrictions: "Soportar custom fields numéricos y de fecha."
    }
  };

  const preset = presets[type];
  if (!preset) return;

  Object.entries(preset).forEach(([key, value]) => {
    setValue(key, value);
  });
}

function generatePrompt() {
  const raw = {
    name: getValue("name"),
    goal: getValue("goal"),
    inputs: getValue("inputs"),
    fields: getValue("fields"),
    analysis: getValue("analysis"),
    mainCalc: getValue("mainCalc"),
    secondaryCalc: getValue("secondaryCalc"),
    visual: getValue("visual"),
    grouping: getValue("grouping"),
    period: getValue("period"),
    invalid: getValue("invalid"),
    filter: getValue("filter"),
    branding: getValue("branding"),
    restrictions: getValue("restrictions")
  };

  const normalized = {
    name: normalizeSimple(raw.name, "Unnamed Gadget"),
    goal: normalizeMultiline(raw.goal, "Definir objetivo de negocio del gadget."),
    inputs: normalizeMultiline(raw.inputs, "- JQL base"),
    fields: normalizeMultiline(raw.fields, "- created"),
    analysis: normalizeSimple(raw.analysis, "temporal"),
    mainCalc: normalizeMultiline(raw.mainCalc, "Definir cálculo principal."),
    secondaryCalc: normalizeMultiline(raw.secondaryCalc, "- sin cálculos secundarios definidos"),
    branding: normalizeSimple(raw.branding, "Sin branding")
  };

  const inferred = inferDefaults({
    analysis: normalized.analysis,
    visual: raw.visual,
    grouping: raw.grouping,
    period: raw.period,
    filter: raw.filter,
    invalid: raw.invalid,
    restrictions: raw.restrictions
  });

  const recommendations = buildSmartRecommendations({
    analysis: normalized.analysis,
    fields: normalized.fields,
    inputs: normalized.inputs,
    grouping: inferred.grouping
  });

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
- si detectas ambigüedad funcional menor, toma una decisión razonable y explícala

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
${normalized.name}

## Objetivo de negocio
${normalized.goal}

## Inputs de configuración
${normalized.inputs}

## Fields Jira relevantes
${normalized.fields}

## Tipo de análisis
${normalized.analysis}

## Cálculo principal
${normalized.mainCalc}

## Cálculos secundarios
${normalized.secondaryCalc}

## Tipo de visualización
${inferred.visual}

## Agrupación
${inferred.grouping}

## Reglas de filtrado
${inferred.filter}

## Tratamiento de tickets inválidos
${inferred.invalid}

## Periodo visual
${inferred.period}

## Branding
${normalized.branding}

## Restricciones especiales
${inferred.restrictions}

---

# 11) Recomendaciones detectadas por el generador

${recommendations}

---

# 12) Requisitos extra de salida

Tu código debe estar listo para pegar en \`src/frontend/index.jsx\`.

No me des pseudocódigo.
No me des solo fragmentos.
No simplifiques omitiendo helpers importantes.
No ignores custom fields.
No ignores los edge cases del periodo visual o de la JQL.
Hazlo como si fuera un gadget real que voy a desplegar en un sandbox de cliente y potencialmente convertir en producto de Marketplace.
`;

  setValue("result", prompt);
}

async function copyPrompt() {
  const result = getValue("result");

  if (!result) {
    alert("Primero genera un prompt.");
    return;
  }

  try {
    await navigator.clipboard.writeText(result);
    alert("Prompt copiado");
  } catch (error) {
    const textarea = document.getElementById("result");
    textarea.select();
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
    "mainCalc",
    "secondaryCalc",
    "restrictions",
    "result"
  ].forEach((id) => setValue(id, ""));

  setValue("analysis", "temporal");
  setValue("visual", "");
  setValue("grouping", "");
  setValue("period", "");
  setValue("invalid", "");
  setValue("filter", "");
  setValue("branding", "");
}

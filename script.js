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

  if ((grouping || "").toLowerCase().includes("mes") && !/fecha/i.test(fields + " " + inputs)) {
    notes.push("- La agrupación por mes requiere un campo fecha claro para filtrar, agrupar y construir el eje X.");
  }

  if (analysis === "categórico" && (grouping || "").toLowerCase().includes("mes")) {
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

  generatePrompt();
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

  // Update the gadget visual preview
  renderGadgetPreview({
    name: normalized.name,
    analysis: normalized.analysis,
    visual: inferred.visual,
    grouping: inferred.grouping,
    mainCalc: normalized.mainCalc,
    secondaryCalc: normalized.secondaryCalc,
    branding: normalized.branding,
    period: inferred.period,
    fields: normalized.fields,
    goal: normalized.goal
  });
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

  // Reset gadget preview
  resetGadgetPreview();
}

// ── Gadget Preview ───────────────────────────────────────────────────────────

function resetGadgetPreview() {
  const titleEl = document.getElementById("preview-title");
  const bodyEl = document.getElementById("preview-body");
  if (titleEl) titleEl.textContent = "— sin configurar —";
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="gadget-placeholder">
        <div class="placeholder-icon">📊</div>
        <strong>Aún sin datos</strong>
        <p>Rellena el formulario y pulsa <em>Generar prompt</em> para ver el boceto del gadget.</p>
      </div>`;
  }
}

function makeSampleData(grouping, count) {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const statuses = ["To Do", "In Progress", "Done", "Blocked"];
  const assignees = ["Ana G.", "Luis M.", "Sara P.", "Carlos R."];
  const priorities = ["Highest", "High", "Medium", "Low"];
  const projects = ["PRJ-A", "PRJ-B", "PRJ-C"];

  const maps = {
    mes: months.slice(0, count),
    semana: Array.from({ length: count }, (_, i) => `S${i + 1}`),
    día: Array.from({ length: count }, (_, i) => `D${i + 1}`),
    status: statuses.slice(0, count),
    assignee: assignees.slice(0, count),
    priority: priorities.slice(0, count),
    project: projects.slice(0, count),
    component: Array.from({ length: count }, (_, i) => `Comp ${i + 1}`),
    label: Array.from({ length: count }, (_, i) => `Label ${i + 1}`),
  };

  const labels = maps[grouping] || months.slice(0, count);
  const values = Array.from({ length: labels.length }, () => Math.floor(Math.random() * 60) + 10);
  return { labels, values };
}

function buildBarLineSVG(labels, values, showLine) {
  const w = 240;
  const h = 80;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 4;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const maxVal = Math.max(...values, 1);
  const count = labels.length;
  const barW = Math.max(6, Math.floor(innerW / count) - 3);
  const slotW = innerW / count;

  // bars
  let bars = values.map((v, i) => {
    const bh = Math.max(4, (v / maxVal) * innerH);
    const x = padL + i * slotW + (slotW - barW) / 2;
    const y = padT + innerH - bh;
    return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${bh.toFixed(1)}" rx="2"/>`;
  }).join("");

  // line
  let line = "";
  if (showLine) {
    const points = values.map((v, i) => {
      const cx = padL + i * slotW + slotW / 2;
      const cy = padT + innerH - (v / maxVal) * innerH;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    });
    const dotCircles = values.map((v, i) => {
      const cx = padL + i * slotW + slotW / 2;
      const cy = padT + innerH - (v / maxVal) * innerH;
      return `<circle class="chart-dot" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5"/>`;
    }).join("");
    line = `<polyline class="chart-line-path" points="${points.join(" ")}"/>${dotCircles}`;
  }

  return `
    <svg class="chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      ${bars}${line}
    </svg>
    <div class="chart-x-labels">
      ${labels.map(l => `<span>${l}</span>`).join("")}
    </div>`;
}

function buildPieDonutSVG(labels, values) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const colors = ["#2C3E50", "#5C7A94", "#7A9478", "#C4BAA8", "#8C7E6A", "#3D5166"];
  const cx = 50, cy = 50, r = 36, innerR = 22;
  let startAngle = -Math.PI / 2;
  let slices = "";

  values.forEach((v, i) => {
    const angle = (v / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix1.toFixed(2)},${iy1.toFixed(2)} A${innerR},${innerR} 0 ${large},0 ${ix2.toFixed(2)},${iy2.toFixed(2)} Z`;
    slices += `<path d="${d}" fill="${colors[i % colors.length]}" opacity="0.85"/>`;
    startAngle = endAngle;
  });

  const legendItems = labels.slice(0, 4).map((l, i) =>
    `<div style="display:flex;align-items:center;gap:5px;font-size:10px;color:#5A5048;">
      <span style="width:8px;height:8px;border-radius:2px;background:${colors[i % colors.length]};display:inline-block;flex-shrink:0;"></span>
      <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70px;">${l}</span>
    </div>`
  ).join("");

  return `
    <div style="display:flex;align-items:center;gap:12px;">
      <svg viewBox="0 0 100 100" style="width:90px;height:90px;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg">
        ${slices}
      </svg>
      <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;">${legendItems}</div>
    </div>`;
}

function renderGadgetPreview({ name, analysis, visual, grouping, mainCalc, secondaryCalc, branding, period, fields }) {
  const titleEl = document.getElementById("preview-title");
  const bodyEl = document.getElementById("preview-body");
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = name || "Gadget Preview";

  const v = (visual || "").toLowerCase();
  const hasKPI = v.includes("kpi");
  const hasBar = v.includes("bar");
  const hasLine = v.includes("line");
  const hasPie = v.includes("pie");

  const effectiveGrouping = grouping || "mes";
  const sampleCount = ["mes"].includes(effectiveGrouping) ? 6 : 4;
  const { labels, values } = makeSampleData(effectiveGrouping, sampleCount);

  const total = values.reduce((a, b) => a + b, 0);
  const avg = total ? (total / values.length).toFixed(1) : "—";
  const max = Math.max(...values);

  // Derive config tags from fields / period
  const fieldLines = fields.split("\n").map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean).slice(0, 3);
  const configTags = fieldLines.map(f => `<span class="config-tag">${f}</span>`).join("");
  const periodTag = period && period !== "sin periodo visual"
    ? `<span class="config-tag">📅 ${period.length > 30 ? period.slice(0, 28) + "…" : period}</span>`
    : "";

  let kpiSection = "";
  if (hasKPI) {
    const sec = secondaryCalc.split("\n").map(l => l.replace(/^-\s*/, "").trim()).filter(Boolean);
    const kpi2Label = sec[0] || "Acumulado";
    const kpi3Label = sec[1] || "Máximo";

    kpiSection = `
      <div class="kpi-row">
        <div class="kpi-box">
          <div class="kpi-label">${mainCalc.length > 40 ? mainCalc.slice(0, 38) + "…" : mainCalc}</div>
          <div class="kpi-value">${avg}<span style="font-size:14px;font-family:'DM Sans',sans-serif;font-weight:300;margin-left:4px;opacity:0.7">${analysis === "temporal" ? "días" : "issues"}</span></div>
          <div class="kpi-sub">Media del periodo · ${sampleCount} ${effectiveGrouping}s</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">${kpi2Label.length > 18 ? kpi2Label.slice(0, 16) + "…" : kpi2Label}</div>
          <div class="kpi-value" style="font-size:17px;">${total}</div>
        </div>
        <div class="kpi-box">
          <div class="kpi-label">${kpi3Label.length > 18 ? kpi3Label.slice(0, 16) + "…" : kpi3Label}</div>
          <div class="kpi-value" style="font-size:17px;">${max}</div>
        </div>
      </div>`;
  }

  let chartSection = "";
  if (hasBar || hasLine) {
    const chartTitle = hasBar && hasLine
      ? `Evolución por ${effectiveGrouping} · Barras + Línea`
      : hasBar ? `Distribución por ${effectiveGrouping}`
      : `Tendencia por ${effectiveGrouping}`;
    chartSection = `
      <div class="chart-placeholder">
        <div class="chart-label">${chartTitle}</div>
        ${buildBarLineSVG(labels, values, hasLine)}
      </div>`;
  }

  let pieSection = "";
  if (hasPie) {
    const pieTitle = `Distribución por ${effectiveGrouping}`;
    const pieValues = hasBar ? values.map(v => Math.floor(v * 0.6) + 5) : values;
    pieSection = `
      <div class="chart-placeholder">
        <div class="chart-label">${pieTitle}</div>
        ${buildPieDonutSVG(labels, pieValues)}
      </div>`;
  }

  const configSection = (configTags || periodTag) ? `
    <div class="config-strip">
      ${configTags}
      ${periodTag}
    </div>` : "";

  const brandingSection = branding && branding !== "Sin branding" ? `
    <div class="branding-strip">
      <div class="branding-dot"></div>
      <span>${branding}</span>
    </div>` : "";

  bodyEl.innerHTML = `
    ${kpiSection}
    ${chartSection}
    ${pieSection}
    ${configSection}
    ${brandingSection}
  `;
}

// ── Wiring ───────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("preset-timeline")?.addEventListener("click", () => applyPreset("timeline"));
  document.getElementById("preset-sla")?.addEventListener("click", () => applyPreset("sla"));
  document.getElementById("preset-aging")?.addEventListener("click", () => applyPreset("aging"));
  document.getElementById("preset-workload")?.addEventListener("click", () => applyPreset("workload"));
  document.getElementById("preset-budget")?.addEventListener("click", () => applyPreset("budget"));

  document.getElementById("generate-btn")?.addEventListener("click", generatePrompt);
  document.getElementById("copy-btn")?.addEventListener("click", copyPrompt);
  document.getElementById("clear-btn")?.addEventListener("click", clearForm);
});

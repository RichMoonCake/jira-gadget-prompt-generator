function generatePrompt(){

const name = document.getElementById("name").value
const goal = document.getElementById("goal").value
const inputs = document.getElementById("inputs").value
const fields = document.getElementById("fields").value
const analysis = document.getElementById("analysis").value
const mainCalc = document.getElementById("mainCalc").value
const secondaryCalc = document.getElementById("secondaryCalc").value
const visual = document.getElementById("visual").value
const grouping = document.getElementById("grouping").value
const period = document.getElementById("period").value
const invalid = document.getElementById("invalid").value
const filter = document.getElementById("filter").value
const branding = document.getElementById("branding").value
const restrictions = document.getElementById("restrictions").value

const prompt = `
Quiero que me generes un nuevo gadget Forge Jira Cloud siguiendo el patrón productivo y reutilizable de nuestro index.jsx ya validado.

Nombre del gadget:
${name}

Objetivo de negocio:
${goal}

Inputs de configuración:
${inputs}

Fields Jira:
${fields}

Tipo de análisis:
${analysis}

Cálculo principal:
${mainCalc}

Cálculos secundarios:
${secondaryCalc}

Visualización:
${visual}

Agrupación:
${grouping}

Periodo visual:
${period}

Tratamiento de tickets inválidos:
${invalid}

Reglas de filtrado:
${filter}

Branding:
${branding}

Restricciones especiales:
${restrictions}

Entrégame:
1. src/frontend/index.jsx completo
2. explicación técnica breve
3. cambios en manifest.yml si aplican
4. edge cases
5. mejoras futuras
`

document.getElementById("result").value = prompt
}

function copyPrompt(){

const result = document.getElementById("result")

result.select()
document.execCommand("copy")

alert("Prompt copiado")
}

import { formatCurrency, categorizeExpense } from './utils.js'
import {
  renderSummaryCharts
} from './charts.js'

/**
 * Calculates the entire trip budget from the single source of truth.
 * @param {object} tripData - The main data object for the trip.
 * @param {object} config - The configuration object with rates and colors.
 * @returns {object} An object with detailed budget breakdown.
 */
function calculateGeneralBudget (tripData, config) {
  const { prepaidCosts, days } = tripData
  const { copToMxnRate, contingencyRate } = config

  const onTripCostsCOP = {
    Alimentación: 0,
    Actividades: 0,
    Transporte: 0,
    Otros: 0
  }

  days.forEach(day => {
    if (day.budgetTable && day.budgetTable.items) {
      day.budgetTable.items.forEach(item => {
        if (item.prepaid) return
        const category = categorizeExpense(item.concept)
        onTripCostsCOP[category] += item.cost
      })
    }
  })

  const prepaidHospedajesMXN = Object.values(prepaidCosts.hospedajesMXN).reduce((sum, cost) => sum + cost, 0)
  const onTripTotalCOP = Object.values(onTripCostsCOP).reduce((sum, cost) => sum + cost, 0)

  const onTripAlimentacionMXN = onTripCostsCOP.Alimentación * copToMxnRate
  const onTripActividadesMXN = onTripCostsCOP.Actividades * copToMxnRate
  const onTripTransporteMXN = onTripCostsCOP.Transporte * copToMxnRate
  const onTripOtrosMXN = onTripCostsCOP.Otros * copToMxnRate
  const contingenciaMXN = onTripTotalCOP * contingencyRate * copToMxnRate

  const budgetData = [
    { category: 'Vuelos Internacionales', cost: prepaidCosts.vuelosInternacionalesMXN, currency: 'MXN' },
    { category: 'Hospedajes (12 noches)', cost: prepaidHospedajesMXN, currency: 'MXN' },
    { category: 'Vuelos Internos (4 vuelos)', cost: prepaidCosts.vuelosInternosMXN, currency: 'MXN' },
    { category: 'Actividades y Entradas', cost: onTripActividadesMXN, currency: 'MXN' },
    { category: 'Alimentación', cost: onTripAlimentacionMXN, currency: 'MXN' },
    { category: 'Transporte Local', cost: onTripTransporteMXN + onTripOtrosMXN, currency: 'MXN' },
    { category: 'Fondo de Contingencia (15%)', cost: contingenciaMXN, currency: 'MXN' }
  ]

  const totalMXN = budgetData.reduce((sum, item) => sum + item.cost, 0)

  return { budgetData, totalMXN }
}

/**
 * Renders the main summary cards with total costs.
 * @param {number} totalMXN - The total estimated cost in MXN.
 * @param {number} copToMxnRate - The conversion rate from COP to MXN.
 * @returns {string} The HTML for the summary cards.
 */
function renderSummaryCards (totalMXN, copToMxnRate) {
  const totalCOP = totalMXN / copToMxnRate
  return `
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
      <div class="stat">
        <div class="stat-title">Costo Total Estimado (p.p)</div>
        <div class="stat-value text-primary">${formatCurrency(totalMXN, 'MXN')}</div>
        <div class="stat-desc text-secondary">(~${formatCurrency(totalCOP, 'COP')})</div>
      </div>
      <div class="stat">
        <div class="stat-title">Duración de la Misión</div>
        <div class="stat-value">13 Días</div>
        <div class="stat-desc">12 Noches</div>
      </div>
      <div class="stat">
        <div class="stat-title">Teatros de Operaciones</div>
        <div class="stat-value">4</div>
        <div class="stat-desc">Cartagena, Medellín, Eje Cafetero, Bogotá</div>
      </div>
    </div>
  `
}

/**
 * Renders the general budget distribution table.
 * @param {object} budgetCalculations - The calculated budget data.
 * @returns {string} The HTML for the budget table.
 */
function renderGeneralBudgetTable ({ budgetData, totalMXN }) {
  const tableRows = budgetData.map(item => `
    <tr>
      <th>${item.category}</th>
      <td class="text-right">${formatCurrency(item.cost, item.currency)}</td>
    </tr>
  `).join('')

  return `
    <div class="overflow-x-auto">
      <h3 class="text-xl font-semibold mb-4 text-center">Distribución de Recursos (Estimado por Persona)</h3>
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Categoría</th>
            <th class="text-right">Costo Estimado (MXN)</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr class="text-lg">
            <th>Total Estimado p.p.</th>
            <th class="text-right">${formatCurrency(totalMXN, 'MXN')}</th>
          </tr>
        </tfoot>
      </table>
    </div>
  `
}

/**
 * Renders the lodging summary table.
 * @param {Array} lodgingSummary - The array of lodging objects.
 * @returns {string} The HTML for the lodging table.
 */
function renderLodgingSummary (lodgingSummary) {
  const tableRows = lodgingSummary.map(item => `
    <tr>
      <td>
        <div class="font-bold">${item.city}</div>
      </td>
      <td>
        <a href="${item.mapLink}" target="_blank" class="link link-primary">${item.name}</a>
      </td>
      <td>${item.checkIn} - ${item.checkOut}</td>
      <td class="text-center">${item.nights}</td>
    </tr>
  `).join('')

  return `
    <div class="collapse collapse-arrow bg-base-200 my-4">
      <input type="checkbox" />
      <div class="collapse-title text-xl font-medium">
        🏨 Resumen de Hospedajes
      </div>
      <div class="collapse-content">
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Ciudad</th>
                <th>Alojamiento</th>
                <th>Fechas</th>
                <th class="text-center">Noches</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

/**
 * Renders the general recommendations section.
 * @param {object} recommendations - The general recommendations data.
 * @returns {string} The HTML for the recommendations section.
 */
function renderGeneralRecommendations (recommendations) {
  if (!recommendations) return ''

  const pointsHTML = recommendations.points.map((point, index) => `
    <div class="collapse collapse-arrow bg-base-200 mb-2">
      <input type="radio" name="recommendations-accordion" ${index === 0 ? 'checked="checked"' : ''} />
      <div class="collapse-title text-lg font-medium">
        ${point.title}
      </div>
      <div class="collapse-content prose max-w-none">
        <p>${point.content}</p>
      </div>
    </div>
  `).join('')

  return `
    <section id="general-recommendations" class="my-8">
      <h2 class="text-2xl font-bold mb-4">${recommendations.title}</h2>
      ${pointsHTML}
    </section>
  `
}

/**
 * Renders the shared map links section.
 * @param {object} mapLinks - The map links data.
 * @returns {string} The HTML for the map links section.
 */
function renderMapLinks (mapLinks) {
  if (!mapLinks) return ''

  const mapsHTML = mapLinks.maps.map(map => `
    <a href="${map.url}" target="_blank" rel="noopener noreferrer" class="card bg-primary text-primary-content shadow-xl hover:bg-primary-focus transition-colors">
      <div class="card-body items-center text-center">
        <h2 class="card-title">${map.city}</h2>
        <p>Ver lista de lugares en Google Maps</p>
      </div>
    </a>
  `).join('')

  return `
    <section id="map-links" class="my-8">
      <h2 class="text-2xl font-bold mb-4">${mapLinks.title}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${mapsHTML}
      </div>
    </section>
  `
}

/**
 * Main render function for the summary tab.
 * @param {object} data - The full data object from data.json.
 */
export function renderSummaryTab (data) {
  const { tripData, config } = data
  const summaryTabContent = document.getElementById('summary-tab-content')
  if (!summaryTabContent) return

  const budgetCalculations = calculateGeneralBudget(tripData, config)

  summaryTabContent.innerHTML = `
    <section id="summary-cards">
      ${renderSummaryCards(budgetCalculations.totalMXN, config.copToMxnRate)}
    </section>
    <section id="budget-breakdown" class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="bg-base-200 p-6 rounded-box">
        ${renderGeneralBudgetTable(budgetCalculations)}
      </div>
      <div class="bg-base-200 p-6 rounded-box">
        <h3 class="text-xl font-semibold mb-4 text-center">Huella Financiera por Destino (Total Gastado en COP)</h3>
        <div class="h-80"><canvas id="destinationCostChart"></canvas></div>
      </div>
    </section>
    <section id="budget-by-concept" class="bg-base-200 p-6 rounded-box my-8">
      <h3 class="text-xl font-semibold mb-4 text-center">Presupuesto por Concepto (MXN)</h3>
      <div class="h-96"><canvas id="budgetByConceptChart"></canvas></div>
    </section>
    <section id="lodging-summary">
      ${renderLodgingSummary(tripData.lodgingSummary)}
    </section>

    <div class="collapse collapse-arrow bg-base-200 my-4" open>
      <input type="checkbox" checked="checked" />
      <div class="collapse-title text-xl font-medium">
        🌦️ Pronóstico del Tiempo General
      </div>
      <div class="collapse-content">
        <div class="h-80"><canvas id="weatherTimelineChart"></canvas></div>
      </div>
    </div>

    <div class="collapse collapse-arrow bg-base-200 my-4" open>
        <input type="checkbox" checked="checked" />
        <div class="collapse-title text-xl font-medium">
            💰 Gastos Diarios por Categoría (COP)
        </div>
        <div class="collapse-content">
            <div class="h-96"><canvas id="dailyStackedBudgetChart"></canvas></div>
        </div>
    </div>

    ${renderGeneralRecommendations(tripData.generalRecommendations)}
    ${renderMapLinks(tripData.mapLinks)}
  `

  // We need to call the chart rendering functions from `charts.js`
  renderSummaryCharts(data, budgetCalculations)
}

/**
 * Renders the budget by concept chart.
 * @param {object} budgetCalculations - The calculated budget data.
 * @param {object} config - The configuration object with chart colors.
 */

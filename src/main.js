import './style.css'
import data from './data.json'
import { renderSummaryTab } from './summary.js'
import { renderItineraryTab } from './itinerary.js'
import { getWeatherData, renderSummaryCharts, renderItineraryCharts } from './charts.js'

function renderShell () {
  const app = document.querySelector('#app')
  if (!app) return

  app.innerHTML = `
    <div class="hero bg-base-200 rounded-box py-8 mb-8">
      <div class="hero-content text-center">
        <div class="max-w-3xl">
          <h1 class="text-5xl font-bold text-primary">Guía Interactiva de Viaje: Colombia 2025 🇨🇴</h1>
          <p class="py-6 text-lg">Dossier Táctico del 10 al 22 de Octubre.</p>
        </div>
      </div>
    </div>

    <main>
      <div role="tablist" class="tabs tabs-lifted tabs-lg">

        <input type="radio" id="tab-summary" name="main_tabs" role="tab" class="tab" aria-label="Resumen General" />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6" id="summary-tab-content">
          <div class="text-center"><span class="loading loading-spinner loading-lg"></span></div>
        </div>

        <input type="radio" id="tab-itinerary" name="main_tabs" role="tab" class="tab" aria-label="Itinerario por Día" checked />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6" id="itinerary-tab-content">
          <div class="text-center"><span class="loading loading-spinner loading-lg"></span></div>
        </div>

      </div>
    </main>
  `
}

async function main () {
  renderShell()

  const uniqueCities = [...new Set(data.tripData.days.map(day => day.city.split('/')[0].trim()))]
  const weatherData = await getWeatherData(uniqueCities)

  renderSummaryTab(data, weatherData)
  renderItineraryTab(data, weatherData)

  setTimeout(() => renderItineraryCharts(data), 0)

  const summaryTabInput = document.getElementById('tab-summary')
  summaryTabInput.addEventListener('click', () => {
    renderSummaryCharts(data, calculateGeneralBudget(data.tripData, data.config), weatherData)
  }, { once: true })
}

// Helper functions moved from summary.js to be available for budget calculation
function calculateGeneralBudget (tripData, config) {
  const { prepaidCosts, days } = tripData
  const { copToMxnRate, contingencyRate } = config
  const onTripCostsCOP = { Alimentación: 0, Actividades: 0, Transporte: 0, Otros: 0 }
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

function categorizeExpense (concept) {
  const lowerConcept = concept.toLowerCase()
  if (['almuerzo', 'cena', 'bebida', 'desayuno', 'degustación'].some(c => lowerConcept.includes(c))) { return 'Alimentación' }
  if (['tour', 'entrada', 'pass', 'peinado', 'impuesto portuario', 'tiquete', 'foto'].some(c => lowerConcept.includes(c))) { return 'Actividades' }
  if (['taxi', 'metro', 'buseta', 'jeep', 'traslado', 'bus', 'funicular'].some(c => lowerConcept.includes(c))) { return 'Transporte' }
  return 'Otros'
}

main()

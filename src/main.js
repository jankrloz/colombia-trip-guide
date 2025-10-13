import './style.css'
import data from './data.json'
import { renderSummaryTab } from './summary.js'
import { renderItineraryTab } from './itinerary.js'
import { renderSummaryCharts, renderItineraryCharts } from './charts.js'

/**
 * Renders the basic application shell with the main tabs.
 */
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

        <input type="radio" id="tab-summary" name="main_tabs" role="tab" class="tab" aria-label="Resumen General" checked />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6" id="summary-tab-content">
          <div class="text-center"><span class="loading loading-spinner loading-lg"></span></div>
        </div>

        <input type="radio" id="tab-itinerary" name="main_tabs" role="tab" class="tab" aria-label="Itinerario por Día" />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6" id="itinerary-tab-content">
          <div class="text-center"><span class="loading loading-spinner loading-lg"></span></div>
        </div>

      </div>
    </main>
  `
}

/**
 * Main application initialization function.
 */
async function main () {
  // 1. Render the basic structure of the site
  renderShell()

  // 2. Render the content for both main tabs
  renderSummaryTab(data)
  renderItineraryTab(data)

  // 3. Render the charts for the initially visible summary tab
  await renderSummaryCharts(data)

  // 4. Add a listener to render itinerary charts ONLY when that tab is first clicked
  const itineraryTabInput = document.getElementById('tab-itinerary')
  itineraryTabInput.addEventListener('click', () => {
    // A small timeout ensures the tab content is visible before chart rendering
    setTimeout(() => renderItineraryCharts(data), 0)
  }, { once: true }) // Only needs to run once, it renders all daily charts at once
}

// Start the application
main()

import { formatCurrency, formatDualCurrency } from './utils.js'

/**
 * Generates the HTML for a single link resource.
 * @param {Array} links - Array of link objects.
 * @returns {string} The HTML for the links.
 */
const renderLinks = (links) => {
  if (!links || links.length === 0) return ''
  return links
    .map(
      link =>
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-xs btn-outline btn-primary mr-2 mb-2">📍 ${link.name}</a>`
    )
    .join('')
}

/**
 * Generates the HTML for the detailed itinerary table for a single day.
 * @param {object} day - The day object from the data.
 * @param {object} config - The configuration object.
 * @returns {string} The HTML for the itinerary table.
 */
const renderDetailedItineraryTable = (day, config) => {
  const itineraryRows = day.itinerary
    .map(
      item => `
    <tr class="hover">
      <td class="align-top font-semibold p-2">${item.time}</td>
      <td class="align-top p-2">
        <p class="font-semibold">${item.activity}</p>
        <p class="font-bold text-primary text-sm mt-1">${formatDualCurrency(item.cost_cop, config.copToMxnRate, item.prepaid)}</p>
      </td>
      <td class="align-top p-2 text-sm">${item.transport}</td>
      <td class="align-top p-2 text-sm">${item.comments}</td>
      <td class="align-top p-2">${renderLinks(item.links)}</td>
    </tr>
  `
    )
    .join('')

  return `
    <div class="overflow-x-auto">
      <table class="table table-sm w-full table-zebra">
        <thead>
          <tr>
            <th class="min-w-[6rem]">Horario</th>
            <th class="min-w-[15rem]">Actividad y Costo</th>
            <th class="min-w-[12rem]">Transporte</th>
            <th class="min-w-[20rem]">Comentarios</th>
            <th class="min-w-[15rem]">Recursos</th>
          </tr>
        </thead>
        <tbody>${itineraryRows}</tbody>
      </table>
    </div>
  `
}

/**
 * Generates the HTML for a single day's content panel.
 * @param {object} day - The day object from the data.
 * @param {object} config - The configuration object.
 * @returns {string} The HTML for the day's content.
 */
const renderDayContent = (day, config) => {
  const dailyTotalCOP = day.budgetTable.items.reduce((sum, item) => sum + (item.cost || 0), 0)

  const weatherEmoji = day.city.includes('Cartagena')
    ? '☀️'
    : day.city.includes('Medellín') || day.city.includes('Salento')
      ? '🌦️'
      : '☁️'

  return `
    <div class="border-b-2 border-primary pb-4 mb-6">
      <h2 class="text-3xl font-bold text-primary">${`Día ${day.day}: ${day.title}`}</h2>
      <p class="text-lg text-base-content/70 mt-1">${day.date} - ${day.city}</p>
    </div>

    <div class="prose max-w-none mb-8">
      <h3>Resumen Narrativo</h3>
      <p>${day.narrative}</p>
      <h3>Logística y Consejos</h3>
      <p>${day.logistics}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-figure text-2xl">💰</div>
        <div class="stat-title">Presupuesto</div>
        <div class="stat-value text-sm">${formatCurrency(dailyTotalCOP, 'COP')}</div>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-figure text-2xl">💪</div>
        <div class="stat-title">Esfuerzo</div>
        <div class="stat-value text-lg">${day.effort}</div>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-figure text-2xl">👟</div>
        <div class="stat-title">Pasos Aprox.</div>
        <div class="stat-value text-lg">${day.steps}</div>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-figure text-2xl">${weatherEmoji}</div>
        <div class="stat-title">Clima</div>
        <div class="stat-value text-sm">${day.weather}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 mb-8">
        <div class="bg-base-200 p-6 rounded-box">
            <h3 class="text-xl font-semibold mb-4">📊 Presupuesto por Categoría</h3>
            <div class="h-64"><canvas id="dailyBudgetChart-day-${day.day}"></canvas></div>
        </div>
    </div>

    <div class="collapse collapse-arrow bg-base-200 mb-8">
      <input type="checkbox" checked />
      <div class="collapse-title text-xl font-medium">
        Plan de Acción Detallado
      </div>
      <div class="collapse-content">
        ${renderDetailedItineraryTable(day, config)}
      </div>
    </div>
  `
}

/**
 * Main render function for the itinerary tab.
 * @param {object} data - The full data object from data.json.
 */
export function renderItineraryTab (data) {
  const { tripData, config } = data
  const itineraryTabContent = document.getElementById('itinerary-tab-content')
  if (!itineraryTabContent) return

  const dayTabs = tripData.days.map((day, index) => `
    <a role="tab" class="tab ${index === 0 ? 'tab-active' : ''}" data-day="${day.day}">Día ${day.day}</a>
  `).join('')

  const dayContents = tripData.days.map((day, index) => `
    <div role="tabpanel" class="py-6 ${index === 0 ? '' : 'hidden'}" data-day-content="${day.day}">
      ${renderDayContent(day, config)}
    </div>
  `).join('')

  itineraryTabContent.innerHTML = `
    <div class="overflow-x-auto">
      <div role="tablist" class="tabs tabs-boxed" id="day-tabs-container">
        ${dayTabs}
      </div>
    </div>
    <div id="day-contents-container">
      ${dayContents}
    </div>
  `

  // Add event listeners for the newly created day tabs
  const dayTabsContainer = document.getElementById('day-tabs-container')
  dayTabsContainer.addEventListener('click', (e) => {
    if (e.target.matches('[role="tab"]')) {
      const day = e.target.dataset.day

      // Update active tab
      dayTabsContainer.querySelectorAll('[role="tab"]').forEach(tab => tab.classList.remove('tab-active'))
      e.target.classList.add('tab-active')

      // Update visible content
      document.querySelectorAll('[data-day-content]').forEach(content => {
        if (content.dataset.dayContent === day) {
          content.classList.remove('hidden')
        } else {
          content.classList.add('hidden')
        }
      })
    }
  })
}

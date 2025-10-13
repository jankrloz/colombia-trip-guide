import { formatCurrency, formatDualCurrency } from './utils.js'
import { getWeatherEmoji } from './charts.js'

const renderLinks = (links) => {
  if (!links || links.length === 0) return ''
  return links
    .map(
      link =>
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline btn-primary mr-2 mb-2 h-auto">📍 ${link.name}</a>`
    )
    .join('')
}

const renderDetailedItineraryTable = (day, config) => {
  const itineraryRows = day.itinerary
    .map(
      item => `
    <tr class="hover">
      <td class="align-top font-semibold p-2">${item.time}</td>
      <td class="align-top p-2">
        <p class="font-semibold text-base">${item.activity}</p>
        <p class="font-bold text-primary text-sm mt-1">${formatDualCurrency(item.cost_cop, config.copToMxnRate, item.prepaid)}</p>
      </td>
      <td class="align-top p-2 text-base">${item.transport}</td>
      <td class="align-top p-2 text-base">${item.comments}</td>
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

const renderDayContent = (day, config, weatherData) => {
  const dailyTotalCOP = day.budgetTable.items.reduce((sum, item) => sum + (item.cost || 0), 0)
  const city = day.city.split('/')[0].trim()

  const monthMap = { Octubre: 9 } // 0-indexed
  const parts = day.date.split(', ')[1].split(' de ')
  const dayOfMonth = parseInt(parts[0], 10)
  const month = monthMap[parts[1]]
  const year = 2025
  const forecastDate = new Date(year, month, dayOfMonth).toISOString().split('T')[0]

  const weatherInfo = weatherData?.[forecastDate]?.[city]
  const avgTemp = weatherInfo ? Math.round((weatherInfo.min + weatherInfo.max) / 2) : 'N/A'
  const weatherEmoji = weatherInfo ? getWeatherEmoji(weatherInfo.descriptions) : '❔'

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
        <div class="stat-value text-lg">${avgTemp}${avgTemp !== 'N/A' ? '°C' : ''}</div>
        <div class="stat-desc text-sm whitespace-normal">${day.weather}</div>
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

    <div class="grid grid-cols-1 gap-8 mb-8">
        <div class="bg-base-200 p-6 rounded-box">
            <h3 class="text-xl font-semibold mb-4">📊 Presupuesto por Categoría</h3>
            <div class="h-64"><canvas id="dailyBudgetChart-day-${day.day}"></canvas></div>
        </div>
    </div>
  `
}

export function renderItineraryTab (data, weatherData) {
  const { tripData, config } = data
  const itineraryTabContent = document.getElementById('itinerary-tab-content')
  if (!itineraryTabContent) return

  const dayTabs = tripData.days.map((day, index) => {
    const city = day.city.split('/')[0].trim()
    return `<a role="tab" class="tab h-16 ${index === 0 ? 'tab-active' : ''}" data-day="${day.day}">Día ${day.day}<br/>${city}</a>`
  }).join('')

  const dayContents = tripData.days.map((day, index) => `
    <div class="py-6 ${index === 0 ? '' : 'hidden'}" data-day-content="${day.day}">
      ${renderDayContent(day, config, weatherData)}
    </div>
  `).join('')

  itineraryTabContent.innerHTML = `
    <div class="overflow-x-auto">
      <div role="tablist" class="tabs tabs-boxed min-w-max" id="day-tabs-container">
        ${dayTabs}
      </div>
    </div>
    <div id="day-contents-container">
      ${dayContents}
    </div>
  `

  const dayTabsContainer = document.getElementById('day-tabs-container')
  dayTabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]')
    if (tab) {
      const day = tab.dataset.day

      dayTabsContainer.querySelectorAll('[role="tab"]').forEach(t => t.classList.remove('tab-active'))
      tab.classList.add('tab-active')

      document.querySelectorAll('[data-day-content]').forEach(content => {
        content.classList.toggle('hidden', content.dataset.dayContent !== day)
      })
    }
  })
}

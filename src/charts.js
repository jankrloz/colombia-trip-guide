import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { categorizeExpense, formatCurrency } from './utils.js'

Chart.register(ChartDataLabels)

// To keep track of chart instances and prevent duplicates
export const chartInstances = {}

/**
 * Fetches weather forecast data from OpenWeather API.
 * @param {string} apiKey - The OpenWeather API key.
 * @returns {Promise<object|null>} A map of dates to high/low temperatures.
 */
async function getWeatherData (apiKey) {
  // Coordinates for Bogotá, a central point for the trip's weather profile.
  const lat = 4.7110
  const lon = -74.0721
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Weather API error: ${response.statusText}`)
      return null
    }
    const data = await response.json()

    // Process data to get daily min/max
    const dailyData = {}
    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0] // Get YYYY-MM-DD
      if (!dailyData[date]) {
        dailyData[date] = {
          min: item.main.temp,
          max: item.main.temp,
          descriptions: new Set()
        }
      }
      dailyData[date].min = Math.min(dailyData[date].min, item.main.temp)
      dailyData[date].max = Math.max(dailyData[date].max, item.main.temp)
      dailyData[date].descriptions.add(item.weather[0].description)
    })

    return dailyData
  } catch (error) {
    console.error('Failed to fetch weather data:', error)
    return null
  }
}

/**
 * Renders the consolidated weather forecast timeline chart.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Array} days - All days of the trip to create the timeline.
 * @param {object} weatherData - The processed data from the API.
 */
function renderWeatherTimelineChart (canvasId, days, weatherData) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const labels = days.map(day => `Día ${day.day}`)
  let minTemps, maxTemps

  if (weatherData) {
    const tripDates = days.map(d => {
      const dateParts = d.date.split(', ')[1].split(' de ')
      const day = parseInt(dateParts[0], 10)
      return `2025-10-${day.toString().padStart(2, '0')}`
    })
    minTemps = tripDates.map(date => weatherData[date]?.min || null)
    maxTemps = tripDates.map(date => weatherData[date]?.max || null)
  } else {
    minTemps = days.map(() => Math.random() * 5 + 12)
    maxTemps = minTemps.map(min => min + Math.random() * 5 + 5)
  }

  if (chartInstances[canvasId]) chartInstances[canvasId].destroy()

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temp. Máx (°C)',
          data: maxTemps,
          borderColor: '#f97316',
          backgroundColor: '#f97316',
          tension: 0.3
        },
        {
          label: 'Temp. Mín (°C)',
          data: minTemps,
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.formattedValue}°C`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            callback: (value) => `${value}°C`
          }
        }
      }
    }
  })
}

/**
 * Renders the daily budget breakdown chart.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {object} day - The specific day's data.
 */
export function renderDailyBudgetChart (canvasId, day) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const budgetItems = day.budgetTable.items
  const categories = {}

  budgetItems.forEach(item => {
    const category = categorizeExpense(item.concept)
    if (!categories[category]) {
      categories[category] = 0
    }
    categories[category] += item.cost
  })

  const labels = Object.keys(categories)
  const data = Object.values(categories)

  if (chartInstances[canvasId]) chartInstances[canvasId].destroy()

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        label: 'Costo por Categoría',
        data,
        backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${formatCurrency(context.raw, 'COP')}`
          }
        }
      }
    }
  })
}

/**
 * Renders the stacked bar chart for daily expenses by category.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Array} days - All days of the trip.
 */
function renderDailyStackedBudgetChart (canvasId, days) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const labels = days.map(day => `Día ${day.day}`)
  const categories = ['Alimentación', 'Actividades', 'Transporte', 'Otros']
  const datasets = categories.map((category, index) => ({
    label: category,
    data: days.map(day =>
      day.budgetTable.items
        .filter(item => categorizeExpense(item.concept) === category)
        .reduce((sum, item) => sum + item.cost, 0)
    ),
    backgroundColor: ['#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'][index]
  }))

  if (chartInstances[canvasId]) chartInstances[canvasId].destroy()

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'Gastos Diarios por Categoría (COP)' },
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw, 'COP')}`
          }
        }
      },
      scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => `${value / 1000}K` } } }
    }
  })
}

/**
 * Orchestrator to render charts for the summary tab.
 * @param {object} data - The full data object from data.json.
 */
export async function renderSummaryCharts (data) {
  const { tripData, config } = data
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
  const weatherData = await getWeatherData(apiKey)

  renderWeatherTimelineChart('weatherTimelineChart', tripData.days, weatherData)
  renderDailyStackedBudgetChart('dailyStackedBudgetChart', tripData.days)
}

/**
 * Orchestrator to render all charts for the itinerary tab.
 * @param {object} data - The full data object from data.json.
 */
export function renderItineraryCharts (data) {
  const { tripData } = data
  tripData.days.forEach(day => {
    renderDailyBudgetChart(`dailyBudgetChart-day-${day.day}`, day)
  })
}
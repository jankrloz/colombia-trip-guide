import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { categorizeExpense, formatCurrency } from './utils.js'

Chart.register(ChartDataLabels)

// To keep track of chart instances and prevent duplicates
export const chartInstances = {}

/**
 * Renders a pie chart for budget distribution by concept.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {object} budgetData - The calculated budget data.
 * @param {object} config - The configuration object with chart colors.
 */
export function renderBudgetByConceptChart (canvasId, budgetData, config) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const labels = budgetData.budgetData.map(item => item.category)
  const data = budgetData.budgetData.map(item => item.cost)

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy()
  }

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        label: 'Costo por Concepto',
        data,
        backgroundColor: config.chartColors,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || ''
              if (label) {
                label += ': '
              }
              if (context.parsed !== null) {
                label += formatCurrency(context.parsed, 'MXN')
              }
              return label
            }
          }
        },
        datalabels: {
          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(2) + '%'
            return percentage
          },
          color: '#fff'
        }
      }
    }
  })
}

/**
 * Renders a bar chart for total cost per destination.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Array} days - The array of day objects from the data.
 * @param {object} config - The configuration object with chart colors.
 */
export function renderDestinationCostChart (canvasId, days, config) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const costsByCity = days.reduce((acc, day) => {
    const city = day.city.split('/')[0].trim()
    const dailyTotal = day.budgetTable.items.reduce((sum, item) => sum + (item.cost || 0), 0)
    if (!acc[city]) {
      acc[city] = 0
    }
    acc[city] += dailyTotal
    return acc
  }, {})

  const labels = Object.keys(costsByCity)
  const data = Object.values(costsByCity)

  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy()
  }

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Costo Total por Destino (COP)',
        data,
        backgroundColor: config.chartColors,
        borderColor: config.chartColors.map(color => color.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return formatCurrency(context.raw, 'COP')
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatCurrency(value, 'COP')
            }
          }
        }
      }
    }
  })
}

/**
 * Returns a set of typical weather data for each city in October.
 * This is a simulation as no real forecast is available for 2025.
 * @returns {object} An object with typical min/max temperatures for each city.
 */
function getTypicalWeatherData () {
  return {
    Cartagena: { min: 25, max: 31 },
    Medellín: { min: 17, max: 27 },
    Salento: { min: 14, max: 23 },
    Bogotá: { min: 9, max: 19 }
  }
}

/**
 * Renders the consolidated weather forecast timeline chart.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Array} days - All days of the trip to create the timeline.
 */
function renderWeatherTimelineChart (canvasId, days) {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const typicalWeatherData = getTypicalWeatherData()
  const labels = days.map(day => `Día ${day.day} (${day.city.split('/')[0].trim()})`)

  const minTemps = days.map(day => {
    const city = day.city.split('/')[0].trim()
    return typicalWeatherData[city]?.min || 0
  })
  const maxTemps = days.map(day => {
    const city = day.city.split('/')[0].trim()
    return typicalWeatherData[city]?.max || 0
  })

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
            label: (context) => {
              const value = Math.round(context.raw)
              return `${context.dataset.label}: ${value}°C`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            precision: 0, // Ensure only whole numbers are shown
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
      scales: { x: { stacked: true }, y: { stacked: true, ticks: { callback: (value) => formatCurrency(value, 'COP') } } }
    }
  })
}

/**
 * Orchestrator to render charts for the summary tab.
 * @param {object} data - The full data object from data.json.
 * @param {object} budgetCalculations - The calculated budget data.
 */
export function renderSummaryCharts (data, budgetCalculations) {
  const { tripData, config } = data
  renderBudgetByConceptChart('budgetByConceptChart', budgetCalculations, config)
  renderDestinationCostChart('destinationCostChart', tripData.days, config)
  renderWeatherTimelineChart('weatherTimelineChart', tripData.days)
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

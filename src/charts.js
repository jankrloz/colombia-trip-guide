import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { categorizeExpense, formatCurrency } from './utils.js'

Chart.register(ChartDataLabels)

// To keep track of chart instances and prevent duplicates
export const chartInstances = {}

const cityCoordinates = {
  Cartagena: { lat: 10.3910, lon: -75.4794 },
  Medellín: { lat: 6.2442, lon: -75.5812 },
  Salento: { lat: 4.6389, lon: -75.5694 },
  Bogotá: { lat: 4.7110, lon: -74.0721 }
}

/**
 * Fetches weather forecast data from OpenWeather API for multiple cities.
 * @param {Array<string>} cities - An array of unique city names.
 * @returns {Promise<object|null>} A nested object with weather data keyed by date and city.
 */
export const getWeatherData = async (cities) => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
  if (!apiKey) {
    console.error('OpenWeather API key is missing. Please add it to your .env file.')
    return null
  }
  const weatherData = {}

  for (const city of cities) {
    const coords = cityCoordinates[city]
    if (!coords) continue

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Weather API error for ${city}: ${response.statusText}`)
        continue
      }
      const data = await response.json()

      data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]
        if (!weatherData[date]) {
          weatherData[date] = {}
        }
        if (!weatherData[date][city]) {
          weatherData[date][city] = { min: item.main.temp, max: item.main.temp, descriptions: new Set() }
        }
        weatherData[date][city].min = Math.min(weatherData[date][city].min, item.main.temp)
        weatherData[date][city].max = Math.max(weatherData[date][city].max, item.main.temp)
        weatherData[date][city].descriptions.add(item.weather[0].main.toLowerCase())
      })
    } catch (error) {
      console.error(`Failed to fetch weather data for ${city}:`, error)
    }
  }
  return Object.keys(weatherData).length > 0 ? weatherData : null
}

/**
 * Returns a weather emoji based on weather description.
 * @param {Set<string>} descriptions - A set of weather descriptions for the day.
 * @returns {string} A single emoji representing the most likely weather.
 */
export const getWeatherEmoji = (descriptions) => {
  if (!descriptions || descriptions.size === 0) return '❔'
  if (descriptions.has('rain')) return '🌧️'
  if (descriptions.has('clouds')) return '☁️'
  if (descriptions.has('clear')) return '☀️'
  return '🌦️' // Default for mixed conditions
}

/**
 * Renders a pie chart for budget distribution by concept.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {object} budgetData - The calculated budget data.
 * @param {object} config - The configuration object with chart colors.
 */
const renderBudgetByConceptChart = (canvasId, budgetData, config) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const labels = budgetData.budgetData.map(item => item.category)
  const data = budgetData.budgetData.map(item => item.cost)

  if (chartInstances[canvasId]) chartInstances[canvasId].destroy()

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
        legend: { position: 'right' },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.label}: ${formatCurrency(context.parsed, 'MXN')}`
          }
        },
        datalabels: {
          formatter: (value, ctx) => {
            const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0)
            return `${((value / total) * 100).toFixed(2)}%`
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
const renderDestinationCostChart = (canvasId, days, config) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const costsByCity = days.reduce((acc, day) => {
    const city = day.city.split('/')[0].trim()
    const dailyTotal = day.budgetTable.items.reduce((sum, item) => sum + (item.cost || 0), 0)
    if (!acc[city]) acc[city] = 0
    acc[city] += dailyTotal
    return acc
  }, {})

  const labels = Object.keys(costsByCity)
  const data = Object.values(costsByCity)

  if (chartInstances[canvasId]) chartInstances[canvasId].destroy()

  chartInstances[canvasId] = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Costo Total por Destino (COP)',
        data,
        backgroundColor: config.chartColors
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.raw, 'COP')
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value, 'COP')
          }
        }
      }
    }
  })
}

/**
 * Renders the consolidated weather forecast timeline chart.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {Array} days - All days of the trip to create the timeline.
 * @param {object} weatherData - The processed data from the API.
 */
export const renderWeatherTimelineChart = (canvasId, days, weatherData) => {
  const canvas = document.getElementById(canvasId)
  if (!canvas) return

  const labels = days.map(day => `Día ${day.day} (${day.city.split('/')[0].trim()})`)
  let minTemps = []
  let maxTemps = []

  if (weatherData) {
    // Simulate that "today" is the beginning of the trip for fetching forecasts
    const tripStartDate = new Date('2025-10-10T00:00:00')

    const tripDates = days.map(d => {
      const dayOfMonth = parseInt(d.date.split(', ')[1].split(' de ')[0], 10)
      const forecastDate = new Date(tripStartDate.getFullYear(), tripStartDate.getMonth(), dayOfMonth)
      return forecastDate.toISOString().split('T')[0]
    })

    minTemps = tripDates.map((date, index) => {
      const day = days[index]
      const city = day.city.split('/')[0].trim()
      return weatherData[date]?.[city] ? Math.round(weatherData[date][city].min) : null
    })
    maxTemps = tripDates.map((date, index) => {
      const day = days[index]
      const city = day.city.split('/')[0].trim()
      return weatherData[date]?.[city] ? Math.round(weatherData[date][city].max) : null
    })
  }

  if (minTemps.every(t => t === null)) {
    console.warn('No live weather data available for the upcoming days. The chart will be empty.')
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
            label: (context) => {
              const value = context.raw
              return value !== null ? `${context.dataset.label}: ${Math.round(value)}°C` : 'No data'
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            precision: 0,
            callback: (value) => `${value}°C`
          }
        }
      }
    }
  })
}

export const renderDailyBudgetChart = (canvasId, day) => {
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

export const renderDailyStackedBudgetChart = (canvasId, days) => {
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

export const renderSummaryCharts = (data, budgetCalculations, weatherData) => {
  const { tripData, config } = data
  renderBudgetByConceptChart('budgetByConceptChart', budgetCalculations, config)
  renderDestinationCostChart('destinationCostChart', tripData.days, config)
  renderWeatherTimelineChart('weatherTimelineChart', tripData.days, weatherData)
  renderDailyStackedBudgetChart('dailyStackedBudgetChart', tripData.days)
}

export const renderItineraryCharts = (data) => {
  const { tripData } = data
  tripData.days.forEach(day => {
    renderDailyBudgetChart(`dailyBudgetChart-day-${day.day}`, day)
  })
}

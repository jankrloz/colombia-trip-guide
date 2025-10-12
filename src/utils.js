/**
 * Formats a number into a specified currency, including the currency code.
 * @param {number} value - The numeric value to format.
 * @param {string} currency - The currency code (e.g., 'COP', 'MXN').
 * @returns {string} The formatted currency string.
 */
export function formatCurrency (value, currency = 'COP') {
  const options = {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'COP' ? 0 : 2
  }
  const locale = currency === 'COP' ? 'es-CO' : 'es-MX'
  const formattedValue = new Intl.NumberFormat(locale, options).format(value)
  return `${formattedValue}` // The Intl.NumberFormat already includes the currency symbol
}

/**
 * Formats a value in COP and its approximate equivalent in MXN.
 * @param {number} valueCOP - The value in Colombian Pesos.
 * @param {number} copToMxnRate - The conversion rate from COP to MXN.
 * @param {boolean} [prepaid=false] - Whether the item is prepaid.
 * @returns {string} The formatted dual currency string.
 */
export function formatDualCurrency (valueCOP, copToMxnRate, prepaid = false) {
  if (prepaid) return 'Pre-pagado'
  if (typeof valueCOP !== 'number' || isNaN(valueCOP)) return 'N/A'
  if (valueCOP === 0) return 'Gratis'

  const mxnValue = valueCOP * copToMxnRate
  const formattedCOP = formatCurrency(valueCOP, 'COP')
  const formattedMXN = formatCurrency(mxnValue, 'MXN')

  return `${formattedCOP} / ~${formattedMXN}`
}

/**
 * Categorizes an expense based on its concept string.
 * @param {string} concept - The description of the expense.
 * @returns {string} The category of the expense.
 */
export function categorizeExpense (concept) {
  const lowerConcept = concept.toLowerCase()
  if (
    ['almuerzo', 'cena', 'bebida', 'desayuno', 'degustación'].some(c => lowerConcept.includes(c))
  ) { return 'Alimentación' }
  if (
    [
      'tour',
      'entrada',
      'pass',
      'peinado',
      'impuesto portuario',
      'tiquete',
      'foto'
    ].some(c => lowerConcept.includes(c))
  ) { return 'Actividades' }
  if (
    [
      'taxi',
      'metro',
      'buseta',
      'jeep',
      'traslado',
      'bus',
      'funicular'
    ].some(c => lowerConcept.includes(c))
  ) { return 'Transporte' }
  return 'Otros'
}

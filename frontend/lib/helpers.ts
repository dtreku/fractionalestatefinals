// frontend/lib/helpers.ts
// ============================================================================
// HELPER FUNCTIONS
// Utility functions for data conversion and formatting
// ============================================================================

/**
 * Convert Supabase numeric/decimal fields to JavaScript numbers
 * Supabase returns NUMERIC fields as strings or objects with high precision
 */
export function normalizeProperty(property: any): any {
  if (!property) return null;

  return {
    ...property,
    // Convert all numeric fields to JavaScript numbers
    total_valuation: toNumber(property.total_valuation),
    token_price: toNumber(property.token_price),
    total_tokens: toNumber(property.total_tokens),
    tokens_available: toNumber(property.tokens_available),
    minimum_investment: toNumber(property.minimum_investment),
    square_feet: toNumber(property.square_feet),
    year_built: toNumber(property.year_built),
    bedrooms: toNumber(property.bedrooms),
    bathrooms: toNumber(property.bathrooms),
    parking_spaces: toNumber(property.parking_spaces),
    lot_size: toNumber(property.lot_size),
    annual_rent_income: toNumber(property.annual_rent_income),
    occupancy_rate: toNumber(property.occupancy_rate),
    cap_rate: toNumber(property.cap_rate),
    management_fee_percent: toNumber(property.management_fee_percent),
    latitude: toNumber(property.latitude),
    longitude: toNumber(property.longitude),
  };
}

/**
 * Convert a value to a JavaScript number
 * Handles strings, Decimal objects, null, undefined
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  // If it's already a number, return it
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  // If it's a string, parse it
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // If it's an object (like Decimal), try to convert
  if (typeof value === 'object') {
    // Try toString() then parse
    if (typeof value.toString === 'function') {
      const str = value.toString();
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    }
    // Try valueOf()
    if (typeof value.valueOf === 'function') {
      const num = value.valueOf();
      if (typeof num === 'number') {
        return isNaN(num) ? 0 : num;
      }
    }
  }
  
  return 0;
}

/**
 * Normalize an array of properties
 */
export function normalizeProperties(properties: any[]): any[] {
  if (!Array.isArray(properties)) return [];
  return properties.map(normalizeProperty);
}

/**
 * Safe format currency - handles any input type
 */
export function safeFormatCurrency(value: any): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Safe format number - handles any input type
 */
export function safeFormatNumber(value: any): string {
  const num = toNumber(value);
  return new Intl.NumberFormat('en-US').format(num);
}





















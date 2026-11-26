export const DATA_LAYERS = [
  'restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'cinema', 'hospital', 'clinic',
  'pharmacy', 'dentist', 'school', 'university', 'library', 'bank', 'atm', 'shop',
  'mall', 'supermarket', 'gym', 'parking', 'fuel', 'police', 'fire_station', 'hotel',
  'post_office', 'bus_station'
];

export function placeCategory(tags = {}) {
  return tags.amenity || tags.shop || tags.tourism || tags.leisure || 'unknown';
}

export const layerColors = {
  restaurant: '#bc4c38', cafe: '#75472d', bar: '#80459a', fast_food: '#d78415',
  pub: '#955b75', cinema: '#b52d78', hospital: '#24846a', clinic: '#6a9b39',
  pharmacy: '#078f96', dentist: '#427e98', school: '#976c16', university: '#5e59aa',
  library: '#af7661', bank: '#49653b', atm: '#88a13a', shop: '#b75684',
  mall: '#8b4850', supermarket: '#497f44', gym: '#b45614', parking: '#486a87',
  fuel: '#a08237', police: '#2b5489', fire_station: '#9c3032', hotel: '#436bc2',
  post_office: '#777439', bus_station: '#625978',
};
export const DATA_LAYERS = Object.keys(layerColors);

export function markerCategory(tags = {}, layers = DATA_LAYERS) {
  const matches = [
    tags.amenity, tags.tourism, tags.leisure === 'fitness_centre' ? 'gym' : tags.leisure,
    tags.shop, tags.shop && 'shop',
  ].filter(key => Object.hasOwn(layerColors, key));
  return matches.find(key => layers.includes(key)) || matches[0] || 'other';
}

export function markerColor(category) {
  return layerColors[category] || '#65736d';
}

export function placeCategory(tags = {}) {
  return tags.amenity || tags.shop || tags.tourism || tags.leisure || 'unknown';
}

import L from 'leaflet';

export const seriesColors = [
  '#2c6b59', '#849a63', '#a0754f', '#526f77', '#977a86',
  '#648879', '#aa924f', '#626c51', '#977263', '#647d91',
];

const symbolGroups = {
  food: ['restaurant', 'cafe', 'bar', 'fast_food', 'pub'],
  health: ['hospital', 'pharmacy', 'clinic', 'dentist'],
  education: ['school', 'university', 'library'],
};
const placeIcons = Object.fromEntries([...Object.keys(symbolGroups), 'other'].map(group => [
  group, L.divIcon({
    className: 'place-symbol symbol-' + group,
    iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10],
  }),
]));

export function iconForPlace(tags = {}) {
  const group = Object.keys(symbolGroups).find(key => symbolGroups[key].includes(tags.amenity));
  return placeIcons[group || 'other'];
}

export const locationIcon = L.divIcon({
  className: 'location-symbol',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

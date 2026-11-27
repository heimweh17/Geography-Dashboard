import L from 'leaflet';
import { DATA_LAYERS, markerColor } from './mapLayers';

export const seriesColors = [
  '#2c6b59', '#849a63', '#a0754f', '#526f77', '#977a86',
  '#648879', '#aa924f', '#626c51', '#977263', '#647d91',
];

export const placeIcons = Object.fromEntries([...DATA_LAYERS, 'other'].map(category => [
  category, L.divIcon({
    className: 'place-symbol',
    html: '<span class="place-pin" style="--pin-color:' + markerColor(category) + '"></span>',
    iconSize: [22, 28], iconAnchor: [11, 26], popupAnchor: [0, -23],
  }),
]));

export const locationIcon = L.divIcon({
  className: 'location-symbol',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

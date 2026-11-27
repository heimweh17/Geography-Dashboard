import { markerColor } from '../config/mapLayers';

export default function MapLegend({ categories }) {
  const visible = [...new Set(categories)].sort();
  if (!visible.length) return null;
  return (
    <ul className="map-legend" aria-label="Map marker colors">
      {visible.map(category => (
        <li key={category}>
          <span aria-hidden="true" style={{ backgroundColor: markerColor(category) }} />
          {category.replaceAll('_', ' ')}
        </li>
      ))}
    </ul>
  );
}

import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowLeft, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  calculateCircleArea, 
  calculateDensity, 
  calculateDiversityIndex, 
  calculateNearestNeighborIndex,
  analyzeAmenityBreakdown,
  interpretSpatialPattern
} from '../utlis/gisAnalytics';

// COLORFUL palette for Primary Categories (easy to distinguish)


const AnalyticsPanel = ({ 
  data, 
  loading, error,
  amenityLabel, 
  onCategoryClick, 
  activeFilter, 
  onClearFilter,
  searchRadius,
  customPolygon 
}) => {
  
  const [showSubcategories, setShowSubcategories] = useState(true);
  
  // Calculate advanced metrics
  const metrics = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const area = customPolygon 
      ? calculatePolygonArea(customPolygon) 
      : calculateCircleArea(searchRadius);
    
    const total = data.length;
    const breakdown = analyzeAmenityBreakdown(data);
    
    const density = calculateDensity(total, area);
    const diversityIndex = calculateDiversityIndex(breakdown.byAmenity);
    const spatialPattern = calculateNearestNeighborIndex(data, area);
    const pattern = interpretSpatialPattern(spatialPattern);
    
    const walkabilityScore = Math.min(
      (density / 50) * 50 + (diversityIndex / 2.5) * 50,
      100
    );
    
    // PRIMARY CATEGORIES
    const topAmenities = Object.entries(breakdown.byAmenity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ 
        name: name.replace(/_/g, ' '), 
        value,
        key: name 
      }));
    
    // SUBCATEGORIES
    const subcategories = [];
    
    Object.entries(breakdown.byCuisine).forEach(([cuisine, count]) => {
      subcategories.push({
        name: cuisine,
        value: count,
        type: 'Cuisine',
        icon: '🍽️'
      });
    });
    
    Object.entries(breakdown.byReligion).forEach(([religion, count]) => {
      subcategories.push({
        name: religion,
        value: count,
        type: 'Religion',
        icon: '⛪'
      });
    });
    
    Object.entries(breakdown.bySchoolType).forEach(([schoolType, count]) => {
      subcategories.push({
        name: schoolType,
        value: count,
        type: 'Education',
        icon: '🎓'
      });
    });
    
    subcategories.sort((a, b) => b.value - a.value);
    const topSubcategories = subcategories.slice(0, 10);
    
    const topNames = {};
    data.forEach(item => {
      const name = item.tags?.name || "Unknown";
      topNames[name] = (topNames[name] || 0) + 1;
    });
    
    const topLocations = Object.entries(topNames)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name: name.substring(0, 15), count }));
    
    const chainPct = (breakdown.chainsVsIndependent.chains / total) * 100;
    const independentPct = (breakdown.chainsVsIndependent.independent / total) * 100;
    const accessibilityPct = (breakdown.accessibilityCount / total) * 100;
    
    return {
      total,
      area: area.toFixed(2),
      density: density.toFixed(2),
      diversityIndex: diversityIndex.toFixed(3),
      spatialPattern: spatialPattern.toFixed(3),
      pattern: pattern.pattern,
      walkabilityScore: walkabilityScore.toFixed(0),
      topAmenities,
      topSubcategories,
      topLocations,
      breakdown,
      chainPct: chainPct.toFixed(1),
      independentPct: independentPct.toFixed(1),
      accessibilityPct: accessibilityPct.toFixed(1),
      cuisineCount: Object.keys(breakdown.byCuisine).length
    };
  }, [data, searchRadius, customPolygon]);

  if (!metrics) {
    return (
      <div className="w-full lg:w-80 p-6 bg-white dark:bg-mineral-900 border-l border-mineral-300 dark:border-mineral-700 flex flex-col items-center justify-center text-center h-full">
        {activeFilter ? (
          <>
            <p className="text-mineral-600 dark:text-mineral-400 mb-4">No results for "{activeFilter}"</p>
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 px-4 py-2 bg-mineral-100 dark:bg-mineral-800 text-mineral-700 dark:text-mineral-300 border border-mineral-300 dark:border-mineral-600 hover:bg-mineral-200 dark:hover:bg-mineral-700 transition rounded"
            >
              <ArrowLeft size={16} /> Go Back
            </button>
          </>
        ) : (
          <>
            <Database size={24} className="mb-3 text-mineral-500" />
            <h3 className="font-semibold">{loading ? 'Finding places…' : error ? 'Search unavailable' : 'No places in this area'}</h3>
            <p className="text-sm text-mineral-600 dark:text-mineral-400 mt-2">
              {loading ? 'Results will appear here.' : error || 'Try a larger radius or choose another map layer.'}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 h-full flex flex-col bg-white dark:bg-mineral-900 border-l border-mineral-300 dark:border-mineral-700 overflow-y-auto">
      <div className="p-6 space-y-6">
        
        {/* Header */}
        {activeFilter ? (
          <div>
            <button 
              onClick={onClearFilter} 
              className="flex items-center gap-2 text-sm text-forest-700 dark:text-forest-400 hover:text-forest-900 dark:hover:text-forest-300 mb-2 transition"
            >
              <ArrowLeft size={16} /> Back to all results
            </button>
            <h2 className="text-lg font-bold text-mineral-900 dark:text-mineral-100">
              Filtered: {activeFilter}
            </h2>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-mineral-900 dark:text-mineral-100 flex items-center gap-2">
              <Database size={20} className="text-forest-700 dark:text-forest-400" />
              Analysis Results
            </h2>
            <p className="text-xs text-mineral-500 dark:text-mineral-400 mt-1">
              {customPolygon ? 'Custom polygon area' : `Radius: ${(searchRadius/1000).toFixed(1)} km`}
            </p>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 border-y border-mineral-300 py-3 dark:border-mineral-700">
          <div>
            <strong className="block text-3xl tabular-nums">{metrics.total}</strong>
            <span className="text-sm">Mapped places</span>
          </div>
          <div className="text-right">
            <strong className="block text-lg tabular-nums">{metrics.area} km²</strong>
            <span className="text-sm">Study area</span>
          </div>
        </div>

        {!activeFilter && metrics.topAmenities.length > 0 && (
          <section className="category-list">
            <h3>Places by category</h3>
            {metrics.topAmenities.map(({ key, name, value }) => (
              <button key={key} onClick={() => onCategoryClick(key)} aria-label={`Filter by ${name}, ${value} places`}>
                <span>{name}</span><strong>{value}</strong>
                <span className="category-track" aria-hidden="true">
                  <span style={{ width: (100 * value / metrics.total) + '%' }} />
                </span>
              </button>
            ))}
          </section>
        )}

        {/* SUBCATEGORIES - EXPANDABLE TABLE */}
        {!activeFilter && metrics.topSubcategories.length > 0 && (
          <div className="border border-mineral-300 dark:border-mineral-700 rounded-lg bg-mineral-50 dark:bg-mineral-800/50">
            <button
              onClick={() => setShowSubcategories(!showSubcategories)}
              className="w-full p-4 flex items-center justify-between hover:bg-mineral-100 dark:hover:bg-mineral-700/50 transition rounded-t-lg"
            >
              <div className="text-left">
                <h3 className="text-sm font-bold text-mineral-900 dark:text-mineral-100">
                  Subcategories ({metrics.topSubcategories.length})
                </h3>
                <p className="text-xs text-mineral-500 dark:text-mineral-400 mt-0.5">
                  Detailed breakdown by type
                </p>
              </div>
              {showSubcategories ? 
                <ChevronUp size={18} className="text-mineral-600 dark:text-mineral-400" /> :
                <ChevronDown size={18} className="text-mineral-600 dark:text-mineral-400" />
              }
            </button>

            {showSubcategories && (
              <div className="border-t border-mineral-300 dark:border-mineral-600">
                {/* Add hint text */}
                <div className="px-4 py-2 bg-forest-50 dark:bg-forest-900/20 border-b border-mineral-300 dark:border-mineral-600">
                  <p className="text-xs text-forest-700 dark:text-forest-400 italic">
                    Click any row to filter map results
                  </p>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-mineral-200 dark:bg-mineral-700 sticky top-0">
                      <tr className="border-b border-mineral-300 dark:border-mineral-600">
                        <th className="text-left p-2 font-semibold text-mineral-700 dark:text-mineral-300">Type</th>
                        <th className="text-left p-2 font-semibold text-mineral-700 dark:text-mineral-300">Category</th>
                        <th className="text-right p-2 font-semibold text-mineral-700 dark:text-mineral-300">Count</th>
                        <th className="text-right p-2 font-semibold text-mineral-700 dark:text-mineral-300">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.topSubcategories.map((sub, idx) => (
                        <tr
                          key={idx}
                          onClick={() => onCategoryClick(sub.name)}
                          className="border-b border-mineral-200 dark:border-mineral-700 hover:bg-forest-50 dark:hover:bg-mineral-700 cursor-pointer transition"
                        >
                          <td className="p-2 text-mineral-600 dark:text-mineral-400">
                            {sub.type}
                          </td>
                          <td className="p-2 text-mineral-900 dark:text-mineral-100 font-medium capitalize">
                            {sub.name}
                          </td>
                          <td className="p-2 text-right text-mineral-900 dark:text-mineral-100 tabular-nums">
                            {sub.value}
                          </td>
                          <td className="p-2 text-right text-mineral-600 dark:text-mineral-400 tabular-nums">
                            {((sub.value / metrics.total) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DETAILED METRICS GRID */}
        <div className="border border-mineral-300 dark:border-mineral-700 rounded-lg p-4 bg-mineral-50 dark:bg-mineral-800/50">
          <h3 className="text-sm font-bold text-mineral-900 dark:text-mineral-100 mb-3 pb-2 border-b border-mineral-300 dark:border-mineral-600">
            Statistical Metrics
          </h3>
          <div className="space-y-3">
            
            {/* Density */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-mineral-600 dark:text-mineral-400">Density (points/km²)</span>
              <span className="text-sm tabular-nums font-bold text-mineral-900 dark:text-mineral-100">{metrics.density}</span>
            </div>
            
            {/* Diversity Index */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-mineral-600 dark:text-mineral-400">Shannon Diversity Index</span>
              <span className="text-sm tabular-nums font-bold text-mineral-900 dark:text-mineral-100">{metrics.diversityIndex}</span>
            </div>
            
            {/* Spatial Pattern */}
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-mineral-600 dark:text-mineral-400">Spatial Pattern (NNI)</span>
              <div className="text-right">
                <span className="text-sm font-bold text-mineral-900 dark:text-mineral-100">{metrics.pattern}</span>
                <span className="text-xs text-mineral-500 dark:text-mineral-400 ml-2 tabular-nums">({metrics.spatialPattern})</span>
              </div>
            </div>
            
            {/* Walkability */}
            <div className="pt-2 border-t border-mineral-200 dark:border-mineral-700">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs text-mineral-600 dark:text-mineral-400">Walkability Score</span>
                <span className="text-sm font-bold text-mineral-900 dark:text-mineral-100">{metrics.walkabilityScore}/100</span>
              </div>
              <div className="w-full bg-mineral-300 dark:bg-mineral-700 rounded-full h-2">
                <div 
                  className="bg-forest-600 dark:bg-forest-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.walkabilityScore}%` }}
                />
              </div>
            </div>
            
          </div>
        </div>

        {/* BUSINESS CHARACTERISTICS */}
        <div className="border border-mineral-300 dark:border-mineral-700 rounded-lg p-4 bg-mineral-50 dark:bg-mineral-800/50">
          <h3 className="text-sm font-bold text-mineral-900 dark:text-mineral-100 mb-3 pb-2 border-b border-mineral-300 dark:border-mineral-600">
            Business Characteristics
          </h3>
          <div className="space-y-3">
            
            {/* Chain vs Independent */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mineral-600 dark:text-mineral-400">Chain Businesses</span>
                <span className="tabular-nums text-mineral-900 dark:text-mineral-100">{metrics.chainPct}%</span>
              </div>
              <div className="w-full bg-mineral-300 dark:bg-mineral-700 rounded-full h-1.5">
                <div 
                  className="bg-mineral-600 dark:bg-mineral-500 h-1.5 rounded-full"
                  style={{ width: `${metrics.chainPct}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-mineral-600 dark:text-mineral-400">Independent</span>
                <span className="tabular-nums text-mineral-900 dark:text-mineral-100">{metrics.independentPct}%</span>
              </div>
              <div className="w-full bg-mineral-300 dark:bg-mineral-700 rounded-full h-1.5">
                <div 
                  className="bg-forest-600 dark:bg-forest-500 h-1.5 rounded-full"
                  style={{ width: `${metrics.independentPct}%` }}
                />
              </div>
            </div>
            
            {/* Accessibility */}
            {metrics.accessibilityPct > 0 && (
              <div className="pt-2 border-t border-mineral-200 dark:border-mineral-700">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-mineral-600 dark:text-mineral-400">Wheelchair Accessible</span>
                  <span className="tabular-nums text-mineral-900 dark:text-mineral-100">{metrics.accessibilityPct}%</span>
                </div>
                <div className="w-full bg-mineral-300 dark:bg-mineral-700 rounded-full h-1.5">
                  <div 
                    className="bg-mineral-700 dark:bg-mineral-400 h-1.5 rounded-full"
                    style={{ width: `${metrics.accessibilityPct}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Cuisine Count */}
            {metrics.cuisineCount > 0 && (
              <div className="pt-2 border-t border-mineral-200 dark:border-mineral-700">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-mineral-600 dark:text-mineral-400">Cuisine Varieties</span>
                  <span className="text-sm font-bold text-mineral-900 dark:text-mineral-100">{metrics.cuisineCount}</span>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* TOP LOCATIONS */}
        <div className="border border-mineral-300 dark:border-mineral-700 rounded-lg p-4 bg-mineral-50 dark:bg-mineral-800/50">
          <h3 className="text-sm font-bold text-mineral-900 dark:text-mineral-100 mb-3 pb-2 border-b border-mineral-300 dark:border-mineral-600">
            Most Frequent Locations
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topLocations} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={85} 
                  tick={{ fontSize: 10, fill: 'var(--quiet)' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} 
                  contentStyle={{ 
                    backgroundColor: 'var(--paper)',
                    border: '1px solid var(--edge)',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }} 
                />
                <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={16}>
                  {metrics.topLocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#2c6451" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

// Calculate polygon area
const calculatePolygonArea = (coords) => {
  if (!coords || coords.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i].lat * coords[j].lng;
    area -= coords[j].lat * coords[i].lng;
  }
  area = Math.abs(area / 2);
  
  const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
  const kmPerDegreeLat = 111;
  const kmPerDegreeLng = 111 * Math.cos(avgLat * Math.PI / 180);
  
  return area * kmPerDegreeLat * kmPerDegreeLng;
};

export default AnalyticsPanel;
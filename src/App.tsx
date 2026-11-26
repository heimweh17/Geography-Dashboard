/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import orlandoSnapshot from './assets/orlando-restaurants.json';
import { placeCategory } from './config/mapLayers';
import { downloadCSV } from './utlis/exportUtils';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import AnalyticsPanel from './components/AnalyticsPanel';
import SavePlaceModal from './components/SavePlaceModal';
import SavedPlacesModal from './components/SavedPlacesModal';
import { searchCity, fetchAmenities, fetchRoute } from './api/osmService';
import { savePlace, isPlaceSaved } from './services/savedPlacesService';
import { useAuth } from './contexts/AuthContext';
import { Menu, Star } from 'lucide-react';
function App() {
  const { user } = useAuth();
  
  // Map state
  const [city, setCity] = useState('Orlando, FL');
  const [coordinates, setCoordinates] = useState(orlandoSnapshot.center);
  const [amenities, setAmenities] = useState(['restaurant']);
  const [radius, setRadius] = useState(orlandoSnapshot.radius);
  const [data, setData] = useState(orlandoSnapshot.elements);
  const [snapshotDate, setSnapshotDate] = useState(orlandoSnapshot.asOf);
  const queryVersion = useRef(0);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [customPolygon, setCustomPolygon] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // Mobile sidebar toggle
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  // Save place state
  const [showSavePlaceModal, setShowSavePlaceModal] = useState(false);
  const [placeToSave, setPlaceToSave] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);
  
  // Track saved place viewing
  const [savedPlaceView, setSavedPlaceView] = useState(null);
  const [previousMapState, setPreviousMapState] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => console.log('Location access denied')
      );
    }
    loadData(coordinates[0], coordinates[1], amenities, radius, null);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0c1e3e';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f1f5f9';
    }
  }, [isDarkMode]);

  const loadData = async (lat, lon, amenityList, rad, poly = null) => {
    const version = ++queryVersion.current;
    const useSnapshot = !poly && lat === orlandoSnapshot.center[0] && lon === orlandoSnapshot.center[1]
      && rad === orlandoSnapshot.radius && amenityList.length === 1 && amenityList[0] === 'restaurant';
    setLoading(true);
    setSnapshotDate(useSnapshot ? orlandoSnapshot.asOf : null);
    setData(useSnapshot ? orlandoSnapshot.elements : []);
    setRouteData(null);
    setCategoryFilter(null);
    setSelectedPlace(null);
    setDataError('');

    try {
      const results = await fetchAmenities(lat, lon, amenityList, rad, poly);
      if (version === queryVersion.current) {
        setData(results);
        setSnapshotDate(null);
      }
    } catch (error) {
      console.error(error);
      if (!useSnapshot && version === queryVersion.current) setDataError('Map data is temporarily unavailable. Please try again in a moment.');
    } finally {
      if (version === queryVersion.current) setLoading(false);
    }
  };

  const filteredData = categoryFilter
    ? data.filter((item) => {
        const tags = item.tags || {};
        
        if (placeCategory(tags).toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const cuisine = tags.cuisine || '';
        if (cuisine.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const religion = tags.religion || '';
        if (religion.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        const schoolType = tags['school:type'] || '';
        if (schoolType.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return true;
        }
        
        return false;
      })
    : data;

  const handleCitySearch = async (cityName) => {
    const version = ++queryVersion.current;
    setLoading(true);
    setCategoryFilter(null);
    setSnapshotDate(null);
    setData([]);
    setRouteData(null);
    setSelectedPlace(null);
    setDataError('');
    try {
      const location = await searchCity(cityName);
      if (version !== queryVersion.current) return;
      if (location) {
        setShowLeftSidebar(false);
        setCity(location.display_name);
        setCoordinates([location.lat, location.lon]);
        setCustomPolygon(null);
        await loadData(location.lat, location.lon, amenities, radius, null);
      } else {
        setDataError('City not found. Please check the spelling and try again.');
      }
    } catch (error) {
      console.error(error);
      if (version === queryVersion.current) setDataError('City search is temporarily unavailable. Please try again in a moment.');
    } finally {
      if (version === queryVersion.current) setLoading(false);
    }
  };

  const handleAmenityChange = (newAmenities) => {
    setAmenities(newAmenities);
    loadData(coordinates[0], coordinates[1], newAmenities, radius, customPolygon);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (!customPolygon) loadData(coordinates[0], coordinates[1], amenities, newRadius, null);
  };

  const onShapeCreated = (e) => {
    const layer = e.layer;
    const coords = layer.getLatLngs()[0];
    setCustomPolygon(coords);
    setSelectedPlace(null);
    loadData(coordinates[0], coordinates[1], amenities, radius, coords);
  };

  const onShapeDeleted = () => {
    setCustomPolygon(null);
    setSelectedPlace(null);
    loadData(coordinates[0], coordinates[1], amenities, radius, null);
  };

  const handleMarkerClick = async (item, triggerRouting = false) => {
    setSelectedPlace(item);

    if (triggerRouting && userLocation) {
      const destLat = item.lat || item.center.lat;
      const destLon = item.lon || item.center.lon;
      setLoading(true);
      const route = await fetchRoute(userLocation[0], userLocation[1], destLat, destLon);
      setRouteData(route);
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
  };

  const handleCategorySelect = (categoryName) => {
    setCategoryFilter(categoryName);
  };

  const clearFilter = () => {
    setCategoryFilter(null);
  };

  const clearSelectedPlace = () => {
    setSelectedPlace(null);
    setSavedPlaceView(null);
  };

  // SAVE PLACE FUNCTIONALITY
  const handleSavePlace = (place) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    
    setPlaceToSave(place);
    setShowSavePlaceModal(true);
  };

  const handleConfirmSave = async (saveData) => {
    const place = placeToSave;
    const lat = place.lat || place.center?.lat;
    const lon = place.lon || place.center?.lon;

    try {
      // Check if already saved
      const alreadySaved = await isPlaceSaved(user.id, lat, lon);
      if (alreadySaved) {
        alert('This place is already saved!');
        return;
      }

      

      await savePlace({
        name: place.tags?.name || 'Unnamed Place',
        category: saveData.category,
        lat,
        lon,
        tags: place.tags || {},
        notes: saveData.notes
      });

      alert('Place saved successfully! ⭐');
    } catch (error) {
      console.error('Error saving place:', error);
      throw error;
    }
  };

  // SAVED PLACE VIEWING
  // SAVED PLACE VIEWING
  // SAVED PLACE VIEWING
// SAVED PLACE VIEWING
  const handleSavedPlaceClick = (savedPlaceCoords, place) => {
    // Store CURRENT state before navigating (not the saved place coords!)
    setPreviousMapState({
      coordinates: [...coordinates],  // Current map position, not saved place position
      selectedPlace,
      data: [...data],
      customPolygon,
      categoryFilter
    });

    // Clear search results and filters
    setCustomPolygon(null);
    setCategoryFilter(null);

    // Create a marker for the saved place
    const savedPlaceMarker = {
      lat: place.lat,
      lon: place.lon,
      id: place.id,
      tags: place.tags || {
        name: place.place_name,
        amenity: place.amenity_type
      }
    };

    // Set ONLY the saved place as data (so it shows a marker)
    setData([savedPlaceMarker]);

    // Move map to saved place coordinates
    setCoordinates(savedPlaceCoords);
    setSelectedPlace({
      lat: place.lat,
      lon: place.lon,
      tags: place.tags || {
        name: place.place_name,
        amenity: place.amenity_type
      },
      savedPlace: true,
      savedPlaceData: place
    });
    setSavedPlaceView(place);
  };
  const closeSavedPlaceView = () => {
    if (previousMapState) {
      // Restore everything
      setCoordinates(previousMapState.coordinates);
      setSelectedPlace(previousMapState.selectedPlace);
      setData(previousMapState.data || []);           // Restore data
      setCustomPolygon(previousMapState.customPolygon); // Restore polygon
      setCategoryFilter(previousMapState.categoryFilter); // Restore filter
    } else {
      setSelectedPlace(null);
    }
    setSavedPlaceView(null);
    setPreviousMapState(null);
  };

  const amenityLabel =
    amenities.length === 1
      ? amenities[0].replace(/_/g, ' ')
      : `${amenities.length} layers`;

  return (
    <div className="flex flex-col md:flex-row h-dvh w-full overflow-hidden bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 font-sans">
      
      {/* Mobile Toggle Buttons */}
      <nav aria-label="Workspace panels" className="mobile-tools md:hidden">
        <button aria-expanded={showLeftSidebar} onClick={() => { setShowLeftSidebar(!showLeftSidebar); setShowRightSidebar(false); }}>
          <Menu size={17} /> Explore
        </button>
        <button aria-pressed={!showLeftSidebar && !showRightSidebar} onClick={() => { setShowLeftSidebar(false); setShowRightSidebar(false); }}>Map</button>
        <button aria-expanded={showRightSidebar} onClick={() => { setShowRightSidebar(!showRightSidebar); setShowLeftSidebar(false); }}>Results</button>
      </nav>

      {/* Left Sidebar */}
      <div className={`
        workspace-panel fixed md:relative
        inset-y-0 left-0
        z-[999]
        w-full md:w-80
        transform transition-transform duration-300 ease-in-out
        ${showLeftSidebar ? 'translate-x-0' : 'invisible md:visible -translate-x-full md:translate-x-0'}
      `}>
        <Sidebar key={user?.id ?? "guest"}
          onSearch={handleCitySearch}
          onAmenityChange={handleAmenityChange}
          onRadiusChange={handleRadiusChange}
          canExport={filteredData.length > 0}
          onExport={() => downloadCSV(filteredData)}
          loading={loading && !snapshotDate}
          selectedAmenities={amenities}
          searchRadius={radius}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          isDarkMode={isDarkMode}
          toggleHeatmap={() => setShowHeatmap(!showHeatmap)}
          showHeatmap={showHeatmap}
          customPolygon={customPolygon}
          onShowSavedPlaces={() => setShowSavedPlacesModal(true)}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        <div role="status" className="map-caption">
          <strong>{customPolygon ? 'Drawn area' : city.split(',')[0]}</strong>
          <span>{snapshotDate ? filteredData.length + ' places · OSM ' + snapshotDate : loading ? 'Finding places…' : dataError ? 'Search unavailable' : filteredData.length + ' places'}</span>
        </div>

        {dataError && !loading && (
          <div className="absolute top-4 left-4 right-4 md:left-14 md:right-auto md:max-w-md z-[500] rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 shadow-lg">
            {dataError}
          </div>
        )}

        <MapComponent
          center={coordinates}
          data={filteredData}
          isHeatmapMode={showHeatmap}
          searchRadius={radius}
          userLocation={userLocation}
          customPolygon={customPolygon}
          onShapeCreated={onShapeCreated}
          onShapeDeleted={onShapeDeleted}
          onMarkerClick={handleMarkerClick}
          routeData={routeData}
          onClearRoute={clearRoute}
          savedPlaceView={savedPlaceView}
        />

        {/* Selected Place Popup */}
        {selectedPlace && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[600] bg-white dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 shadow-2xl p-4 rounded-md">
            
            {/* Saved Place Indicator */}
            {savedPlaceView && (
              <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded flex items-center justify-between">
                <span className="text-xs text-yellow-800 dark:text-yellow-300 font-semibold flex items-center gap-1">
                  <Star size={14} className="fill-yellow-500 text-yellow-500" />
                  Viewing Saved Place
                </span>
                <button
                  onClick={closeSavedPlaceView}
                  className="text-xs text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 underline font-semibold"
                >
                  Back to map
                </button>
              </div>
            )}

            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm md:text-base text-blue-900 dark:text-blue-100">
                {selectedPlace.tags?.name || 'Unnamed place'}
              </h3>
              <button
                onClick={savedPlaceView ? closeSavedPlaceView : clearSelectedPlace}
                className="text-blue-500 hover:text-red-600 text-sm"
              >
                ✕
              </button>
            </div>

            {(selectedPlace.tags?.amenity || selectedPlace.tags?.cuisine) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                {selectedPlace.tags?.amenity}
                {selectedPlace.tags?.cuisine && ` · ${selectedPlace.tags.cuisine}`}
              </p>
            )}

            {(selectedPlace.tags?.['addr:housenumber'] ||
              selectedPlace.tags?.['addr:street'] ||
              selectedPlace.tags?.['addr:city']) && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                📍
                {[
                  selectedPlace.tags?.['addr:housenumber'],
                  selectedPlace.tags?.['addr:street'],
                  selectedPlace.tags?.['addr:city'],
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
            )}

            {selectedPlace.tags?.phone && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ☎ {selectedPlace.tags.phone}
              </p>
            )}

            {selectedPlace.tags?.opening_hours && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ⏰ {selectedPlace.tags.opening_hours}
              </p>
            )}

            {selectedPlace.tags?.wheelchair && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                ♿ Wheelchair: {selectedPlace.tags.wheelchair}
              </p>
            )}

            {(selectedPlace.tags?.brand || selectedPlace.tags?.operator) && (
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-1">
                🏷 {selectedPlace.tags?.brand || selectedPlace.tags?.operator}
              </p>
            )}

            {/* Show saved notes if viewing saved place */}
            {savedPlaceView?.notes && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Your Notes:</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{savedPlaceView.notes}</p>
              </div>
            )}

            {/* Save Button - Only show if NOT viewing a saved place */}
            {!savedPlaceView && (
              <button
                onClick={() => handleSavePlace(selectedPlace)}
                className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-semibold shadow-md"
              >
                <Star size={16} />
                Save This Place
              </button>
            )}

            <details className="mt-3">
              <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer font-medium">
                Show raw OSM tags
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto text-[10px] bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 p-2 rounded-md">
                {JSON.stringify(selectedPlace.tags, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Right Sidebar (Analytics) */}
      <div className={`
        workspace-panel fixed md:relative
        inset-y-0 right-0
        z-[999]
        w-full md:w-80
        transform transition-transform duration-300 ease-in-out
        ${showRightSidebar ? 'translate-x-0' : 'invisible md:visible translate-x-full md:translate-x-0'}
      `}>
        <AnalyticsPanel
          data={filteredData}
          loading={loading}
          error={dataError}
          amenityLabel={amenityLabel}
          onCategoryClick={handleCategorySelect}
          activeFilter={categoryFilter}
          onClearFilter={clearFilter}
          searchRadius={radius}
          customPolygon={customPolygon}
        />
      </div>

      {/* Overlay when sidebars are open on mobile */}
      {(showLeftSidebar || showRightSidebar) && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[998]"
          onClick={() => {
            setShowLeftSidebar(false);
            setShowRightSidebar(false);
          }}
        />
      )}

      {/* MODALS - RENDERED AT APP LEVEL USING PORTAL */}
      {createPortal(
        <>
          {/* Save Place Modal */}
          <SavePlaceModal
            isOpen={showSavePlaceModal}
            onClose={() => {
              setShowSavePlaceModal(false);
              setPlaceToSave(null);
            }}
            place={placeToSave}
            onSave={handleConfirmSave}
          />

          {/* Saved Places Modal */}
          <SavedPlacesModal
            isOpen={showSavedPlacesModal}
            onClose={() => setShowSavedPlacesModal(false)}
            onPlaceClick={handleSavedPlaceClick}
          />

          {/* Login Prompt */}
          {showLoginPrompt && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700 p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="text-yellow-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Sign in to save places
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Create an account to save your favorite locations and access them anytime.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowLoginPrompt(false)}
                      className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowLoginPrompt(false);
                        // User will need to click Sign In button in sidebar
                      }}
                      className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
}

export default App;

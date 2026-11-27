import WorkspaceDialog from './WorkspaceDialog';
import React, { useEffect, useState } from 'react';
import { X, Star, Trash2, MapPin, Calendar, StickyNote, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSavedPlaces, deletePlace } from '../services/savedPlacesService';

const CATEGORIES = ['All', 'Important', 'Favorites', 'Visited', 'Want to Visit', 'Other'];

const SavedPlacesModal = ({ isOpen, onClose, onPlaceClick }) => {
  const { user } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    if (isOpen && user) {
      loadSavedPlaces();
    }
  }, [isOpen, user]);

  const loadSavedPlaces = async () => {
    setLoading(true);
    try {
      const places = await getSavedPlaces(user.id);
      setSavedPlaces(places);
    } catch (error) {
      console.error('Error loading saved places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (placeId) => {
    if (!window.confirm('Delete this saved place?')) return;
    
    try {
      await deletePlace(placeId);
      setSavedPlaces(prev => prev.filter(p => p.id !== placeId));
    } catch (error) {
      alert('Failed to delete place');
    }
  };

  const handlePlaceClick = (place) => {
    onPlaceClick([place.lat, place.lon], place);
    onClose();
  };

  if (!isOpen) return null;

  const filteredPlaces = categoryFilter === 'All' 
    ? savedPlaces 
    : savedPlaces.filter(p => p.category === categoryFilter);

  return (
    <WorkspaceDialog label="Saved places" size="reading" onClose={onClose}>
      <div className="bg-white dark:bg-mineral-900 w-full max-w-3xl max-h-[85vh] rounded-lg shadow-2xl border border-mineral-300 dark:border-mineral-700 flex flex-col">
        
        {/* Header */}
        <div className="dialog-heading">
          <div>
            <h2 className="text-2xl font-bold text-mineral-900 dark:text-mineral-100 flex items-center gap-2">
              <Star className="text-forest-500" size={24} />
              Saved Places
            </h2>
            <p className="text-sm text-mineral-600 dark:text-mineral-400 mt-1">
              {savedPlaces.length} / 50 places saved
            </p>
          </div>
          <button
            aria-label="Close" onClick={onClose}
            className="text-mineral-500 hover:text-mineral-700 dark:text-mineral-400 dark:hover:text-mineral-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-mineral-200 dark:border-mineral-700 bg-mineral-50 dark:bg-mineral-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter size={16} className="text-mineral-600 dark:text-mineral-400 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? 'bg-forest-600 text-white'
                    : 'bg-white dark:bg-mineral-700 border border-mineral-300 dark:border-mineral-600 text-mineral-700 dark:text-mineral-300 hover:bg-mineral-100 dark:hover:bg-mineral-600'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className="ml-1 text-xs opacity-75">
                    ({savedPlaces.filter(p => p.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-8 w-8 border-4 border-forest-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Star className="text-mineral-300 dark:text-mineral-600 mb-4" size={64} />
              <h3 className="text-xl font-bold text-mineral-900 dark:text-mineral-100 mb-2">
                {categoryFilter === 'All' ? 'No saved places yet' : `No places in "${categoryFilter}"`}
              </h3>
              <p className="text-mineral-600 dark:text-mineral-400 text-sm">
                {categoryFilter === 'All' 
                  ? 'Click on any location on the map and save it to your collection!'
                  : 'Try selecting a different category above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="flex gap-3 p-4 bg-mineral-50 dark:bg-mineral-800 rounded-lg border border-mineral-200 dark:border-mineral-700 hover:bg-mineral-100 dark:hover:bg-mineral-700 transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <button
                        onClick={() => handlePlaceClick(place)}
                        className="flex-1 text-left group-hover:text-forest-600 dark:group-hover:text-forest-400 transition"
                      >
                        <h4 className="font-bold text-mineral-900 dark:text-mineral-100 truncate">
                          {place.name || 'Unnamed Place'}
                        </h4>
                        <p className="text-xs text-mineral-600 dark:text-mineral-400 mt-1">
                          {place.tags?.amenity || 'Unknown'}
                          {place.tags?.cuisine && ` • ${place.tags.cuisine}`}
                        </p>
                      </button>
                      <span className="px-2 py-1 bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-forest-200 text-xs font-medium rounded ml-2 flex-shrink-0">
                        {place.category}
                      </span>
                    </div>

                    {place.notes && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 rounded">
                        <StickyNote size={14} className="text-forest-600 dark:text-forest-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-mineral-700 dark:text-mineral-300">
                          {place.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-mineral-500 dark:text-mineral-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(place.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(place.id)}
                    className="text-mineral-400 hover:text-red-600 dark:hover:text-red-500 transition p-2 flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceDialog>
  );
};

export default SavedPlacesModal;
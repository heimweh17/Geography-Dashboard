import WorkspaceDialog from './WorkspaceDialog';
import React, { useState } from 'react';
import { X, Star, Save } from 'lucide-react';

const CATEGORIES = ['Important', 'Favorites', 'Visited', 'Want to Visit', 'Other'];

const SavePlaceModal = ({ isOpen, onClose, place, onSave }) => {
  const [category, setCategory] = useState('Favorites');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen || !place) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        category,
        notes: notes.trim()
      });
      onClose();
      setNotes('');
      setCategory('Favorites');
    } catch (error) {
      alert('Failed to save place');
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceDialog label="Save place" size="form" onClose={onClose}>
      <div className="bg-white dark:bg-mineral-900 w-full max-w-md rounded-lg shadow-2xl border border-mineral-300 dark:border-mineral-700">
        
        {/* Header */}
        <div className="dialog-heading">
          <h2 className="text-xl font-bold text-mineral-900 dark:text-mineral-100 flex items-center gap-2">
            <Star className="text-forest-500" size={24} />
            Save Place
          </h2>
          <button
            aria-label="Close" onClick={onClose}
            className="text-mineral-500 hover:text-mineral-700 dark:text-mineral-400 dark:hover:text-mineral-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Place Info */}
          <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-700 p-4 rounded-lg">
            <h3 className="font-bold text-mineral-900 dark:text-mineral-100 mb-1">
              {place.tags?.name || 'Unnamed Place'}
            </h3>
            <p className="text-sm text-mineral-600 dark:text-mineral-400">
              {place.tags?.amenity || 'Unknown type'}
              {place.tags?.cuisine && ` • ${place.tags.cuisine}`}
            </p>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-bold text-mineral-700 dark:text-mineral-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2 text-sm font-medium rounded-lg border-2 transition ${
                    category === cat
                      ? 'border-forest-600 bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-forest-200'
                      : 'border-mineral-200 dark:border-mineral-700 bg-white dark:bg-mineral-800 text-mineral-700 dark:text-mineral-300 hover:border-mineral-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-mineral-700 dark:text-mineral-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes about this place..."
              maxLength={200}
              rows={3}
              className="w-full p-3 border border-mineral-300 dark:border-mineral-600 rounded-lg bg-white dark:bg-mineral-800 text-mineral-900 dark:text-mineral-100 focus:ring-2 focus:ring-forest-500 outline-none resize-none"
            />
            <div className="text-xs text-mineral-500 dark:text-mineral-400 text-right mt-1">
              {notes.length}/200 characters
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 p-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Place
              </>
            )}
          </button>
        </div>
      </div>
    </WorkspaceDialog>
  );
};

export default SavePlaceModal;
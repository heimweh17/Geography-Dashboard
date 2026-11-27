import WorkspaceDialog from './WorkspaceDialog';
import React, { useEffect, useState } from 'react';
import { X, Mail, Calendar, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSavedPlaces } from '../services/savedPlacesService';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadSavedCount();
    }
  }, [isOpen, user]);

  const loadSavedCount = async () => {
    try {
      const places = await getSavedPlaces(user.id);
      setSavedCount(places.length);
    } catch (error) {
      console.error('Error loading saved places count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const joinDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';

  return (
    <WorkspaceDialog label="Profile" size="form" onClose={onClose}>
      <div className="bg-white dark:bg-mineral-900 w-full max-w-md rounded-lg shadow-2xl border border-mineral-300 dark:border-mineral-700">
        
        {/* Header */}
        <div className="dialog-heading">
          <h2 className="text-2xl font-bold text-mineral-900 dark:text-mineral-100">
            Profile
          </h2>
          <button
            aria-label="Close" onClick={onClose}
            className="text-mineral-500 hover:text-mineral-700 dark:text-mineral-400 dark:hover:text-mineral-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-forest-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
              {user.email?.[0].toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-mineral-900 dark:text-mineral-100">
              {user.user_metadata?.full_name || 'User'}
            </h3>
          </div>

          {/* User Info */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-mineral-50 dark:bg-mineral-800 rounded-lg">
              <Mail className="text-forest-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-xs text-mineral-600 dark:text-mineral-400 font-semibold">Email</p>
                <p className="text-sm text-mineral-900 dark:text-mineral-100 break-all">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-mineral-50 dark:bg-mineral-800 rounded-lg">
              <Calendar className="text-forest-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-xs text-mineral-600 dark:text-mineral-400 font-semibold">Member Since</p>
                <p className="text-sm text-mineral-900 dark:text-mineral-100">{joinDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-mineral-50 dark:bg-mineral-800 rounded-lg">
              <MapPin className="text-forest-600 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-xs text-mineral-600 dark:text-mineral-400 font-semibold">Saved Places</p>
                <p className="text-sm text-mineral-900 dark:text-mineral-100">
                  {loading ? 'Loading...' : `${savedCount} / 50 locations saved`}
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-3 border border-mineral-300 text-mineral-700 dark:text-mineral-200 hover:bg-mineral-100 dark:hover:bg-mineral-800 rounded-lg transition font-semibold"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </WorkspaceDialog>
  );
};

export default ProfileModal;
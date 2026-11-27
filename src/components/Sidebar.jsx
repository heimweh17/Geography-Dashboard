import WorkspaceDialog from './WorkspaceDialog';
import { parseFileToPoints } from '../utlis/datasetPreview';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Map, Moon, Sun, Download, Layers, X, Github, Mail, Globe, TrendingUp, ChevronDown, User, Star, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import AnalysisResultsModal from './AnalysisResultsModal';
import ComparisonModal from './ComparisonModal';
import LoginModal from './LoginModal';
import ProfileModal from './ProfileModal';
import AIInsightsModal from './AIInsightsModal';

import { DATA_LAYERS } from '../config/mapLayers';

const Sidebar = ({ 
  onSearch, 
  onAmenityChange, 
  onRadiusChange,
  onExport,
  canExport,
  loading, 
  selectedAmenities,
  searchRadius,
  toggleTheme,
  isDarkMode,
  toggleHeatmap,
  showHeatmap,
  customPolygon,
  onShowSavedPlaces
}) => {
  const { user, token, isAuthed, signOut } = useAuth();
  const [cityInput, setCityInput] = useState('');
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(() => window.location.pathname === '/compare');
  useEffect(() => {
    const syncRoute = () => setShowComparisonModal(window.location.pathname === '/compare');
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  function openComparison() {
    window.history.pushState({ fromMap: true }, '', '/compare');
    setShowComparisonModal(true);
  }

  function closeComparison() {
    if (window.history.state?.fromMap) {
      window.history.back();
    } else {
      window.history.pushState(null, '', '/');
      setShowComparisonModal(false);
    }
  }
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false);

  // Upload / Analysis state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null); // { dataset_id, n_points, ... }
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [runId, setRunId] = useState(null);
  const [uploadedPoints, setUploadedPoints] = useState([]);
  const [gridCellSize, setGridCellSize] = useState(0.01);
  const [dbscanEpsKm, setDbscanEpsKm] = useState(1.0);
  const [dbscanMinSamples, setDbscanMinSamples] = useState(5);
  const [categoryField, setCategoryField] = useState('category');

  const handleUploadClick = () => {
    if (!isAuthed) { setShowLoginModal(true); return; }
    const input = document.getElementById('hidden-upload-input');
    if (input) input.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAuthed || !token) {
      setUploadError('Please login first, then refresh the page.');
      return;
    }
    setUploading(true);
    setUploadError('');
    setDatasetInfo(null);
    setAnalysisError('');
    setRunId(null);
    setAnalysisResult(null);
    setIsAnalysisModalOpen(false);
    try {
      // Parse points client-side for modal map
      const pts = await parseFileToPoints(file);
      setUploadedPoints(pts);

      const data = await api.uploadDataset(token, file);
      setDatasetInfo(data);
    } catch (err) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRunAnalysis = async () => {
    if (!datasetInfo?.dataset_id) return;
    if (!isAuthed || !token) {
      setAnalysisError('Please login first, then refresh the page.');
      return;
    }
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const params = {
        grid_cell_size: Number(gridCellSize),
        dbscan_eps_km: Number(dbscanEpsKm),
        dbscan_eps: null,
        dbscan_min_samples: Number(dbscanMinSamples),
        category_field: categoryField || 'category',
      };
      const run = await api.analyzeDataset(token, datasetInfo.dataset_id, params);
      const parsed = typeof run.result_json === 'string' ? safeParseJSON(run.result_json) : run.result_json;
      setRunId(run.id);
      setAnalysisResult(parsed || run.result_json);
      // Open modal on success
      setIsAnalysisModalOpen(true);
    } catch (err) {
      setAnalysisError(err?.message || 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const safeParseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch (_) {
      return null;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) onSearch(cityInput);
  };

  const toggleAmenity = (amenity) => {
    let next;
    if (selectedAmenities.includes(amenity)) {
      next = selectedAmenities.filter((x) => x !== amenity);
      if (next.length === 0) next = [amenity];
    } else {
      next = [...selectedAmenities, amenity];
    }
    onAmenityChange(next);
  };

  const selectAllAmenities = () => {
    onAmenityChange([...DATA_LAYERS]);
  };

  const clearAllAmenities = () => {
    onAmenityChange(['restaurant']);
  };

  return (
    <>
      {/* SIDEBAR CONTENT */}
      <div className="tool-rail w-full lg:w-80 bg-white dark:bg-forest-950 border-r border-forest-200 dark:border-forest-800 flex flex-col h-full overflow-y-auto transition-colors duration-300 shadow-xl relative">
        <div className="p-6">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-forest-900 dark:text-forest-200 flex items-center gap-2">
              <Map size={24} className="shrink-0" />
              Geography Dashboard
            </h1>
            <button 
              aria-label="Switch color theme" onClick={toggleTheme}
              className="p-2 border border-forest-300 dark:border-forest-700 hover:bg-forest-100 dark:hover:bg-forest-900 text-forest-700 dark:text-forest-300 transition-colors rounded-md"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="city-search">
            <label htmlFor="city-query">Explore a city</label>
            <div className="city-query">
            <input
              type="text"
              id="city-query" placeholder="City or town"
              className="w-full p-3 pl-10 border border-forest-300 dark:border-forest-700 bg-forest-50 dark:bg-forest-900 dark:text-forest-100 focus:ring-2 focus:ring-forest-600 outline-none rounded-md"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
            />
            <button type="submit" aria-label="Search city"><Search size={18}/></button>
            </div>
          </form>

          <div className="space-y-6">
            
            {/* Data Layers Dropdown */}
            <div>
              <label className="block text-sm font-bold text-forest-900 dark:text-forest-200 mb-2">
                Map layers
              </label>
              <div className="relative">
                <button
                  type="button"
                  aria-expanded={showDropdown} onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full p-3 border border-forest-300 dark:border-forest-700 bg-white dark:bg-forest-900 text-forest-900 dark:text-forest-100 flex items-center justify-between rounded-md hover:bg-forest-50 dark:hover:bg-forest-800 transition-colors"
                >
                  <span className="text-sm">
                    {selectedAmenities.length === 1 
                      ? selectedAmenities[0].replace(/_/g, ' ')
                      : `${selectedAmenities.length} layers selected`
                    }
                  </span>
                  <ChevronDown size={16} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-forest-900 border border-forest-300 dark:border-forest-700 shadow-lg z-50 max-h-80 overflow-y-auto rounded-md">
                    <div className="p-3 border-b border-forest-200 dark:border-forest-700 flex gap-2">
                      <button
                        onClick={selectAllAmenities}
                        className="px-3 py-1 text-xs bg-forest-600 text-white hover:bg-forest-700 transition-colors rounded-md"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAllAmenities}
                        className="px-3 py-1 text-xs bg-forest-200 dark:bg-forest-800 text-forest-900 dark:text-forest-200 hover:bg-forest-300 dark:hover:bg-forest-700 transition-colors rounded-md"
                      >
                        Reset layers
                      </button>
                    </div>
                    
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {DATA_LAYERS.map((amenity) => (
                        <label
                          key={amenity}
                          className="flex items-center gap-2 p-2 hover:bg-forest-50 dark:hover:bg-forest-800 cursor-pointer rounded-md transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="w-4 h-4 text-forest-600 border-forest-300 focus:ring-forest-500 rounded"
                          />
                          <span className="text-sm text-forest-900 dark:text-forest-100 capitalize">
                            {amenity.replace(/_/g, ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-bold text-forest-900 dark:text-forest-200 mb-2">
                Search Radius: {searchRadius / 1000} km
              </label>
              <input 
                aria-label="Search radius" type="range"
                min="1000" 
                max="20000" 
                step="500" 
                value={searchRadius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                disabled={!!customPolygon}
                className={`w-full h-2 appearance-none cursor-pointer rounded-sm ${
                  customPolygon 
                    ? 'bg-mineral-300 dark:bg-mineral-600'
                    : 'bg-forest-200 dark:bg-forest-800'
                }`}
                style={{
                  background: customPolygon 
                    ? undefined 
                    : `var(--rail-line)`
                }}
              />
              {customPolygon && (
                <p className="text-xs text-forest-600 dark:text-forest-400 mt-1">
                  Radius disabled (Using Custom Area)
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                aria-pressed={showHeatmap} onClick={toggleHeatmap}
                className={`flex items-center justify-center gap-2 p-3 border transition-colors rounded-md ${
                  showHeatmap 
                    ? 'bg-forest-100 dark:bg-forest-900/30 border-forest-500 text-forest-700 dark:text-forest-300'
                    : 'bg-white dark:bg-forest-900 border-forest-300 dark:border-forest-700 text-forest-700 dark:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-800'
                }`}
              >
                <Layers size={18} />
                {showHeatmap ? 'Heatmap Active' : 'Show Heatmap'}
              </button>

              <button
                onClick={onExport}
                className="flex items-center justify-center gap-2 p-3 bg-forest-700 dark:bg-forest-800 text-white hover:bg-forest-800 dark:hover:bg-forest-700 transition-colors rounded-md border border-forest-600"
                disabled={loading || !canExport}
              >
                <Download size={18} />
                Export places as CSV
              </button>
              
              <button
                onClick={openComparison}
                className="flex items-center justify-center gap-2 p-3 bg-forest-700 dark:bg-forest-800 text-white hover:bg-forest-800 dark:hover:bg-forest-700 transition-colors rounded-md border border-forest-600"
              >
                <TrendingUp size={18} />
                Compare Cities
              </button>

              <h2 className="dataset-heading">Dataset analysis</h2>
              {/* Upload Dataset */}
              <input
                id="hidden-upload-input"
                type="file"
                accept=".csv,application/json,.geojson"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleUploadClick}
                className="flex items-center justify-center gap-2 p-3 bg-forest-700 dark:bg-forest-800 text-white hover:bg-forest-800 dark:hover:bg-forest-700 transition-colors rounded-md border border-forest-600 disabled:opacity-60"
                disabled={uploading || analysisLoading}
              >
                {uploading ? 'Uploading...' : 'Upload CSV or GeoJSON'}
              </button>
              {uploadError && (
                <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              )}
              {datasetInfo && (
                <div className="p-3 bg-forest-50 dark:bg-forest-900/40 border border-forest-300 dark:border-forest-700 rounded-md text-sm text-forest-900 dark:text-forest-100">
                  <div><strong>Dataset ID:</strong> {datasetInfo.dataset_id}</div>
                  <div><strong>Points:</strong> {datasetInfo.n_points}</div>
                </div>
              )}

              {/* Analysis Panel */}
              {datasetInfo && (
                <div className="p-3 bg-white dark:bg-forest-900 border border-forest-300 dark:border-forest-700 rounded-md space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-forest-900 dark:text-forest-100">
                      Grid cell size
                      <input
                        type="number"
                        step="0.001"
                        value={gridCellSize}
                        onChange={(e) => setGridCellSize(e.target.value)}
                        className="w-full mt-1 p-2 border border-forest-300 dark:border-forest-700 bg-white dark:bg-forest-950 text-forest-900 dark:text-forest-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-forest-900 dark:text-forest-100">
                      DBSCAN eps (km)
                      <input
                        type="number"
                        step="0.1"
                        value={dbscanEpsKm}
                        onChange={(e) => setDbscanEpsKm(e.target.value)}
                        className="w-full mt-1 p-2 border border-forest-300 dark:border-forest-700 bg-white dark:bg-forest-950 text-forest-900 dark:text-forest-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-forest-900 dark:text-forest-100">
                      Min samples
                      <input
                        type="number"
                        min="1"
                        value={dbscanMinSamples}
                        onChange={(e) => setDbscanMinSamples(e.target.value)}
                        className="w-full mt-1 p-2 border border-forest-300 dark:border-forest-700 bg-white dark:bg-forest-950 text-forest-900 dark:text-forest-100 rounded-md"
                      />
                    </label>
                    <label className="text-xs text-forest-900 dark:text-forest-100">
                      Category field
                      <input
                        type="text"
                        value={categoryField}
                        onChange={(e) => setCategoryField(e.target.value)}
                        className="w-full mt-1 p-2 border border-forest-300 dark:border-forest-700 bg-white dark:bg-forest-950 text-forest-900 dark:text-forest-100 rounded-md"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleRunAnalysis}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-forest-700 dark:bg-forest-800 text-white hover:bg-forest-800 dark:hover:bg-forest-700 transition-colors rounded-md border border-forest-600 disabled:opacity-60"
                    disabled={analysisLoading}
                  >
                    {analysisLoading ? 'Running Analysis...' : 'Run Analysis'}
                  </button>
                  {analysisError && (
                    <p className="text-sm text-red-600 dark:text-red-400">{analysisError}</p>
                  )}

                  {analysisResult && (
                    <div className="result-links">
                      <button type="button" onClick={() => setIsAnalysisModalOpen(true)}>View analysis results</button>
                      <button type="button" onClick={() => setShowAIInsightsModal(true)}>
                        <Sparkles size={16} /> Interpret with UF NaviGator
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="rail-account">
          <div className="mb-6 pb-4 border-b border-forest-200 dark:border-forest-700">
            {user ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={onShowSavedPlaces}
                    className="flex items-center justify-center gap-2 p-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition font-semibold"
                  >
                    <Star size={18} />
                    Saved
                  </button>

                  <button
                    onClick={() => setShowProfile(true)}
                    className="flex items-center justify-center gap-2 p-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition font-semibold"
                  >
                    <User size={18} />
                    Profile
                  </button>
                </div>
                <button
                  onClick={signOut}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-2 bg-forest-100 dark:bg-forest-900 text-forest-800 dark:text-forest-200 hover:bg-forest-200 dark:hover:bg-forest-800 transition rounded-md border border-forest-300 dark:border-forest-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition font-semibold"
              >
                <User size={18} />
                Sign In / Sign Up
              </button>
            )}
          </div></div>
        {/* Footer */}
        <div className="mt-auto p-6 text-xs text-forest-600 dark:text-forest-400 text-center border-t border-forest-200 dark:border-forest-800">
          <p className="mb-1">Data © OpenStreetMap contributors</p>
          <p>
            Made by{' '}
            <button 
              onClick={() => setShowAuthorModal(true)} 
              className="text-forest-700 dark:text-forest-300 font-bold hover:underline"
            >
              Alex Liu
            </button>
          </p>
        </div>
      </div>

      {/* MODALS RENDERED TO DOCUMENT.BODY USING PORTAL */}
      {createPortal(
        <>
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
          />

          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />

          {showAuthorModal && (
            <WorkspaceDialog label="About Geography Dashboard" size="form" onClose={() => setShowAuthorModal(false)}>
              <div className="bg-white dark:bg-forest-950 border border-forest-300 dark:border-forest-700 shadow-2xl w-full max-w-sm relative p-6 rounded-md">
                <button 
                  aria-label="Close" onClick={() => setShowAuthorModal(false)}
                  className="absolute top-4 right-4 text-forest-500 hover:text-forest-700 dark:text-forest-400 dark:hover:text-forest-200"
                >
                  <X size={24} />
                </button>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-forest-200 dark:bg-forest-800 text-forest-800 dark:text-forest-200 border border-forest-400 dark:border-forest-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold rounded-md">
                    AL
                  </div>
                  <h2 className="text-2xl font-bold text-forest-900 dark:text-forest-100 mb-1">Alex Liu</h2>
                  <p className="text-sm text-forest-600 dark:text-forest-400 mb-6">Full Stack Developer & GIS Analyst</p>
                  
                  <div className="space-y-4 text-left">
                    <a 
                      href="mailto:haozhouliu17@gmail.com" 
                      className="flex items-center gap-3 p-3 bg-forest-50 dark:bg-forest-900/50 border border-forest-200 dark:border-forest-700 hover:bg-forest-100 dark:hover:bg-forest-800 transition rounded-md"
                    >
                      <Mail className="text-forest-600" size={20} />
                      <span className="text-forest-800 dark:text-forest-200">haozhouliu17@gmail.com</span>
                    </a>
                    
                    <a 
                      href="https://github.com/heimweh17" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 p-3 bg-forest-50 dark:bg-forest-900/50 border border-forest-200 dark:border-forest-700 hover:bg-forest-100 dark:hover:bg-forest-800 transition rounded-md"
                    >
                      <Github className="text-forest-800 dark:text-forest-200" size={20} />
                      <span className="text-forest-800 dark:text-forest-200">github.com/heimweh17</span>
                    </a>
                    
                    <a 
                      href="https://aliu.me" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center gap-3 p-3 bg-forest-50 dark:bg-forest-900/50 border border-forest-200 dark:border-forest-700 hover:bg-forest-100 dark:hover:bg-forest-800 transition rounded-md"
                    >
                      <Globe className="text-forest-600" size={20} />
                      <span className="text-forest-800 dark:text-forest-200">aliu.me</span>
                    </a>
                  </div>
                </div>
              </div>
            </WorkspaceDialog>
          )}

          <ComparisonModal
            isOpen={showComparisonModal}
            onClose={closeComparison}
          />

          <AnalysisResultsModal
            isOpen={isAnalysisModalOpen}
            onClose={() => setIsAnalysisModalOpen(false)}
            analysisResult={analysisResult}
            points={uploadedPoints}
            params={{
              grid_cell_size: Number(gridCellSize),
              dbscan_eps_km: Number(dbscanEpsKm),
              dbscan_min_samples: Number(dbscanMinSamples),
              category_field: categoryField || 'category',
            }}
          />

          <AIInsightsModal
            isOpen={showAIInsightsModal}
            onClose={() => setShowAIInsightsModal(false)}
            analysisResult={analysisResult}
            token={token}
            key={runId}
            onGenerate={() => api.generateAIInsight(token, runId)}
          />
        </>,
        document.body
      )}
    </>
  );
};

export default Sidebar;

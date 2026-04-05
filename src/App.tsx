import { useState } from 'react';
import Map from './components/Map';
import { MapPin, Landmark, Globe, Layers, Type, Menu, X, Trash2, Plus, Loader2 } from 'lucide-react';
import { cities as initialCities, landmarks as initialLandmarks } from './data/mockData';

function App() {
  const [isHomogenous, setIsHomogenous] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myCities, setMyCities] = useState(initialCities);
  const [myLandmarks, setMyLandmarks] = useState(initialLandmarks);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleDeleteCity = (name: string) => {
    setMyCities(myCities.filter(c => c.name !== name));
  };

  const handleDeleteLandmark = (name: string) => {
    setMyLandmarks(myLandmarks.filter(l => l.name !== name));
  };

  const handleAddPlace = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Added addressdetails=1 to get the country code
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name, address } = data[0];
        const name = display_name.split(',')[0];
        const countryCode = address?.country_code?.toUpperCase() || '';
        
        setMyCities([...myCities, {
          name,
          coords: [parseFloat(lat), parseFloat(lon)],
          countryCode
        }]);
        setSearchQuery('');
      } else {
        alert('Place not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for place');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#191a1a] overflow-hidden flex">
      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-6 right-6 z-[1001] p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-white hover:bg-white/10 transition-colors"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Main Content Area */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Floating Header & Legend */}
        <div className="absolute top-6 left-6 z-[1000] p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-xs text-white">
          <h1 className="text-2xl font-bold tracking-tight mb-2">My Places</h1>
          <p className="text-gray-400 text-sm mb-6">A mockup of your world travels and highlights.</p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin size={14} className="text-orange-500" /> Cities
                </span>
                <span className="text-xs text-gray-500">Visited urban areas</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-silver shadow-[0_0_8px_rgba(192,192,192,0.4)]" style={{ backgroundColor: '#C0C0C0' }} />
              <div className="flex flex-col">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Landmark size={14} className="text-gray-400" /> Landmarks
                </span>
                <span className="text-xs text-gray-500">Key points of interest</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/40" />
              <div className="flex flex-col">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Globe size={14} className="text-green-500" /> Countries
                </span>
                <span className="text-xs text-gray-500">Highlighting visited nations</span>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setIsHomogenous(!isHomogenous)}
            >
              <div className="flex items-center gap-2">
                <Layers size={16} className={`transition-colors ${isHomogenous ? 'text-green-500' : 'text-gray-500'}`} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Homogenous mode</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Remove internal borders</span>
                </div>
              </div>
              <div 
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isHomogenous ? 'bg-green-500' : 'bg-gray-700'}`}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isHomogenous ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
            </div>

            <div 
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setShowLabels(!showLabels)}
            >
              <div className="flex items-center gap-2">
                <Type size={16} className={`transition-colors ${showLabels ? 'text-green-500' : 'text-gray-500'}`} />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Map Labels</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">City and country names</span>
                </div>
              </div>
              <div 
                className={`relative inline-flex h-5 w-10 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showLabels ? 'bg-green-500' : 'bg-gray-700'}`}
              >
                <span 
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showLabels ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </div>
            </div>
          </div>        </div>

        {/* Main Map */}
        <Map isHomogenous={isHomogenous} showLabels={showLabels} cities={myCities} landmarks={myLandmarks} />
      </div>

      {/* Right-hand Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-black/80 backdrop-blur-xl border-l border-white/10 z-[1000] text-white transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-6 pt-10">Manage Places</h2>
          
          {/* Add New Place */}
          <div className="mb-8">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlace()}
                placeholder="Search a place..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
              />
              <button 
                onClick={handleAddPlace}
                disabled={isSearching}
                className="bg-green-600 hover:bg-green-500 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          {/* Places List */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {/* Cities Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <MapPin size={12} className="text-orange-500" /> Cities ({myCities.length})
              </h3>
              <div className="space-y-2">
                {myCities.map(city => (
                  <div key={city.name} className="group flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm truncate mr-2">{city.name}</span>
                    <button 
                      onClick={() => handleDeleteCity(city.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Landmarks Section */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                <Landmark size={12} className="text-gray-400" /> Landmarks ({myLandmarks.length})
              </h3>
              <div className="space-y-2">
                {myLandmarks.map(landmark => (
                  <div key={landmark.name} className="group flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm truncate mr-2">{landmark.name}</span>
                    <button 
                      onClick={() => handleDeleteLandmark(landmark.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

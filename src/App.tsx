import { useState } from 'react';
import Map from './components/Map';
import { MapPin, Landmark as LandmarkIcon, Globe, Layers, Type, Menu, X, Trash2, Plus, Loader2 } from 'lucide-react';
import { cities as initialCities, landmarks as initialLandmarks } from './data/mockData';
import type { City, Landmark as LandmarkType } from './data/mockData';

// Extend types with unique IDs
interface CityWithId extends City { id: string; }
interface LandmarkWithId extends LandmarkType { id: string; }

const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

function App() {
  const [isHomogenous, setIsHomogenous] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [myCities, setMyCities] = useState<CityWithId[]>(
    initialCities.map(c => ({ ...c, id: crypto.randomUUID() }))
  );
  const [myLandmarks, setMyLandmarks] = useState<LandmarkWithId[]>(
    initialLandmarks.map(l => ({ ...l, id: crypto.randomUUID() }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleDeleteCity = (id: string) => {
    setMyCities(myCities.filter(c => c.id !== id));
  };

  const handleDeleteLandmark = (id: string) => {
    setMyLandmarks(myLandmarks.filter(l => l.id !== id));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setSearchResults(data);
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

  const isCityResult = (result: any) => {
    const { addresstype, type, class: category } = result;
    const cityTypes = ['city', 'town', 'village', 'municipality', 'suburb'];
    return cityTypes.includes(addresstype) || cityTypes.includes(type) || category === 'place';
  };

  const confirmAddPlace = (result: any) => {
    const { lat, lon, display_name, address } = result;
    const name = display_name.split(',')[0];
    const countryCode = address?.country_code?.toUpperCase() || '';
    
    if (isCityResult(result)) {
      setMyCities([...myCities, {
        id: crypto.randomUUID(),
        name,
        coords: [parseFloat(lat), parseFloat(lon)],
        countryCode
      }]);
    } else {
      setMyLandmarks([...myLandmarks, {
        id: crypto.randomUUID(),
        name,
        coords: [parseFloat(lat), parseFloat(lon)]
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        confirmAddPlace(searchResults[0]);
      } else {
        handleSearch();
      }
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
                  <LandmarkIcon size={14} className="text-gray-400" /> Landmarks
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
      <div className={`fixed top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-[1000] text-white transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-6 pt-10">Manage Places</h2>
          
          {/* Add New Place */}
          <div className="mb-8">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search a place..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-green-600 hover:bg-green-500 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
            </div>

            {/* Search Results / Disambiguation */}
            {searchResults.length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold uppercase text-green-500">Select the correct place</span>
                  <button onClick={() => setSearchResults([])} className="text-gray-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {searchResults.map((result, idx) => {
                    const countryFlag = getFlagEmoji(result.address?.country_code);
                    const isCity = isCityResult(result);
                    return (
                      <button 
                        key={idx}
                        onClick={() => confirmAddPlace(result)}
                        className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs border border-transparent hover:border-green-500/30 flex items-start gap-3"
                      >
                        <span className="text-lg leading-none mt-0.5">{countryFlag}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-200 truncate flex items-center gap-1.5">
                            {result.display_name.split(',')[0]}
                            {isCity ? (
                              <MapPin size={12} className="text-orange-500 shrink-0" />
                            ) : (
                              <LandmarkIcon size={12} className="text-gray-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-gray-500 truncate text-[10px]">{result.display_name.split(',').slice(1).join(',').trim()}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                  <div key={city.id} className="group flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm truncate mr-2">{city.name}</span>
                    <button 
                      onClick={() => handleDeleteCity(city.id)}
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
                <LandmarkIcon size={12} className="text-gray-400" /> Landmarks ({myLandmarks.length})
              </h3>
              <div className="space-y-2">
                {myLandmarks.map(landmark => (
                  <div key={landmark.id} className="group flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <span className="text-sm truncate mr-2">{landmark.name}</span>
                    <button 
                      onClick={() => handleDeleteLandmark(landmark.id)}
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

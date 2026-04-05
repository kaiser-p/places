import { useState } from 'react';
import Map from './components/Map';
import { MapPin, Landmark, Globe, Layers, Type } from 'lucide-react';

function App() {
  const [isHomogenous, setIsHomogenous] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  return (
    <div className="relative w-full h-screen bg-[#191a1a] overflow-hidden">
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
          <div className="flex items-center justify-between">
            <label htmlFor="homogenous-toggle" className="flex items-center gap-2 cursor-pointer group">
              <Layers size={16} className={`transition-colors ${isHomogenous ? 'text-green-500' : 'text-gray-500'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Homogenous mode</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Remove internal borders</span>
              </div>
            </label>
            <div 
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isHomogenous ? 'bg-green-500' : 'bg-gray-700'}`}
              onClick={() => setIsHomogenous(!isHomogenous)}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isHomogenous ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="labels-toggle" className="flex items-center gap-2 cursor-pointer group">
              <Type size={16} className={`transition-colors ${showLabels ? 'text-green-500' : 'text-gray-500'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Map Labels</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider">City and country names</span>
              </div>
            </label>
            <div 
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showLabels ? 'bg-green-500' : 'bg-gray-700'}`}
              onClick={() => setShowLabels(!showLabels)}
            >
              <span 
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showLabels ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Map */}
      <Map isHomogenous={isHomogenous} showLabels={showLabels} />
    </div>
  );
}

export default App;

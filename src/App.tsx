import Map from './components/Map';
import { MapPin, Landmark, Globe } from 'lucide-react';

function App() {
  return (
    <div className="relative w-full h-screen bg-[#191a1a] overflow-hidden">
      {/* Floating Header & Legend */}
      <div className="absolute top-6 left-6 z-[1000] p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-xs text-white">
        <h1 className="text-2xl font-bold tracking-tight mb-2">My Places</h1>
        <p className="text-gray-400 text-sm mb-6">A mockup of your world travels and highlights.</p>
        
        <div className="space-y-4">
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
      </div>

      {/* Main Map */}
      <Map />
    </div>
  );
}

export default App;

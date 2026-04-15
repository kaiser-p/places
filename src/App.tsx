import { useState, useEffect } from 'react';
import Map from './components/Map';
import { MapPin, Landmark as LandmarkIcon, Globe, Menu, X, Trash2, Plus, Loader2, User, LogOut } from 'lucide-react';
import { cities as initialCities, landmarks as initialLandmarks } from './data/mockData';
import type { City, Landmark as LandmarkType } from './data/mockData';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import logoDark from './assets/logo_dark.png';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Auth & Data State
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSyncSuccess, setIsSyncSuccess] = useState(false);

  const [myCities, setMyCities] = useState<CityWithId[]>(
    initialCities.map(c => ({ ...c, id: crypto.randomUUID() }))
  );
  const [myLandmarks, setMyLandmarks] = useState<LandmarkWithId[]>(
    initialLandmarks.map(l => ({ ...l, id: crypto.randomUUID() }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Auth Subscription
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMyProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMyProfile(session.user.id);
      else setMyUsername(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle Share URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const shareUser = pathParts.length > 1 ? pathParts[1] : null;
    if (shareUser) {
      handleSharedMap(shareUser);
    }
  }, []);

  const fetchMyProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    
    if (data) setMyUsername(data.username);
  };

  const handleSharedMap = async (shareUsername: string) => {
    setIsReadOnly(true);
    setViewingUsername(shareUsername);
    
    // 1. Find user_id from username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', shareUsername)
      .single();
    
    if (profileError || !profileData) {
      alert('User not found');
      setIsReadOnly(false);
      setViewingUsername(null);
      return;
    }

    // 2. Fetch places for that user
    fetchUserPlaces(profileData.id);
  };

  // Fetch Data from Supabase
  useEffect(() => {
    if (session && !isReadOnly) {
      fetchUserPlaces(session.user.id);
    }
  }, [session, isReadOnly]);

  const fetchUserPlaces = async (userId?: string) => {
    const query = supabase.from('places').select('*');
    if (userId) {
      query.eq('user_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching places:', error);
      return;
    }

    if (data) {
      const cities = data
        .filter(p => p.type === 'city')
        .map(p => ({ 
          id: p.id, 
          name: p.name, 
          coords: p.coords as [number, number], 
          countryCode: p.country_code || '',
          size: p.size as 'small' | 'medium' | 'large' | undefined
        }));
      const landmarks = data
        .filter(p => p.type === 'landmark')
        .map(p => ({ id: p.id, name: p.name, coords: p.coords as [number, number] }));
      
      setMyCities(cities);
      setMyLandmarks(landmarks);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    if (type === 'signup' && !username.trim()) {
      alert('Please choose a username');
      return;
    }

    setIsAuthLoading(true);
    
    if (type === 'signup') {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        alert(authError.message);
      } else if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: authData.user.id, username: username.trim() });
        
        if (profileError) alert('Error saving username: ' + profileError.message);
        else {
          setMyUsername(username.trim());
          setIsUserMenuOpen(false);
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else setIsUserMenuOpen(false);
    }
    
    setIsAuthLoading(false);
  };

  const updateUsername = async () => {
    if (!session || !newUsername.trim()) return;
    setIsAuthLoading(true);
    // Use upsert to handle cases where profile might not exist yet
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, username: newUsername.trim() });
    
    if (error) alert('Error updating username: ' + error.message);
    else {
      setMyUsername(newUsername.trim());
      setIsEditingUsername(false);
    }
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
    // Reset to mockup data on logout
    setMyCities(initialCities.map(c => ({ ...c, id: crypto.randomUUID() })));
    setMyLandmarks(initialLandmarks.map(l => ({ ...l, id: crypto.randomUUID() })));
  };

  const syncLocalToCloud = async () => {
    if (!session) return;
    setIsSyncing(true);
    
    const placesToUpload = [
      ...myCities.map(c => ({ 
        user_id: session.user.id, 
        name: c.name, 
        type: 'city', 
        coords: c.coords, 
        country_code: c.countryCode,
        size: c.size
      })),
      ...myLandmarks.map(l => ({ 
        user_id: session.user.id, 
        name: l.name, 
        type: 'landmark', 
        coords: l.coords 
      }))
    ];

    const { error } = await supabase.from('places').insert(placesToUpload);
    if (error) alert('Sync failed: ' + error.message);
    else {
      setIsSyncSuccess(true);
      setTimeout(() => setIsSyncSuccess(false), 2000);
      fetchUserPlaces(session.user.id);
    }
    setIsSyncing(false);
  };

  const handleDeleteCity = async (id: string) => {
    setMyCities(myCities.filter(c => c.id !== id));
    if (session) {
      await supabase.from('places').delete().eq('id', id);
    }
  };

  const handleDeleteLandmark = async (id: string) => {
    setMyLandmarks(myLandmarks.filter(l => l.id !== id));
    if (session) {
      await supabase.from('places').delete().eq('id', id);
    }
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

  const confirmAddPlace = async (result: any) => {
    const { lat, lon, display_name, address, importance: imp } = result;
    const name = display_name.split(',')[0];
    const countryCode = address?.country_code?.toUpperCase() || '';
    const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
    const isCity = isCityResult(result);
    const importance = imp || 0;

    let size: 'small' | 'medium' | 'large' = 'small';
    if (isCity) {
      if (importance > 0.7) size = 'large';
      else if (importance > 0.4) size = 'medium';
    }

    if (session) {
      const { data, error } = await supabase.from('places').insert({
        user_id: session.user.id,
        name,
        type: isCity ? 'city' : 'landmark',
        coords,
        country_code: isCity ? countryCode : null,
        size: isCity ? size : null
      }).select();

      if (error) alert('Error saving: ' + error.message);
      else if (data) {
        if (isCity) {
          setMyCities([...myCities, { id: data[0].id, name, coords, countryCode, size }]);
        } else {
          setMyLandmarks([...myLandmarks, { id: data[0].id, name, coords }]);
        }
      }
    } else {
      // Mockup logic
      if (isCity) {
        setMyCities([...myCities, { id: crypto.randomUUID(), name, coords, countryCode, size }]);
      } else {
        setMyLandmarks([...myLandmarks, { id: crypto.randomUUID(), name, coords }]);
      }
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
    <div className="relative w-full h-screen bg-[#191a1a] overflow-hidden">
      {/* Sidebar Toggle Button */}
      {!isReadOnly && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-6 right-6 z-[1001] p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-white hover:bg-white/10 transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Main Content Area */}
      <div className="relative w-full h-full overflow-hidden">
        {/* Floating Header & Legend */}
        <div className="absolute top-6 left-6 z-[1000] p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-xs text-white">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {isReadOnly ? `${viewingUsername}'s World` : 'My Places'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {isReadOnly ? `Exploring the travels of ${viewingUsername}.` : 'A mockup of your world travels and highlights.'}
          </p>
          
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

          {isReadOnly && (
            <button 
              onClick={() => {
                window.location.href = '/places/';
              }}
              className="w-full bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              Exit Shared View
            </button>
          )}
        </div>

        {/* User Menu */}
        {!isReadOnly && <div className="absolute top-6 right-20 z-[1001]">
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full shadow-2xl text-white hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <User size={24} />
          </button>
          
          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-4 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 text-white overflow-hidden">
              <div className="space-y-6">
                {!session ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-gray-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">{authMode === 'login' ? 'Login' : 'Sign Up'}</h3>
                      </div>
                      <button 
                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                        className="text-[10px] text-green-500 font-bold uppercase hover:underline"
                      >
                        {authMode === 'login' ? 'Go to Sign Up' : 'Go to Login'}
                      </button>
                    </div>

                    {authMode === 'signup' && (
                      <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                      />
                    )}
                    
                    <input 
                      type="email" 
                      placeholder="Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                    />
                    
                    <button 
                      onClick={() => handleAuth(authMode)}
                      disabled={isAuthLoading}
                      className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {isAuthLoading ? '...' : authMode === 'login' ? 'Login' : 'Create Account'}
                    </button>
                    
                    <p className="text-[10px] text-gray-500 text-center">
                      {authMode === 'login' ? 'Login to sync your places.' : 'Sign up to start your journey.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-white/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Account</span>
                        {isEditingUsername ? (
                          <div className="flex gap-2 mt-1">
                            <input 
                              type="text" 
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs w-24 focus:outline-none"
                            />
                            <button onClick={updateUsername} className="text-green-500 hover:text-green-400"><Plus size={14} /></button>
                            <button onClick={() => setIsEditingUsername(false)} className="text-red-500 hover:text-red-400"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                            setNewUsername(myUsername || '');
                            setIsEditingUsername(true);
                          }}>
                            <span className="text-sm font-medium truncate max-w-[140px]">{myUsername || 'Set Username'}</span>
                            <Plus size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                        <span className="text-[10px] text-gray-600 truncate max-w-[140px]">{session.user.email}</span>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Logout"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  </div>
                )}

                {session && (
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <button 
                      onClick={() => {
                        if (!myUsername) {
                          alert('Please set a username first');
                          return;
                        }
                        const url = `${window.location.origin}/places/${myUsername}`;
                        navigator.clipboard.writeText(url);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      disabled={!myUsername}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        !myUsername ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' :
                        isCopied ? 'bg-green-600 text-white' : 'bg-green-600/20 text-green-500 hover:bg-green-600/30'
                      }`}
                    >
                      {isCopied ? <Plus size={12} className="rotate-45" /> : <Globe size={12} />}
                      {!myUsername ? 'Set Username to Share' : (isCopied ? 'Copied URL!' : 'Copy Share Link')}
                    </button>
                    <button 
                      onClick={syncLocalToCloud}
                      disabled={isSyncing || isSyncSuccess}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isSyncSuccess ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:text-green-500 hover:bg-white/10'
                      }`}
                    >
                      {isSyncing ? <Loader2 size={12} className="animate-spin" /> : (isSyncSuccess ? <Plus size={12} className="rotate-45" /> : <Globe size={12} />)}
                      {isSyncSuccess ? 'Synced Successfully!' : 'Sync Local to Account'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>}

        {/* Login Splash Overlay */}
        {!session && !isReadOnly && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="bg-[#000000] p-20 rounded-[48px] border border-white/10 flex flex-col items-center animate-in fade-in zoom-in duration-700 pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.8)]">
              <img src={logoDark} alt="Places" className="w-96 h-auto mb-10" />
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tighter text-white">Welcome to Places</h2>
                <p className="text-gray-400 text-lg max-w-[400px] leading-relaxed">Sign in to start mapping your journey across the globe and sync your travels.</p>
              </div>
              <button 
                onClick={() => setIsUserMenuOpen(true)}
                className="mt-12 bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-full text-xl font-bold transition-all transform hover:scale-105 shadow-xl flex items-center gap-3"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* Main Map */}
        <Map isHomogenous={true} showLabels={false} cities={myCities} landmarks={myLandmarks} />
      </div>

      {/* Right-hand Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-black/80 backdrop-blur-xl border-l border-white/10 z-[1000] text-white transition-transform duration-300 ease-in-out transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-6 pt-10">
            {isReadOnly ? `Places by ${viewingUsername}` : 'Manage Places'}
          </h2>
          
          {/* Add New Place - Hide if read-only */}
          {!isReadOnly && (
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
          )}

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
                    {!isReadOnly && (
                      <button 
                        onClick={() => handleDeleteCity(city.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
                    {!isReadOnly && (
                      <button 
                        onClick={() => handleDeleteLandmark(landmark.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Events() {
  const navigate = useNavigate();
  
  const [allEvents, setAllEvents] = useState([]);
  const [visibleEvents, setVisibleEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI STATE
  const [showFilters, setShowFilters] = useState(false); // Collapsed by default

  // FILTERS
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. INITIAL FETCH
  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('public_events')
          .select('*')
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(500);

        if (error) throw error;
        
        setAllEvents(data);
        setVisibleEvents(data); 
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  // 2. INSTANT FILTERING
  useEffect(() => {
    let result = allEvents;

    if (keyword) {
      const q = keyword.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(q) || 
        (e.venue && e.venue.toLowerCase().includes(q))
      );
    }
    if (category) {
      result = result.filter(e => e.category === category);
    }
    if (startDate) {
      result = result.filter(e => e.start_date >= startDate);
    }
    if (endDate) {
      result = result.filter(e => e.start_date <= `${endDate}T23:59:59`);
    }

    setVisibleEvents(result);
  }, [keyword, category, startDate, endDate, allEvents]);

  const handleReset = () => {
    setKeyword('');
    setCategory('');
    setStartDate('');
    setEndDate('');
  };

  // COMMON STYLES
  const inputClass = "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none";
  const labelClass = "block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen animate-fade-in">
      
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate('/')} 
          className="text-sm font-bold text-gray-400 hover:text-black transition-colors flex items-center gap-2"
        >
          ← Dashboard
        </button>
      </div>

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Dublin Calendar</h1>
          <p className="text-gray-500">Discover culture happening in your city.</p>
        </div>
        
        {/* TOGGLE BUTTON */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:opacity-70 transition-opacity"
        >
          {showFilters ? 'Hide Filters' : 'Search & Filter'}
        </button>
      </div>

      {/* FILTER BAR (Collapsible) */}
      {showFilters && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8 animate-fade-in">
          <div className="space-y-5">
            
            {/* ROW 1: SEARCH (Full Width) */}
            <div>
              <label className={labelClass}>Search</label>
              <input 
                type="text" 
                placeholder="Search artist, venue..." 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className={inputClass}
              />
            </div>

            {/* ROW 2: FILTERS (Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Category */}
              <div className="col-span-2 sm:col-span-1">
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">All Types</option>
                    <option value="music">Music</option>
                    <option value="arts">Arts</option>
                    <option value="film">Film</option>
                  </select>
                  <div className="absolute right-4 top-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>

              {/* From */}
              <div>
                <label className={labelClass}>From</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputClass} px-2 sm:px-4`}
                />
              </div>

              {/* To */}
              <div>
                <label className={labelClass}>To</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} px-2 sm:px-4`}
                />
              </div>

              {/* Reset Button */}
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <button 
                  onClick={handleReset}
                  className="w-full h-12 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-xs uppercase tracking-wide"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Count */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs font-bold text-gray-400 text-right">
            Found {visibleEvents.length} events
          </div>
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {loading && visibleEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Loading calendar...</div>
        ) : visibleEvents.map((event) => {
             const date = new Date(event.start_date);
             const month = date.toLocaleString('default', { month: 'short' });
             const day = date.getDate();
             const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

             return (
               <Link 
                 key={event.id} 
                 to={`/event/${event.id}`}
                 className="group flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-black transition-all duration-200"
               >
                 <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{month}</div>
                    <div className="text-xl font-black text-gray-900 leading-none">{day}</div>
                 </div>
                 
                 <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>

                 <div className="flex-grow min-w-0">
                   <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                     {event.title}
                   </h3>
                   <div className="flex items-center gap-2 text-xs text-gray-500 truncate mt-1">
                     <span className="font-medium text-gray-700">{event.venue}</span>
                     {timeString && <><span className="text-gray-300">•</span><span>{timeString}</span></>}
                     {event.category && (
                       <>
                         <span className="hidden sm:inline-block text-gray-300">•</span>
                         <span className="hidden sm:inline-block uppercase tracking-wider text-[10px]">{event.category}</span>
                       </>
                     )}
                   </div>
                 </div>
                 <div className="text-gray-300 group-hover:text-black transition-colors">→</div>
               </Link>
             )
        })}
      </div>

      {!loading && visibleEvents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-8">
          <p className="text-gray-400 font-medium">No events found matching your search.</p>
        </div>
      )}
    </div>
  );
}
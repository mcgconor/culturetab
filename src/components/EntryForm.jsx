import { useState, useEffect } from 'react';
import StarRatingInput from './StarRatingInput';
import MovieSearch from './MovieSearch'; 
import BookSearch from './BookSearch'; 

export default function EntryForm({ onAddEntry, onUpdateEntry, entryToEdit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    kind: 'book', // Default
    rating: 0,
    creator: '',
    reflection: '',
    event_date: new Date().toISOString().split('T')[0],
    image_url: '' 
  });
  
  // Controls whether we show the API search or the standard text input
  const [manualEntryMode, setManualEntryMode] = useState(false);

  // If editing, load data and defaulting to manual mode
  useEffect(() => {
    if (entryToEdit) {
      setFormData(entryToEdit);
      setManualEntryMode(true); 
    }
  }, [entryToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryToEdit) {
      onUpdateEntry(entryToEdit.id, formData);
    } else {
      onAddEntry(formData);
    }
    // Reset defaults
    setFormData({
      title: '', kind: 'book', rating: 5, creator: '', reflection: '',
      event_date: new Date().toISOString().split('T')[0], image_url: ''
    });
    setManualEntryMode(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (newRating) => {
    setFormData({ ...formData, rating: newRating });
  };
  
  // Called when API search is successful
  const handleAutoSelect = (selection) => {
    setFormData(prev => ({
      ...prev,
      title: selection.title,
      creator: selection.creator,
      image_url: selection.image_url,
      event_date: prev.event_date 
    }));
  };

  // Called when user clicks "(X) Title Not Found"
  const handleManualBypass = (currentTitle) => {
    setFormData(prev => ({
        ...prev,
        title: currentTitle // Save what they typed
    }));
    setManualEntryMode(true); // Switch to dumb input
  };

  // When category changes, reset to search mode
  const handleCategoryChange = (newKind) => {
    setFormData({ ...formData, kind: newKind, title: '', creator: '', image_url: '' });
    setManualEntryMode(false);
  };

  const getCreatorLabel = (kind) => {
    if (kind === 'book') return 'Author';
    if (kind === 'film') return 'Director';
    if (kind === 'concert' || kind === 'music') return 'Artist / Band';
    if (kind === 'theatre') return 'Playwright / Company';
    if (kind === 'exhibition') return 'Artist / Curator';
    return 'Creator';
  };

  const categories = [
    { id: 'book', label: 'Book', icon: '📖' },
    { id: 'film', label: 'Film', icon: '🎬' },
    { id: 'concert', label: 'Music', icon: '🎵' },
    { id: 'theatre', label: 'Theatre', icon: '🎭' },
    { id: 'exhibition', label: 'Art', icon: '🖼️' },
  ];

  const labelClass = "block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1";
  const inputClass = "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 animate-fade-in-down">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          {entryToEdit ? 'Edit Entry' : 'Log New Entry'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ROW 1: CATEGORY SELECTION */}
        <div>
          <label className={labelClass}>Category</label>
          <div className="grid grid-cols-5 gap-2">
            {categories.map((cat) => {
              const isActive = formData.kind === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`
                    h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                    ${isActive 
                      ? 'bg-black text-white border-black shadow-md transform scale-[1.02]' 
                      : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100 hover:text-gray-600'
                    }
                  `}
                >
                  <span className="text-xl mb-0.5">{cat.icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ROW 2: TITLE (Logic Switcher) */}
        <div>
          <label className={labelClass}>Title</label>
          
          {!manualEntryMode && formData.kind === 'film' ? (
            <MovieSearch 
              initialTitle={formData.title} 
              onSelectMovie={handleAutoSelect} 
              onManualBypass={handleManualBypass}
            />
          ) : !manualEntryMode && formData.kind === 'book' ? (
            <BookSearch 
              initialTitle={formData.title} 
              onSelectBook={handleAutoSelect} 
              onManualBypass={handleManualBypass}
            />
          ) : (
            // STANDARD TEXT INPUT (Fallback or Manual Mode)
            <input
              name="title"
              type="text"
              placeholder={`Title of ${formData.kind}...`}
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              required
              autoFocus={manualEntryMode} // Focus here if we just switched to it
              // REMOVED onBlur HERE - It was causing the bug!
            />
          )}
        </div>

        {/* ROW 3: DATE + RATING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date Experienced</label>
            <input 
              name="event_date" 
              type="date" 
              value={formData.event_date} 
              onChange={handleChange} 
              className={inputClass} 
              required 
            />
          </div>
          
          <div>
            <label className={labelClass}>Rating</label>
            <div className="h-12 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl px-2">
              <StarRatingInput value={formData.rating} onChange={handleRatingChange} />
            </div>
          </div>
        </div>

        {/* ROW 4: CREATOR */}
        <div>
          <label className={labelClass}>{getCreatorLabel(formData.kind)}</label>
          <input 
            name="creator" 
            type="text" 
            placeholder={formData.kind === 'book' ? 'Auto-filled from search...' : 'Name'}
            value={formData.creator || ''} 
            onChange={handleChange} 
            className={inputClass} 
          />
        </div>

        {/* IMAGE PREVIEW */}
        {formData.image_url && (
           <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100 animate-fade-in">
              <img src={formData.image_url} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">Cover Image Found</span>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, image_url: ''})}
                  className="text-[10px] text-red-500 font-bold text-left hover:underline"
                >
                  Remove
                </button>
              </div>
           </div>
        )}

        {/* REFLECTION */}
        <div>
          <label className={labelClass}>Reflection</label>
          <textarea 
            name="reflection" 
            placeholder="Thoughts, memories, quotes..." 
            value={formData.reflection || ''} 
            onChange={handleChange} 
            className={`${inputClass} h-32 py-3 min-h-[120px] resize-y leading-relaxed`} 
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 bg-gray-100 text-gray-600 font-bold h-14 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="flex-[2] bg-black text-white font-bold h-14 rounded-xl hover:bg-gray-800 transform active:scale-[0.98] transition-all shadow-md"
          >
            {entryToEdit ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
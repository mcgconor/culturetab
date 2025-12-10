import { useState, useEffect } from 'react';
import StarRatingInput from './StarRatingInput';
import MovieSearch from './MovieSearch'; 
import BookSearch from './BookSearch'; 

export default function EntryForm({ onAddEntry, onUpdateEntry, entryToEdit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    kind: 'book',
    rating: 5,
    creator: '',
    reflection: '',
    event_date: new Date().toISOString().split('T')[0],
    image_url: '' 
  });

  useEffect(() => {
    if (entryToEdit) {
      setFormData(entryToEdit);
    }
  }, [entryToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (entryToEdit) {
      onUpdateEntry(entryToEdit.id, formData);
    } else {
      onAddEntry(formData);
    }
    setFormData({
      title: '', kind: 'book', rating: 5, creator: '', reflection: '',
      event_date: new Date().toISOString().split('T')[0], image_url: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (newRating) => {
    setFormData({ ...formData, rating: newRating });
  };
  
  const handleAutoSelect = (selection) => {
    setFormData(prev => ({
      ...prev,
      title: selection.title,
      creator: selection.creator,
      image_url: selection.image_url,
      event_date: prev.event_date 
    }));
  };

  const getCreatorLabel = (kind) => {
    if (kind === 'book') return 'Author';
    if (kind === 'film') return 'Director';
    if (kind === 'concert' || kind === 'music') return 'Artist / Band';
    if (kind === 'theatre') return 'Playwright / Company';
    if (kind === 'exhibition') return 'Artist / Curator';
    return 'Creator';
  };

  // UNIFIED STYLES
  const labelClass = "block text-[10px] font-bold uppercase text-gray-400 mb-1.5 ml-1";
  const inputClass = "w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 appearance-none";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 animate-fade-in-down">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          {entryToEdit ? 'Edit Entry' : 'Log New Entry'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ROW 1: TITLE (Full Width for max autocomplete space) */}
        <div>
          <label className={labelClass}>Title</label>
          {formData.kind === 'film' ? (
            <MovieSearch 
              initialTitle={formData.title} 
              onSelectMovie={handleAutoSelect} 
            />
          ) : formData.kind === 'book' ? (
            <BookSearch 
              initialTitle={formData.title} 
              onSelectBook={handleAutoSelect} 
            />
          ) : (
            <input
              name="title"
              type="text"
              placeholder="Title of work..."
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              required
              autoFocus
            />
          )}
        </div>

        {/* ROW 2: CATEGORY + DATE (Stacked on Mobile, Side-by-Side on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <label className={labelClass}>Category</label>
            <select name="kind" value={formData.kind} onChange={handleChange} className={`${inputClass} cursor-pointer`}>
              <option value="book">Book</option>
              <option value="film">Film</option>
              <option value="concert">Concert</option>
              <option value="theatre">Theatre</option>
              <option value="exhibition">Exhibition</option>
            </select>
             {/* Custom Arrow */}
             <div className="absolute right-4 top-[34px] pointer-events-none text-gray-400 text-xs">▼</div>
          </div>
          
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
        </div>

        {/* ROW 3: CREATOR + RATING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          
          <div>
            <label className={labelClass}>Rating</label>
            <div className="h-12 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
              <StarRatingInput value={formData.rating} onChange={handleRatingChange} />
            </div>
          </div>
        </div>

        {/* IMAGE PREVIEW (If exists) */}
        {formData.image_url && (
           <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              <img src={formData.image_url} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm" />
              <span className="text-xs font-bold text-gray-500">Cover Image Selected</span>
           </div>
        )}

        {/* REFLECTION */}
        <div>
          <label className={labelClass}>Reflection</label>
          <textarea 
            name="reflection" 
            placeholder="What did you think? (Optional)" 
            value={formData.reflection || ''} 
            onChange={handleChange} 
            className={`${inputClass} h-32 py-3 min-h-[120px] resize-y`} 
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
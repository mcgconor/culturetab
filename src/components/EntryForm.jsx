import { useState, useEffect } from 'react';
import StarRatingInput from './StarRatingInput';

export default function EntryForm({ onAddEntry, onUpdateEntry, entryToEdit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    kind: 'book',
    rating: 5,
    creator: '',
    reflection: '',
    event_date: new Date().toISOString().split('T')[0]
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
      event_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (newRating) => {
    setFormData({ ...formData, rating: newRating });
  };

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";
  const inputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all duration-200";

  return (
    // 1. REVERTED TO WHITE BACKGROUND
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg mb-8 animate-fade-in-down">
      
      {/* 2. CLEANER HEADER (Removed the old top Cancel button) */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {entryToEdit ? 'Edit Entry' : 'New Entry'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div>
          <label className={labelClass}>Title</label>
          <input name="title" type="text" placeholder="e.g. The Matrix..." value={formData.title} onChange={handleChange} className={inputClass} required autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Creator</label>
            <input name="creator" type="text" placeholder="Director, Author..." value={formData.creator || ''} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Date</label>
            <input name="event_date" type="date" value={formData.event_date} onChange={handleChange} className={inputClass} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-start">
          <div>
            <label className={labelClass}>Category</label>
            <select name="kind" value={formData.kind} onChange={handleChange} className={inputClass}>
              <option value="book">Book</option>
              <option value="film">Film</option>
              <option value="concert">Concert</option>
              <option value="theatre">Theatre</option>
              <option value="exhibition">Exhibition</option>
            </select>
          </div>
          
          <div>
            <label className={labelClass}>Rating</label>
            <div className="pt-2">
              <StarRatingInput value={formData.rating} onChange={handleRatingChange} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Reflection</label>
          <textarea name="reflection" placeholder="Thoughts..." value={formData.reflection || ''} onChange={handleChange} className={`${inputClass} min-h-[100px] resize-y`} />
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex gap-3 pt-2">
          
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>

          <button 
            type="submit" 
            className="flex-[2] bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transform active:scale-[0.98] transition-all shadow-md hover:shadow-lg"
          >
            {entryToEdit ? 'Update' : 'Save Entry'}
          </button>
        
        </div>

      </form>
    </div>
  );
}
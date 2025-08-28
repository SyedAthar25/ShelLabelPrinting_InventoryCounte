import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { dbService } from '../services/database';

interface SearchSuggestionsProps {
  query: string;
  onItemSelect: (item: Item) => void;
  maxSuggestions?: number;
  showSuggestions: boolean;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onItemSelect,
  maxSuggestions = 5,
  showSuggestions
}) => {
  const [suggestions, setSuggestions] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await dbService.searchItems(query);
        setSuggestions(results.slice(0, maxSuggestions));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, maxSuggestions]);

  if (!showSuggestions || !query || query.length < 2) return null;

  if (isLoading) {
    return (
      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
        <div className="p-2 text-center text-gray-600">
          Loading suggestions...
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
        <div className="p-2 text-center text-gray-600">
          No items found
        </div>
      </div>
    );
  }

  return (
    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto"
      style={{
        left: 0,
        right: 0,
        maxWidth: '100vw',
        minWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {suggestions.map((item) => (
        <div
          key={item.id}
          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
          onClick={() => onItemSelect(item)}
        >
          <div className="font-medium text-gray-900">{item.itemCode} - {item.itemNameEng}</div>
          <div className="text-sm text-gray-600">
            Barcode: {item.barcode} | {Number(item.price).toFixed(2)}
          </div>
          {item.itemNameArabic && (
            <div className="text-sm text-gray-600" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
              {item.itemNameArabic}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

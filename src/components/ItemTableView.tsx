import React, { useState, useEffect } from 'react';
import { Item } from '../types';
import { dbService } from '../services/database';

export const ItemTableView: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const allItems = await dbService.getAllItems();
      setItems(allItems);
    } catch (error) {
      setError('Failed to load items');
      console.error('Error loading items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="text-center py-4">
          <div className="spinner mx-auto mb-2"></div>
          <p>Loading items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-4 text-gray-600">
          No items found in database. Add some test data first.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">All Items in Database ({items.length})</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Code
              </th>
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barcode
              </th>
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                English Name
              </th>
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Arabic Name
              </th>
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                UOM
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b text-sm font-medium text-gray-900">
                  {item.itemCode}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {item.barcode}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {item.itemNameEng}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
                  {item.itemNameArabic}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  ${item.price.toFixed(2)}
                </td>
                <td className="px-4 py-2 border-b text-sm text-gray-600">
                  {item.uom}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Total items: {items.length}</p>
      </div>
    </div>
  );
};

import React from 'react';
import { dbService } from '../services/database';
import { Item } from '../types';

const TestDataButton: React.FC = () => {
  const addTestData = async () => {
    const testItems: Item[] = [
      {
        id: '1',
        itemCode: 'BEV001',
        barcode: '6901234567890',
        itemNameEng: 'Mineral Water 500ml',
        itemNameArabic: 'مياه معدنية 500 مل',
        price: 1.50,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        itemCode: 'BEV002',
        barcode: '6901234567891',
        itemNameEng: 'Apple Juice 1L',
        itemNameArabic: 'عصير تفاح 1 لتر',
        price: 3.75,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        itemCode: 'SNK001',
        barcode: '6901234567892',
        itemNameEng: 'Potato Chips 150g',
        itemNameArabic: 'رقائق البطاطس 150 جرام',
        price: 2.25,
        uom: 'pack',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        itemCode: 'SNK002',
        barcode: '6901234567893',
        itemNameEng: 'Chocolate Bar 100g',
        itemNameArabic: 'شوكولاتة 100 جرام',
        price: 4.50,
        uom: 'bar',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        itemCode: 'DAI001',
        barcode: '6901234567894',
        itemNameEng: 'Fresh Milk 1L',
        itemNameArabic: 'حليب طازج 1 لتر',
        price: 5.25,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '6',
        itemCode: 'DAI002',
        barcode: '6901234567895',
        itemNameEng: 'Yogurt 500g',
        itemNameArabic: 'زبادي 500 جرام',
        price: 3.00,
        uom: 'cup',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '7',
        itemCode: 'CLN001',
        barcode: '6901234567896',
        itemNameEng: 'Hand Soap 250ml',
        itemNameArabic: 'صابون اليد 250 مل',
        price: 6.75,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '8',
        itemCode: 'CLN002',
        barcode: '6901234567897',
        itemNameEng: 'Laundry Detergent 2L',
        itemNameArabic: 'منظف الغسيل 2 لتر',
        price: 12.99,
        uom: 'bottle',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '9',
        itemCode: 'BKY001',
        barcode: '6901234567898',
        itemNameEng: 'White Bread 400g',
        itemNameArabic: 'خبز ابيض 400 جرام',
        price: 2.50,
        uom: 'loaf',
        updatedAt: new Date().toISOString(),
      },
      {
        id: '10',
        itemCode: 'BKY002',
        barcode: '6901234567899',
        itemNameEng: 'Croissant Pack 6pcs',
        itemNameArabic: 'كرواسون 6 قطع',
        price: 8.25,
        uom: 'pack',
        updatedAt: new Date().toISOString(),
      }
    ];

    try {
      await dbService.saveItems(testItems);
      alert(`Successfully added ${testItems.length} test items to the database!`);
    } catch (error) {
      console.error('Error adding test data:', error);
      alert('Failed to add test data. Check console for details.');
    }
  };

  const clearTestData = async () => {
    if (window.confirm('Are you sure you want to clear all data from the database? This cannot be undone.')) {
      try {
        // This is a simplified clear - in a real app you'd implement proper clearing
        await dbService.saveItems([]);
        alert('Database cleared successfully!');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data.');
      }
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Test Data Management</h3>
      <div className="flex gap-4">
        <button
          onClick={addTestData}
          className="btn btn-primary"
        >
          Add 10 Test Items
        </button>
        <button
          onClick={clearTestData}
          className="btn btn-danger"
        >
          Clear All Data
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Use these buttons to add sample data for testing or clear the database.
      </p>
    </div>
  );
};

export default TestDataButton;

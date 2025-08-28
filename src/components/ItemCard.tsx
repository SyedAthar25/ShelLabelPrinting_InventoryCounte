import React from 'react';
import { Item } from '../types';

interface ItemCardProps {
  item: Item;
  showPrice?: boolean;
  showBarcode?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  showPrice = true,
  showBarcode = true,
}) => {
  return (
    <div className="item-display">
      <div className="item-name">{item.itemNameEng}</div>
      {item.itemNameArabic && (
        <div className="item-name-arabic" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
          {item.itemNameArabic}
        </div>
      )}
      <div className="item-detail">Code: {item.itemCode}</div>
      {showBarcode && (
        <div className="item-detail">Barcode: {item.barcode}</div>
      )}
      {showPrice && (
        <div className="item-detail">Price: ${Number(item.price).toFixed(2)} / {item.uom}</div>
      )}
      <div className="item-detail">Last Updated: {new Date(item.updatedAt).toLocaleDateString()}</div>
    </div>
  );
};

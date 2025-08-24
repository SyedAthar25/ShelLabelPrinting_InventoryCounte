import React from 'react';
import { Item, PrintSettings } from '../types';
import logo from '../../Logo 6x1-Photoroom.png';
import riyalSymbol from '../../Saudi_Riyal_Symbol.png';
import Barcode from 'react-barcode';
// If you use a barcode font, ensure it is loaded in your index.html or use a library for SVG rendering

interface PrintPreviewProps {
  item: Item;
  settings: PrintSettings;
  // quantity: number; // Removed unused prop
}

export const PrintPreview: React.FC<PrintPreviewProps> = ({
  item,
  settings,
  // quantity, // Removed unused prop
}) => {
  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        className="label-preview"
        style={{
          width: '60mm',
          height: '40mm',
          padding: '5px',
          border: 'none', // Remove border
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
        }}
      >
        {/* Logo - large and centered, no lines */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 4, marginTop: 0 }}>
          <img src={logo} alt="Logo" style={{ width: '80%', maxWidth: 180, objectFit: 'contain' }} />
        </div>
        {/* Arabic Name */}
        {item.itemNameArabic && (
          <div
            style={{
              fontSize: '12px',
              direction: 'rtl',
              fontFamily: 'Arial, sans-serif',
              marginBottom: 2,
              textAlign: 'center',
              width: '100%',
            }}
          >
            {item.itemNameArabic}
          </div>
        )}
        {/* English Name */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: 2,
            textAlign: 'center',
            width: '100%',
          }}
        >
          {item.itemNameEng}
        </div>
        {/* Barcode */}
        {settings.includeBarcode && item.barcode && (
          <div style={{ margin: '4px 0 0 0', textAlign: 'center', width: '100%' }}>
            {/* Barcode SVG */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Barcode
                value={item.barcode}
                width={2}
                height={40}
                displayValue={false}
                margin={0}
                background="#fff"
                lineColor="#111"
              />
            </div>
            {/* Barcode number */}
            <div style={{ fontSize: '12px', marginTop: 2, textAlign: 'center' }}>{item.barcode}</div>
          </div>
        )}
        {/* Price */}
        {settings.includePrice && (
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              textAlign: 'center',
              gap: 4,
            }}
          >
            <img src={riyalSymbol} alt="SAR" style={{ height: 18, marginRight: 4, verticalAlign: 'middle' }} />
            <span style={{ marginLeft: 2 }}>{item.price.toFixed(2)}</span>
          </div>
        )}
        {/* Label size note (for preview only, not for print) */}
        {/*  <div style={{ fontSize: '10px', marginTop: 2, color: '#888', textAlign: 'center' }}>
          Label Size : 6cm x 4cm
        </div> */}
      </div>
    </div>
  );
};

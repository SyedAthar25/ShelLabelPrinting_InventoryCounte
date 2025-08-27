import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import logo from '../../Logo 6x1-Photoroom.png';
import riyalSymbol from '../../Saudi_Riyal_Symbol.png';

const PrintPreviewMobile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { item, settings } = location.state || {};
  const barcodeRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Generate barcode as PNG
    if (barcodeRef.current && item && settings?.includeBarcode && item.barcode) {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, item.barcode, {
        format: 'CODE128',
        width: 2,
        height: 40,
        displayValue: false,
        margin: 0,
        background: '#fff',
        lineColor: '#111',
        fontSize: 0,
      });
      barcodeRef.current.src = canvas.toDataURL('image/png');
    }
  }, [item, settings]);

  useEffect(() => {
    setTimeout(() => {
      window.print();
      setTimeout(() => navigate('/shelf-label', { replace: true }), 500);
    }, 200);
  }, [navigate]);

  if (!item || !settings) {
    useEffect(() => {
      navigate('/shelf-label', { replace: true });
    }, [navigate]);
    return null;
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '60mm', height: '40mm', padding: '5px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Logo */}
        <img src={logo} alt="Logo" style={{ width: '80%', maxWidth: 180, objectFit: 'contain', marginBottom: 4 }} />
        {/* Arabic Name */}
        {item.itemNameArabic && (
          <div style={{ fontSize: '12px', direction: 'rtl', fontFamily: 'Arial, sans-serif', marginBottom: 2, textAlign: 'center', width: '100%' }}>{item.itemNameArabic}</div>
        )}
        {/* English Name */}
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: 2, textAlign: 'center', width: '100%' }}>{item.itemNameEng}</div>
        {/* Barcode as PNG */}
        {settings.includeBarcode && item.barcode && (
          <div style={{ margin: '4px 0 0 0', textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img ref={barcodeRef} alt="Barcode" style={{ height: 40, width: 'auto', background: '#fff' }} />
            </div>
            <div style={{ fontSize: '12px', marginTop: 2, textAlign: 'center' }}>{item.barcode}</div>
          </div>
        )}
        {/* Price */}
        {settings.includePrice && (
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', textAlign: 'center', gap: 4 }}>
            <img src={riyalSymbol} alt="SAR" style={{ height: 18, marginRight: 4, verticalAlign: 'middle' }} />
            <span style={{ marginLeft: 2 }}>{item.price.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintPreviewMobile;

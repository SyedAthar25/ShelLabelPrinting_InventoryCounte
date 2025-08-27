import { useRef } from 'react';
import Barcode from 'react-barcode';

export function useBarcodeSvg() {
  const containerRef = useRef<HTMLDivElement>(null);

  function getSvg(barcode: string) {
    if (!containerRef.current) return '';
    // Clear previous
    containerRef.current.innerHTML = '';
    // Create a temp div
    const el = document.createElement('div');
    containerRef.current.appendChild(el);
    // Render Barcode into el
    // @ts-ignore
    window.ReactDOM.render(
      <Barcode
        value={barcode}
        width={2}
        height={40}
        displayValue={false}
        margin={0}
        background="#fff"
        lineColor="#111"
        renderer="svg"
      />, el
    );
    const svg = el.querySelector('svg');
    const svgString = svg ? svg.outerHTML : '';
    containerRef.current.removeChild(el);
    return svgString;
  }

  return { containerRef, getSvg };
}

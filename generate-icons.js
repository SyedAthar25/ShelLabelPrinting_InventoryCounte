import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes required for PWA
const iconSizes = [
  16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512
];

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate simple SVG icons for each size
iconSizes.forEach(size => {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="url(#grad1)" stroke="#1e40af" stroke-width="2"/>
  
  <!-- Printer icon -->
  <g transform="translate(${size/2 - size/6}, ${size/2 - size/6})" fill="white">
    <rect x="0" y="0" width="${size/3}" height="${size/3}" rx="2" fill="none" stroke="white" stroke-width="2"/>
    <rect x="2" y="2" width="${size/3 - 4}" height="${size/6}" fill="white"/>
    <circle cx="${size/6}" cy="${size/6 + size/12}" r="1" fill="#3b82f6"/>
    <rect x="4" y="${size/3 - 4}" width="${size/3 - 8}" height="2" fill="white"/>
  </g>
  
  <!-- Text -->
  <text x="${size/2}" y="${size - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.max(8, size/16)}" fill="white" font-weight="bold">SL</text>
</svg>`;

  const fileName = `icon-${size}x${size}.svg`;
  const filePath = path.join(iconsDir, fileName);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`✅ Generated ${fileName}`);
});

console.log('\n🎉 All PWA icons generated successfully!');
console.log('📁 Icons saved in: public/icons/');
console.log('\n⚠️  Note: These are SVG icons. For production, convert them to PNG using:');
console.log('   - Online SVG to PNG converters');
console.log('   - Image editing software like GIMP/Photoshop');
console.log('   - Or use the generate-icons.html tool in your browser');

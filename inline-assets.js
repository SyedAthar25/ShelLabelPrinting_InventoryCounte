import fs from 'fs';
import path from 'path';

// Function to inline assets after build
function inlineAssetsAfterBuild() {
  const distDir = './dist';
  const indexPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log('index.html not found, skipping asset inlining');
    return;
  }

  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Find and inline CSS files
  const cssRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"[^>]*>/g;
  let match;
  
  while ((match = cssRegex.exec(htmlContent)) !== null) {
    const cssPath = match[1];
    const fullCssPath = path.join(distDir, cssPath);
    
    if (fs.existsSync(fullCssPath)) {
      console.log(`Inlining CSS: ${cssPath}`);
      const cssContent = fs.readFileSync(fullCssPath, 'utf8');
      htmlContent = htmlContent.replace(match[0], `<style>${cssContent}</style>`);
      
      // Remove the CSS file since it's now inlined
      fs.unlinkSync(fullCssPath);
    }
  }
  
  // Find and inline images as base64
  const imageRegex = /<link[^>]*href="([^"]*\.(png|jpg|jpeg|gif|svg|webp))"[^>]*>/gi;
  while ((match = imageRegex.exec(htmlContent)) !== null) {
    const imagePath = match[1];
    const fullImagePath = path.join(distDir, imagePath);
    
    if (fs.existsSync(fullImagePath)) {
      console.log(`Inlining image: ${imagePath}`);
      const imageBuffer = fs.readFileSync(fullImagePath);
      const imageBase64 = imageBuffer.toString('base64');
      const mimeType = getMimeType(imagePath);
      const dataUrl = `data:${mimeType};base64,${imageBase64}`;
      
      htmlContent = htmlContent.replace(match[0], match[0].replace(imagePath, dataUrl));
      
      // Remove the image file since it's now inlined
      fs.unlinkSync(fullImagePath);
    }
  }
  
  // Write the updated HTML
  fs.writeFileSync(indexPath, htmlContent);
  console.log('Assets inlined successfully!');
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Run the inlining process
inlineAssetsAfterBuild();


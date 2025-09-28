import fs from 'fs';
import path from 'path';

export function inlineAssetsPlugin() {
  return {
    name: 'inline-assets',
    generateBundle(options, bundle) {
      // Find the HTML file
      const htmlFile = Object.keys(bundle).find(fileName => fileName.endsWith('.html'));
      if (!htmlFile) return;

      const htmlAsset = bundle[htmlFile];
      let htmlContent = htmlAsset.source;

      // Inline CSS files
      const cssFiles = Object.keys(bundle).filter(fileName => fileName.endsWith('.css'));
      for (const cssFile of cssFiles) {
        const cssAsset = bundle[cssFile];
        const cssContent = cssAsset.source;
        
        // Replace CSS link with inline style
        const cssLinkRegex = new RegExp(`<link[^>]*href="[^"]*${cssFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
        htmlContent = htmlContent.replace(cssLinkRegex, `<style>${cssContent}</style>`);
        
        // Remove the CSS file from bundle since it's now inlined
        delete bundle[cssFile];
      }

      // Convert images to base64 and inline them
      const imageFiles = Object.keys(bundle).filter(fileName => 
        fileName.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)
      );
      
      for (const imageFile of imageFiles) {
        const imageAsset = bundle[imageFile];
        const imageBuffer = imageAsset.source;
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = getMimeType(imageFile);
        const dataUrl = `data:${mimeType};base64,${imageBase64}`;
        
        // Replace image references with data URLs
        const imageRegex = new RegExp(`href="[^"]*${imageFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
        htmlContent = htmlContent.replace(imageRegex, `href="${dataUrl}"`);
        
        const srcRegex = new RegExp(`src="[^"]*${imageFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
        htmlContent = htmlContent.replace(srcRegex, `src="${dataUrl}"`);
        
        // Remove the image file from bundle since it's now inlined
        delete bundle[imageFile];
      }

      // Update the HTML content
      htmlAsset.source = htmlContent;
    }
  };
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


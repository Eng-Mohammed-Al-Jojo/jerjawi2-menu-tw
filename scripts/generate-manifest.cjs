const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const imagesDir = path.join(publicDir, 'images');
const paymentDir = path.join(imagesDir, 'payment');
const manifestPath = path.join(publicDir, 'manifest.json');

function getImagesFromDir(dir, relativeTo) {
    if (!fs.existsSync(dir)) return [];
    
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat && stat.isDirectory()) {
            results = results.concat(getImagesFromDir(fullPath, relativeTo));
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
                results.push(path.relative(relativeTo, fullPath).replace(/\\/g, '/'));
            }
        }
    });
    
    return results;
}

function generateManifest() {
    console.log('🚀 Generating image manifest (recursive)...');
    
    // We scan everything inside images/
    const allImages = getImagesFromDir(imagesDir, publicDir);
    
    // Separate payment images for backward compatibility if needed, 
    // but the main goal is to have categories
    const manifest = {
        images: allImages.filter(p => !p.includes('/payment/')),
        payment: allImages.filter(p => p.includes('/payment/'))
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Manifest generated with ${allImages.length} images.`);
}

generateManifest();

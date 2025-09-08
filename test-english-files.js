// Test to check if English files actually have content
const fs = require('fs');
const path = require('path');

async function checkEnglishFiles() {
  const docsPath = path.join(__dirname, 'cs-self-learning', 'docs');
  
  let englishFileCount = 0;
  let validEnglishFileCount = 0;
  let emptyOrInvalidFiles = [];
  
  try {
    function checkDirectory(dir, basePath = '') {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory() && item !== 'images') {
          checkDirectory(itemPath, relativePath);
        } else if (item.endsWith('.en.md')) {
          englishFileCount++;
          const content = fs.readFileSync(itemPath, 'utf-8');
          
          // Check if file has meaningful content
          const hasContent = content.trim().length > 100; // At least 100 characters
          const hasTitle = content.includes('# ');
          
          if (hasContent && hasTitle) {
            validEnglishFileCount++;
          } else {
            emptyOrInvalidFiles.push({
              file: relativePath,
              size: content.length,
              hasTitle
            });
          }
        }
      }
    }
    
    checkDirectory(docsPath);
    
    console.log('=== ENGLISH FILE ANALYSIS ===');
    console.log('Total .en.md files:', englishFileCount);
    console.log('Valid English files:', validEnglishFileCount);
    console.log('Empty or invalid files:', emptyOrInvalidFiles.length);
    
    if (emptyOrInvalidFiles.length > 0) {
      console.log('\n=== INVALID FILES ===');
      emptyOrInvalidFiles.slice(0, 10).forEach(file => {
        console.log(`  ${file.file}: size=${file.size}, hasTitle=${file.hasTitle}`);
      });
    }
    
    // Now let's see what the actual difference would be
    console.log('\n=== EXPECTED VS ACTUAL ===');
    console.log('If we filter by valid English content:');
    console.log('Chinese courses: 125');
    console.log('English courses: 125 -', emptyOrInvalidFiles.length, '=', 125 - emptyOrInvalidFiles.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnglishFiles();
// Simple test to understand the course structure
const fs = require('fs');
const path = require('path');

async function countCourses() {
  const docsPath = path.join(__dirname, 'cs-self-learning', 'docs');
  
  let chineseCount = 0;
  let englishCount = 0;
  let categories = 0;
  
  try {
    const items = await fs.promises.readdir(docsPath);
    
    for (const item of items) {
      const itemPath = path.join(docsPath, item);
      const stats = await fs.promises.stat(itemPath);
      
      if (!stats.isDirectory() || item === 'images') continue;
      
      categories++;
      
      // Count files in this directory
      const files = await fs.promises.readdir(itemPath);
      
      for (const file of files) {
        const filePath = path.join(itemPath, file);
        const fileStats = await fs.promises.stat(filePath);
        
        if (fileStats.isDirectory()) {
          // Subdirectory
          const subFiles = await fs.promises.readdir(filePath);
          for (const subFile of subFiles) {
            if (subFile.endsWith('.md') && !subFile.endsWith('.en.md')) {
              chineseCount++;
              const englishPath = path.join(filePath, subFile.replace('.md', '.en.md'));
              try {
                await fs.promises.access(englishPath);
                englishCount++;
              } catch (e) {
                // No English version
              }
            }
          }
        } else if (file.endsWith('.md') && !file.endsWith('.en.md')) {
          chineseCount++;
          const englishPath = path.join(itemPath, file.replace('.md', '.en.md'));
          try {
            await fs.promises.access(englishPath);
            englishCount++;
          } catch (e) {
            // No English version
          }
        }
      }
    }
    
    console.log('Categories:', categories);
    console.log('Chinese courses:', chineseCount);
    console.log('English courses:', englishCount);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

countCourses();
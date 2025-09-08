// Detailed test to understand the course structure
const fs = require('fs');
const path = require('path');

async function analyzeCourses() {
  const docsPath = path.join(__dirname, 'cs-self-learning', 'docs');
  
  let allFiles = [];
  let processedFiles = [];
  let englishFiles = [];
  
  try {
    // Get ALL md files
    function getAllMdFiles(dir, basePath = '') {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory() && item !== 'images') {
          getAllMdFiles(itemPath, relativePath);
        } else if (item.endsWith('.md')) {
          allFiles.push(relativePath);
          if (item.endsWith('.en.md')) {
            englishFiles.push(relativePath);
          }
        }
      }
    }
    
    getAllMdFiles(docsPath);
    
    // Now simulate the buildCourseStructure logic
    function simulateBuildCourseStructure() {
      const categories = [];
      
      const categoryDirs = fs.readdirSync(docsPath);
      
      for (const categoryDir of categoryDirs) {
        const categoryPath = path.join(docsPath, categoryDir);
        const stats = fs.statSync(categoryPath);
        
        if (!stats.isDirectory() || categoryDir === 'images') continue;
        
        const category = {
          name: categoryDir,
          courses: []
        };
        
        // Get all items in category directory
        const items = fs.readdirSync(categoryPath);
        
        for (const item of items) {
          const itemPath = path.join(categoryPath, item);
          const itemStats = fs.statSync(itemPath);
          
          if (itemStats.isDirectory()) {
            // This is a subcategory
            const courseFiles = fs.readdirSync(itemPath);
            
            for (const courseFile of courseFiles) {
              // This is the key condition in buildCourseStructure!
              if (courseFile.endsWith('.md') && !courseFile.endsWith('.en.md')) {
                const coursePath = path.join(itemPath, courseFile);
                const courseEnglishPath = path.join(itemPath, courseFile.replace('.md', '.en.md'));
                
                const hasEnglishVersion = fs.existsSync(courseEnglishPath);
                
                category.courses.push({
                  name: courseFile,
                  hasEnglishVersion
                });
                
                processedFiles.push(path.join(categoryDir, item, courseFile));
              }
            }
          } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
            // This is a direct course in category
            const coursePath = path.join(categoryPath, item);
            const courseEnglishPath = path.join(categoryPath, item.replace('.md', '.en.md'));
            
            const hasEnglishVersion = fs.existsSync(courseEnglishPath);
            
            category.courses.push({
              name: item,
              hasEnglishVersion
            });
            
            processedFiles.push(path.join(categoryDir, item));
          }
        }
        
        categories.push(category);
      }
      
      return categories;
    }
    
    const categories = simulateBuildCourseStructure();
    
    // Calculate totals
    let totalChinese = 0;
    let totalEnglish = 0;
    
    categories.forEach(category => {
      category.courses.forEach(course => {
        totalChinese++;
        if (course.hasEnglishVersion) {
          totalEnglish++;
        }
      });
    });
    
    console.log('=== FILE ANALYSIS ===');
    console.log('Total .md files:', allFiles.length);
    console.log('Total .en.md files:', englishFiles.length);
    console.log('Processed by buildCourseStructure:', processedFiles.length);
    console.log('');
    console.log('=== COURSE STATISTICS ===');
    console.log('Chinese courses (total):', totalChinese);
    console.log('English courses (with EN version):', totalEnglish);
    console.log('Categories:', categories.length);
    console.log('');
    console.log('=== MISSING FILES ===');
    
    // Find files that were not processed
    const missingFiles = allFiles.filter(file => 
      !file.endsWith('.en.md') && !processedFiles.includes(file)
    );
    
    console.log('Files not processed:', missingFiles.length);
    if (missingFiles.length > 0) {
      console.log('Missing files:');
      missingFiles.slice(0, 10).forEach(file => console.log('  -', file));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeCourses();
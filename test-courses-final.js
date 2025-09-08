// Final test to match the actual numbers
const fs = require('fs');
const path = require('path');

async function finalAnalysis() {
  const docsPath = path.join(__dirname, 'cs-self-learning', 'docs');
  
  try {
    // Simulate the exact buildCourseStructure logic
    function simulateBuild() {
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
        
        const items = fs.readdirSync(categoryPath);
        
        for (const item of items) {
          const itemPath = path.join(categoryPath, item);
          const itemStats = fs.statSync(itemPath);
          
          if (itemStats.isDirectory()) {
            const courseFiles = fs.readdirSync(itemPath);
            
            for (const courseFile of courseFiles) {
              // EXACT condition from buildCourseStructure
              if (courseFile.endsWith('.md') && !courseFile.endsWith('.en.md')) {
                const courseEnglishPath = path.join(itemPath, courseFile.replace('.md', '.en.md'));
                const hasEnglishVersion = fs.existsSync(courseEnglishPath);
                
                category.courses.push({
                  name: courseFile,
                  hasEnglishVersion,
                  category: categoryDir,
                  subcategory: item
                });
              }
            }
          } else if (item.endsWith('.md') && !item.endsWith('.en.md')) {
            const courseEnglishPath = path.join(categoryPath, item.replace('.md', '.en.md'));
            const hasEnglishVersion = fs.existsSync(courseEnglishPath);
            
            category.courses.push({
              name: item,
              hasEnglishVersion,
              category: categoryDir,
              subcategory: null
            });
          }
        }
        
        if (category.courses.length > 0) {
          categories.push(category);
        }
      }
      
      return categories;
    }
    
    const categories = simulateBuild();
    
    // Calculate exact numbers
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
    
    console.log('=== FINAL ANALYSIS ===');
    console.log('Chinese courses (what you see on Chinese page):', totalChinese);
    console.log('English courses (what should show on English page):', totalEnglish);
    console.log('Categories:', categories.length);
    
    // Detailed breakdown
    console.log('\n=== DETAILED BREAKDOWN ===');
    categories.forEach(category => {
      const englishCourses = category.courses.filter(c => c.hasEnglishVersion).length;
      console.log(`${category.name}: ${category.courses.length} total, ${englishCourses} English`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

finalAnalysis();
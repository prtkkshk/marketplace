const fs = require('fs');

const files = ['lighthouse-signin.json', 'lighthouse-signup.json'];

files.forEach(file => {
  if (fs.existsSync(`audit-artifacts/${file}`)) {
    const data = JSON.parse(fs.readFileSync(`audit-artifacts/${file}`, 'utf8'));
    const audits = data.audits;
    console.log(`\n=== Metrics for ${file} ===`);
    console.log(`LCP: ${audits['largest-contentful-paint'].displayValue}`);
    console.log(`CLS: ${audits['cumulative-layout-shift'].displayValue}`);
    console.log(`TBT: ${audits['total-blocking-time'].displayValue}`);
    console.log(`Speed Index: ${audits['speed-index'].displayValue}`);
    
    // Get top opportunities
    const opportunities = Object.values(audits)
      .filter(audit => audit.details && audit.details.type === 'opportunity' && audit.score !== null && audit.score < 1)
      .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs)
      .slice(0, 5);
      
    console.log('\nTop Opportunities:');
    opportunities.forEach(opp => {
      console.log(`- ${opp.title}: saves ${opp.details.overallSavingsMs}ms`);
    });
  }
});

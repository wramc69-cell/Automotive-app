const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_output.json', 'utf8'));
const filesToFix = {};
data.forEach(d => {
    if (d.errorCount > 0 || d.warningCount > 0) {
        filesToFix[d.filePath] = {
            errors: d.messages.filter(m => m.severity === 2).length,
            warnings: d.messages.filter(m => m.severity === 1).length,
            messages: d.messages.map(m => m.ruleId + ': ' + m.message)
        };
    }
});
fs.writeFileSync('files_to_fix.json', JSON.stringify(filesToFix, null, 2));
console.log('Done writing files_to_fix.json');

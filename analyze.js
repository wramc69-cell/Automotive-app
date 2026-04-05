const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint_output.json', 'utf8'));
const rules = {};
data.forEach(d => {
    d.messages.forEach(m => {
        rules[m.ruleId] = (rules[m.ruleId] || 0) + 1;
    });
});
console.log(rules);

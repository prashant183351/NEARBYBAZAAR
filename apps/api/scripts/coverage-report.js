// This script parses the lcov report and prints the lowest coverage files (excluding dropship)
const fs = require('fs');
const path = require('path');

const lcovPath = path.join(__dirname, '../../coverage/lcov.info');
if (!fs.existsSync(lcovPath)) {
  console.error('lcov.info not found. Run coverage first.');
  process.exit(1);
}

const lcov = fs.readFileSync(lcovPath, 'utf-8');
const files = {};
let current = null;
for (const line of lcov.split('\n')) {
  if (line.startsWith('SF:')) {
    current = line.replace('SF:', '').trim();
    if (current.includes('dropship')) current = null;
  } else if (current && line.startsWith('DA:')) {
    const [_, data] = line.split(':');
    const [lineNum, hit] = data.split(',').map(Number);
    if (!files[current]) files[current] = { total: 0, hit: 0 };
    files[current].total++;
    if (hit > 0) files[current].hit++;
  } else if (line.startsWith('end_of_record')) {
    current = null;
  }
}
const results = Object.entries(files).map(([file, { total, hit }]) => ({
  file,
  coverage: total ? (hit / total) * 100 : 0,
  total,
  hit,
}));
results.sort((a, b) => a.coverage - b.coverage);
console.log('Lowest coverage files (excluding dropship):');
for (const r of results.slice(0, 10)) {
  console.log(`${r.coverage.toFixed(2)}%\t${r.file}`);
}
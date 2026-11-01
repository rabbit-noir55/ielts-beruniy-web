const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/User/Desktop/ims/EnthusiasticEnglish/public/json';

const INPUT_TYPES = ['input-note', 'input-sentence', 'input-summary'];

function findAllQzoneInputs(obj) {
  const inputs = new Set();
  const raw = JSON.stringify(obj);
  const matches = raw.match(/\[qzone-input-(\d+)\]/g);
  if (matches) {
    matches.forEach(m => {
      inputs.add(parseInt(m.match(/\d+/)[0]));
    });
  }
  return inputs;
}

function findLegacyNumberedItems(obj) {
  const results = [];
  function walk(o, p = '') {
    if (!o) return;
    if (typeof o === 'string') {
      const m = o.match(/^(\d+)\.\s/);
      if (m) {
        results.push({ num: parseInt(m[1]), text: o.substring(0, 100), path: p });
      }
    } else if (Array.isArray(o)) {
      o.forEach((item, i) => walk(item, `${p}[${i}]`));
    } else if (typeof o === 'object') {
      Object.entries(o).forEach(([k, v]) => walk(v, `${p}.${k}`));
    }
  }
  walk(obj);
  return results;
}

const files = fs.readdirSync(dir)
  .filter(f => f.match(/^MOCK_\d+_Reading\.json$/))
  .sort((a, b) => {
    const na = parseInt(a.match(/MOCK_(\d+)/)[1]);
    const nb = parseInt(b.match(/MOCK_(\d+)/)[1]);
    return na - nb;
  });

console.log(`Found ${files.length} Reading files\n`);

const allIssues = [];

for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.log(`ERROR: ${file} - Invalid JSON: ${e.message}`);
    continue;
  }
  
  const fileIssues = [];
  const tests = data.tests || {};
  
  for (const [testId, testData] of Object.entries(tests)) {
    const parts = testData.parts || {};
    for (const [partId, partData] of Object.entries(parts)) {
      const answers = partData.answers || {};
      const question = partData.question || {};
      const testQuestions = question.test_question || [];
      
      for (const tq of testQuestions) {
        const start = tq.start;
        const end = tq.end;
        const type = tq.type;
        const body = tq.body;
        
        // Only check input types that need [qzone-input-N]
        if (!INPUT_TYPES.includes(type)) continue;
        
        const inputs = findAllQzoneInputs(body);
        
        for (let q = start; q <= end; q++) {
          const qStr = String(q);
          const hasAnswer = qStr in answers;
          const hasInput = inputs.has(q);
          
          if (hasAnswer && !hasInput) {
            fileIssues.push({
              question: q,
              start, end, type,
              partId, testId,
              answer: answers[qStr]
            });
          }
        }
      }
    }
  }
  
  if (fileIssues.length > 0) {
    allIssues.push({ file, issues: fileIssues });
  }
}

console.log('=' .repeat(80));
console.log('RESULTS: Missing [qzone-input-N] in INPUT-type questions');
console.log('(Only checking input-note, input-sentence, input-summary types)');
console.log('=' .repeat(80));

if (allIssues.length === 0) {
  console.log('\nNo issues found! All input-type questions have corresponding [qzone-input-N] placeholders.\n');
} else {
  for (const { file, issues } of allIssues) {
    console.log(`\n--- ${file} ---`);
    for (const issue of issues) {
      console.log(`  Q${issue.question}: Test ${issue.testId} Part ${issue.partId}, type=${issue.type}, range=[${issue.start}-${issue.end}], answer="${issue.answer}"`);
      console.log(`    [qzone-input-${issue.question}] NOT FOUND in body text`);
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total files with issues: ${allIssues.length}`);
  console.log(`Total missing placeholders: ${allIssues.reduce((sum, f) => sum + f.issues.length, 0)}`);
}

// Check for legacy numbered format across ALL Reading files
console.log('\n' + '=' .repeat(80));
console.log('CHECK: All Reading files for legacy "N. text" format');
console.log('=' .repeat(80));

let legacyCount = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  
  const tests = data.tests || {};
  for (const [testId, testData] of Object.entries(tests)) {
    const parts = testData.parts || {};
    for (const [partId, partData] of Object.entries(parts)) {
      const question = partData.question || {};
      const testQuestions = question.test_question || [];
      for (const tq of testQuestions) {
        const body = tq.body;
        if (!body || !body.items || !Array.isArray(body.items)) continue;
        
        // Check top-level items
        for (const item of body.items) {
          if (typeof item === 'string') {
            const m = item.match(/^(\d+)\.\s/);
            if (m) {
              console.log(`${file}: Test ${testId} Part ${partId} type=${tq.type}: "${item.substring(0, 100)}"`);
              legacyCount++;
            }
          }
        }
        
        // Check nested items (2 levels deep)
        for (const parentItem of body.items) {
          if (parentItem && parentItem.items && Array.isArray(parentItem.items)) {
            for (const childItem of parentItem.items) {
              if (typeof childItem === 'string') {
                const m = childItem.match(/^(\d+)\.\s/);
                if (m) {
                  console.log(`${file}: Test ${testId} Part ${partId} type=${tq.type} (nested): "${childItem.substring(0, 100)}"`);
                  legacyCount++;
                }
              }
            }
          }
        }
      }
    }
  }
}

if (legacyCount === 0) {
  console.log('No legacy numbered items found in any Reading files.');
}

// Check all Listening files for legacy format
console.log('\n' + '=' .repeat(80));
console.log('CHECK: All Listening files for legacy "N. text" format');
console.log('=' .repeat(80));

const listeningFiles = fs.readdirSync(dir)
  .filter(f => f.match(/^MOCK_\d+_Listening\.json$/))
  .sort((a, b) => {
    const na = parseInt(a.match(/MOCK_(\d+)/)[1]);
    const nb = parseInt(b.match(/MOCK_(\d+)/)[1]);
    return na - nb;
  });

let listeningLegacyCount = 0;
for (const file of listeningFiles) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  
  const tests = data.tests || {};
  for (const [testId, testData] of Object.entries(tests)) {
    const parts = testData.parts || {};
    for (const [partId, partData] of Object.entries(parts)) {
      const question = partData.question || {};
      const testQuestions = question.test_question || [];
      for (const tq of testQuestions) {
        const body = tq.body;
        if (!body || !body.items || !Array.isArray(body.items)) continue;
        
        for (const item of body.items) {
          if (typeof item === 'string') {
            const m = item.match(/^(\d+)\.\s/);
            if (m) {
              console.log(`${file}: Test ${testId} Part ${partId} type=${tq.type}: "${item.substring(0, 100)}"`);
              listeningLegacyCount++;
            }
          }
        }
      }
    }
  }
}

if (listeningLegacyCount === 0) {
  console.log('No legacy numbered items found in any Listening files.');
}

// Now check Listening files for missing inputs too
console.log('\n' + '=' .repeat(80));
console.log('CHECK: Listening files - missing [qzone-input-N] in input-type questions');
console.log('=' .repeat(80));

const listeningIssues = [];
for (const file of listeningFiles) {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    continue;
  }
  
  const fileIssues = [];
  const tests = data.tests || {};
  
  for (const [testId, testData] of Object.entries(tests)) {
    const parts = testData.parts || {};
    for (const [partId, partData] of Object.entries(parts)) {
      const answers = partData.answers || {};
      const question = partData.question || {};
      const testQuestions = question.test_question || [];
      
      for (const tq of testQuestions) {
        const start = tq.start;
        const end = tq.end;
        const type = tq.type;
        const body = tq.body;
        
        if (!INPUT_TYPES.includes(type)) continue;
        
        const inputs = findAllQzoneInputs(body);
        
        for (let q = start; q <= end; q++) {
          const qStr = String(q);
          const hasAnswer = qStr in answers;
          const hasInput = inputs.has(q);
          
          if (hasAnswer && !hasInput) {
            fileIssues.push({
              question: q,
              start, end, type,
              partId, testId,
              answer: answers[qStr]
            });
          }
        }
      }
    }
  }
  
  if (fileIssues.length > 0) {
    listeningIssues.push({ file, issues: fileIssues });
  }
}

if (listeningIssues.length === 0) {
  console.log('No issues found in Listening files.');
} else {
  for (const { file, issues } of listeningIssues) {
    console.log(`\n--- ${file} ---`);
    for (const issue of issues) {
      console.log(`  Q${issue.question}: Test ${issue.testId} Part ${issue.partId}, type=${issue.type}, range=[${issue.start}-${issue.end}], answer="${issue.answer}"`);
      console.log(`    [qzone-input-${issue.question}] NOT FOUND in body text`);
    }
  }
  console.log(`\nTotal Listening files with issues: ${listeningIssues.length}`);
  console.log(`Total missing placeholders: ${listeningIssues.reduce((sum, f) => sum + f.issues.length, 0)}`);
}

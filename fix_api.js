const fs = require('fs');
const path = require('path');

const dir = 'd:\\emeltinfo\\szakamivizsga\\jegyzet';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

// The broken check block that references undeclared GEMINI_API_KEY
const badCheckRegex = /if\(GEMINI_API_KEY === "PROXY_USED_NO_KEY_NEEDED" \|\| GEMINI_API_KEY\.trim\(\) === ""\) \{[\s\S]*?return;\s*\}/g;

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    
    if (!content.includes('GEMINI_API_KEY')) {
        return;
    }
    
    console.log(`Processing ${file}...`);
    
    const newContent = content.replace(badCheckRegex, '// API kulcs a szerveren (Netlify env), itt nincs szükség rá');
    
    if (newContent !== content) {
        fs.writeFileSync(path.join(dir, file), newContent, 'utf8');
        console.log(`  Fixed ${file}`);
    } else {
        console.log(`  Pattern not matched in ${file} - checking manually...`);
        // Try to find the block
        const idx = content.indexOf('GEMINI_API_KEY');
        if (idx !== -1) {
            console.log(`  Found at index ${idx}: ...${content.substring(idx-20, idx+80)}...`);
        }
    }
});

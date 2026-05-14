const fs = require('fs');
const path = require('path');

const dir = 'd:\\emeltinfo\\szakamivizsga\\jegyzet';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html');

// CSS to add for resize handle
const resizeCSS = `
        /* Chat panel resize handle */
        #ai-chat-resize-handle {
            position: absolute;
            left: 0;
            top: 0;
            width: 6px;
            height: 100%;
            cursor: col-resize;
            background: transparent;
            transition: background 0.2s;
            z-index: 20;
        }
        #ai-chat-resize-handle:hover,
        #ai-chat-resize-handle.dragging {
            background: rgba(168, 85, 247, 0.5);
        }
        #ai-chat-window {
            position: relative;
            min-width: 260px;
            max-width: 700px;
        }`;

// HTML resize handle to add inside the aside
const resizeHandle = `<div id="ai-chat-resize-handle" title="Húzd a szélesség állításához"></div>
            `;

// JS for resize functionality
const resizeJS = `
        // === Chat panel resize ===
        (function() {
            const handle = document.getElementById('ai-chat-resize-handle');
            const panel = document.getElementById('ai-chat-window');
            if (!handle || !panel) return;

            let isResizing = false;
            let startX, startW;

            handle.addEventListener('mousedown', function(e) {
                isResizing = true;
                startX = e.clientX;
                startW = panel.offsetWidth;
                handle.classList.add('dragging');
                document.body.style.userSelect = 'none';
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isResizing) return;
                const dx = startX - e.clientX; // panel is on the right, so dragging left = wider
                const newW = Math.min(700, Math.max(260, startW + dx));
                panel.style.width = newW + 'px';
                panel.classList.remove('w-80');
            });

            document.addEventListener('mouseup', function() {
                if (!isResizing) return;
                isResizing = false;
                handle.classList.remove('dragging');
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            });
        })();`;

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    if (!content.includes('ai-chat-window')) {
        console.log(`Skipping ${file} (no chat)`);
        return;
    }

    console.log(`Processing ${file}...`);
    let changed = false;

    // 1. Add resize CSS before </style> (only the first </style> in head)
    if (!content.includes('ai-chat-resize-handle')) {
        // Find the last </style> in the <head> section (before </head>)
        const headEnd = content.indexOf('</head>');
        const styleCloseIdx = content.lastIndexOf('</style>', headEnd);
        if (styleCloseIdx !== -1) {
            content = content.slice(0, styleCloseIdx) + resizeCSS + '\n    </style>' + content.slice(styleCloseIdx + '</style>'.length);
            changed = true;
        }
    }

    // 2. Add resize handle HTML inside the aside, right after <aside id="ai-chat-window"...>
    const asidePattern = /(<aside id="ai-chat-window"[^>]*>)/;
    if (!content.includes('ai-chat-resize-handle') && asidePattern.test(content)) {
        content = content.replace(asidePattern, '$1\n            ' + resizeHandle);
        changed = true;
    } else if (content.includes('ai-chat-resize-handle') && !content.includes('mousedown')) {
        // CSS was added but not the JS yet, do nothing here
    }

    // 3. Add resize JS before </script> of the chat script block
    if (!content.includes('isResizing')) {
        // Find the closing </script> of the chat script (after toggleChat function)
        const chatScriptEnd = content.lastIndexOf('</script>');
        if (chatScriptEnd !== -1) {
            content = content.slice(0, chatScriptEnd) + resizeJS + '\n    </script>' + content.slice(chatScriptEnd + '</script>'.length);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log(`  Updated ${file}`);
    }
});

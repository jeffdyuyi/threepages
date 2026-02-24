let state = {
    pages: [],
    pageWidth: 210,
    pageHeight: 297,
    selectedBlock: null,
    draggedBlock: null,
    blockIdCounter: 0
};

function init() {
    createPages(3);
    setupEventListeners();
}

function createPages(count) {
    const container = document.getElementById('pagesContainer');
    container.innerHTML = '';
    state.pages = [];
    
    for (let i = 0; i < count; i++) {
        const pageData = { id: i, blocks: [] };
        state.pages.push(pageData);
        const pageEl = createPageElement(pageData);
        container.appendChild(pageEl);
    }
    
    updatePageSizes();
}

function createPageElement(pageData) {
    const page = document.createElement('div');
    page.className = 'page';
    page.dataset.pageId = pageData.id;
    
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
        <span>第 ${pageData.id + 1} 页</span>
        <div class="page-actions">
            <button class="export-page-btn" data-page-id="${pageData.id}">📄 导出HTML</button>
            <button class="export-page-pdf-btn" data-page-id="${pageData.id}">📑 导出PDF</button>
            <button class="delete-page-btn" data-page-id="${pageData.id}">🗑️</button>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'page-content';
    content.dataset.pageId = pageData.id;
    
    page.appendChild(header);
    page.appendChild(content);
    
    setupPageDropZone(content);
    
    return page;
}

function updatePageSizes() {
    const pages = document.querySelectorAll('.page');
    const pxWidth = state.pageWidth * 3.78;
    const pxHeight = state.pageHeight * 3.78;
    
    pages.forEach(page => {
        page.style.width = `${pxWidth}px`;
        page.style.minHeight = `${pxHeight}px`;
    });
}

function setupEventListeners() {
    document.getElementById('logo').addEventListener('click', () => {
        document.getElementById('authorModal').classList.add('show');
    });
    
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('authorModal').classList.remove('show');
    });
    
    document.getElementById('authorModal').addEventListener('click', (e) => {
        if (e.target.id === 'authorModal') {
            document.getElementById('authorModal').classList.remove('show');
        }
    });
    
    document.getElementById('applyPageSettings').addEventListener('click', () => {
        state.pageWidth = parseInt(document.getElementById('pageWidth').value);
        state.pageHeight = parseInt(document.getElementById('pageHeight').value);
        const count = parseInt(document.getElementById('pageCount').value);
        createPages(count);
    });
    
    document.getElementById('addPageBtn').addEventListener('click', () => {
        const newId = state.pages.length;
        const pageData = { id: newId, blocks: [] };
        state.pages.push(pageData);
        const container = document.getElementById('pagesContainer');
        container.appendChild(createPageElement(pageData));
        updatePageSizes();
    });
    
    document.getElementById('saveBtn').addEventListener('click', saveToLocal);
    document.getElementById('loadBtn').addEventListener('click', loadFromLocal);
    document.getElementById('exportHtmlBtn').addEventListener('click', exportAllHtml);
    document.getElementById('exportPdfBtn').addEventListener('click', exportAllPdf);
    document.getElementById('resetBtn').addEventListener('click', reset);
    
    document.getElementById('deleteBlockBtn').addEventListener('click', deleteSelectedBlock);
    
    setupTemplateDrag();
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.content-block') && !e.target.closest('#blockEditor')) {
            deselectBlock();
        }
    });
}

function setupTemplateDrag() {
    const templates = document.querySelectorAll('.template-block');
    templates.forEach(template => {
        template.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', template.dataset.type);
            e.dataTransfer.setData('isNew', 'true');
        });
    });
}

function setupPageDropZone(container) {
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('drag-over');
    });
    
    container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        
        const isNew = e.dataTransfer.getData('isNew') === 'true';
        const type = e.dataTransfer.getData('text/plain');
        
        if (isNew) {
            const pageId = parseInt(container.dataset.pageId);
            addBlockToPage(pageId, type);
        }
    });
}

function addBlockToPage(pageId, type) {
    const pageData = state.pages.find(p => p.id === pageId);
    if (!pageData) return;
    
    const block = createBlock(type);
    pageData.blocks.push(block);
    renderPageBlocks(pageId);
}

function createBlock(type) {
    const id = ++state.blockIdCounter;
    const block = {
        id,
        type,
        title: '',
        content: '',
        fontSize: 14,
        textAlign: 'left',
        imageUrl: '',
        tableData: [['表头1', '表头2'], ['内容1', '内容2']]
    };
    
    switch (type) {
        case 'text':
            block.title = '文本标题';
            block.content = '在这里输入文本内容...';
            break;
        case 'title':
            block.title = '大标题';
            block.fontSize = 24;
            break;
        case 'image':
            block.title = '图片标题';
            break;
        case 'table':
            block.title = '表格标题';
            break;
        case 'quote':
            block.title = '';
            block.content = '这是一段引用文字...';
            break;
    }
    
    return block;
}

function renderPageBlocks(pageId) {
    const pageData = state.pages.find(p => p.id === pageId);
    if (!pageData) return;
    
    const container = document.querySelector(`.page-content[data-page-id="${pageId}"]`);
    container.innerHTML = '';
    
    pageData.blocks.forEach((block, index) => {
        const blockEl = createBlockElement(block, pageId, index);
        container.appendChild(blockEl);
    });
}

function createBlockElement(block, pageId, index) {
    const div = document.createElement('div');
    div.className = 'content-block';
    div.dataset.blockId = block.id;
    div.dataset.pageId = pageId;
    div.dataset.index = index;
    div.draggable = true;
    
    let innerHtml = '';
    
    switch (block.type) {
        case 'text':
            innerHtml = `
                <div class="block-title" style="font-size: ${block.fontSize}px">${block.title}</div>
                <div class="block-text" style="font-size: ${block.fontSize}px; text-align: ${block.textAlign}">${block.content}</div>
            `;
            break;
        case 'title':
            innerHtml = `
                <div class="block-title" style="font-size: ${block.fontSize}px; text-align: ${block.textAlign}">${block.title}</div>
            `;
            break;
        case 'image':
            if (block.imageUrl) {
                innerHtml = `
                    <div class="block-title" style="font-size: ${block.fontSize}px">${block.title}</div>
                    <img class="block-image" src="${block.imageUrl}" alt="">
                `;
            } else {
                innerHtml = `
                    <div class="block-title" style="font-size: ${block.fontSize}px">${block.title}</div>
                    <div class="block-image-placeholder">点击上传图片</div>
                `;
            }
            break;
        case 'table':
            innerHtml = `
                <div class="block-title" style="font-size: ${block.fontSize}px">${block.title}</div>
                <table class="block-table">
                    ${block.tableData.map((row, i) => `
                        <tr>${row.map(cell => i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>
                    `).join('')}
                </table>
            `;
            break;
        case 'quote':
            innerHtml = `
                <div class="block-quote" style="font-size: ${block.fontSize}px">${block.content}</div>
            `;
            break;
    }
    
    div.innerHTML = innerHtml;
    
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBlock(block);
    });
    
    div.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        state.draggedBlock = { block, pageId, index };
        div.classList.add('dragging');
    });
    
    div.addEventListener('dragend', () => {
        div.classList.remove('dragging');
        state.draggedBlock = null;
    });
    
    div.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (state.draggedBlock && state.draggedBlock.block.id !== block.id) {
            div.classList.add('drag-over');
        }
    });
    
    div.addEventListener('dragleave', () => {
        div.classList.remove('drag-over');
    });
    
    div.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        div.classList.remove('drag-over');
        
        if (state.draggedBlock) {
            moveBlock(state.draggedBlock, pageId, index);
        }
    });
    
    const imagePlaceholder = div.querySelector('.block-image-placeholder');
    if (imagePlaceholder) {
        imagePlaceholder.addEventListener('click', (e) => {
            e.stopPropagation();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        block.imageUrl = e.target.result;
                        renderPageBlocks(pageId);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }
    
    return div;
}

function moveBlock(from, toPageId, toIndex) {
    const fromPage = state.pages.find(p => p.id === from.pageId);
    const toPage = state.pages.find(p => p.id === toPageId);
    
    if (!fromPage || !toPage) return;
    
    const [movedBlock] = fromPage.blocks.splice(from.index, 1);
    
    if (from.pageId === toPageId && from.index < toIndex) {
        toPage.blocks.splice(toIndex - 1, 0, movedBlock);
    } else {
        toPage.blocks.splice(toIndex, 0, movedBlock);
    }
    
    renderPageBlocks(from.pageId);
    if (from.pageId !== toPageId) {
        renderPageBlocks(toPageId);
    }
}

function selectBlock(block) {
    deselectBlock();
    state.selectedBlock = block;
    
    document.querySelectorAll('.content-block').forEach(el => {
        if (parseInt(el.dataset.blockId) === block.id) {
            el.classList.add('selected');
        }
    });
    
    showBlockEditor(block);
}

function deselectBlock() {
    state.selectedBlock = null;
    document.querySelectorAll('.content-block').forEach(el => el.classList.remove('selected'));
    document.getElementById('blockEditor').style.display = 'none';
}

function showBlockEditor(block) {
    const editor = document.getElementById('blockEditor');
    const content = document.getElementById('editorContent');
    editor.style.display = 'block';
    
    let html = '';
    
    if (block.type !== 'image') {
        html += `
            <div class="editor-field">
                <label>标题</label>
                <input type="text" id="editTitle" value="${block.title}">
            </div>
        `;
    }
    
    if (block.type === 'text' || block.type === 'quote') {
        html += `
            <div class="editor-field">
                <label>内容</label>
                <textarea id="editContent">${block.content}</textarea>
            </div>
        `;
    }
    
    if (block.type === 'image') {
        html += `
            <div class="editor-field">
                <label>图片URL</label>
                <input type="text" id="editImageUrl" value="${block.imageUrl}" placeholder="输入图片URL或点击图片上传">
            </div>
        `;
    }
    
    if (block.type === 'table') {
        html += `
            <div class="editor-field">
                <label>表格内容 (JSON格式)</label>
                <textarea id="editTableData">${JSON.stringify(block.tableData)}</textarea>
            </div>
        `;
    }
    
    html += `
        <div class="editor-field">
            <label>字体大小</label>
            <input type="number" id="editFontSize" value="${block.fontSize}" min="8" max="72">
        </div>
        <div class="editor-field">
            <label>文字对齐</label>
            <select id="editTextAlign">
                <option value="left" ${block.textAlign === 'left' ? 'selected' : ''}>左对齐</option>
                <option value="center" ${block.textAlign === 'center' ? 'selected' : ''}>居中</option>
                <option value="right" ${block.textAlign === 'right' ? 'selected' : ''}>右对齐</option>
            </select>
        </div>
    `;
    
    content.innerHTML = html;
    
    const updateBlock = () => {
        if (document.getElementById('editTitle')) block.title = document.getElementById('editTitle').value;
        if (document.getElementById('editContent')) block.content = document.getElementById('editContent').value;
        if (document.getElementById('editImageUrl')) block.imageUrl = document.getElementById('editImageUrl').value;
        if (document.getElementById('editTableData')) {
            try {
                block.tableData = JSON.parse(document.getElementById('editTableData').value);
            } catch (e) {}
        }
        block.fontSize = parseInt(document.getElementById('editFontSize').value);
        block.textAlign = document.getElementById('editTextAlign').value;
        
        const selectedEl = document.querySelector('.content-block.selected');
        if (selectedEl) {
            const pageId = parseInt(selectedEl.dataset.pageId);
            renderPageBlocks(pageId);
            selectBlock(block);
        }
    };
    
    content.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateBlock);
        el.addEventListener('change', updateBlock);
    });
}

function deleteSelectedBlock() {
    if (!state.selectedBlock) return;
    
    const selectedEl = document.querySelector('.content-block.selected');
    if (selectedEl) {
        const pageId = parseInt(selectedEl.dataset.pageId);
        const index = parseInt(selectedEl.dataset.index);
        const pageData = state.pages.find(p => p.id === pageId);
        if (pageData) {
            pageData.blocks.splice(index, 1);
            renderPageBlocks(pageId);
        }
    }
    deselectBlock();
}

function saveToLocal() {
    const data = JSON.stringify({
        pages: state.pages,
        pageWidth: state.pageWidth,
        pageHeight: state.pageHeight,
        blockIdCounter: state.blockIdCounter
    });
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trpg-trifold-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadFromLocal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    state.pages = data.pages || [];
                    state.pageWidth = data.pageWidth || 210;
                    state.pageHeight = data.pageHeight || 297;
                    state.blockIdCounter = data.blockIdCounter || 0;
                    
                    document.getElementById('pageWidth').value = state.pageWidth;
                    document.getElementById('pageHeight').value = state.pageHeight;
                    document.getElementById('pageCount').value = state.pages.length;
                    
                    const container = document.getElementById('pagesContainer');
                    container.innerHTML = '';
                    state.pages.forEach(pageData => {
                        container.appendChild(createPageElement(pageData));
                        renderPageBlocks(pageData.id);
                    });
                    updatePageSizes();
                } catch (err) {
                    alert('加载失败：' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function exportAllHtml() {
    exportHtml(null);
}

function exportHtml(pageId) {
    let pagesToExport = pageId !== null ? [state.pages.find(p => p.id === pageId)] : state.pages;
    
    const htmlContent = generateExportHtml(pagesToExport);
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pageId !== null ? `trpg-trifold-page-${pageId + 1}.html` : 'trpg-trifold.html';
    a.click();
    URL.revokeObjectURL(url);
}

function generateExportHtml(pages) {
    let blocksHtml = '';
    pages.forEach(pageData => {
        const pxWidth = state.pageWidth * 3.78;
        const pxHeight = state.pageHeight * 3.78;
        
        blocksHtml += '<div style="width:' + pxWidth + 'px; min-height:' + pxHeight + 'px; background:white; box-shadow:0 0 10px rgba(0,0,0,0.1); margin:20px; padding:20px; page-break-after:always;">';
        pageData.blocks.forEach(block => {
            blocksHtml += renderBlockForExport(block);
        });
        blocksHtml += '</div>';
    });
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TRPG三折页</title>
    <style>
        body{font-family:'Microsoft YaHei',sans-serif;background:#f5f5f5;margin:0;padding:20px}
        .block-title{font-weight:bold;margin-bottom:8px}
        .block-text{line-height:1.6}
        .block-image{width:100%;max-height:300px;object-fit:cover}
        .block-table{width:100%;border-collapse:collapse}
        .block-table th,.block-table td{border:1px solid #ddd;padding:8px}
        .block-table th{background:#f5f5f5}
        .block-quote{border-left:4px solid #667eea;padding-left:16px;font-style:italic;color:#666}
    </style>
</head>
<body>
${blocksHtml}
</body>
</html>`;
}

function renderBlockForExport(block) {
    let html = '<div style="margin-bottom:16px;">';
    
    switch (block.type) {
        case 'text':
            html += `<div class="block-title" style="font-size:${block.fontSize}px">${block.title}</div>`;
            html += `<div class="block-text" style="font-size:${block.fontSize}px;text-align:${block.textAlign}">${block.content}</div>`;
            break;
        case 'title':
            html += `<div class="block-title" style="font-size:${block.fontSize}px;text-align:${block.textAlign}">${block.title}</div>`;
            break;
        case 'image':
            html += `<div class="block-title" style="font-size:${block.fontSize}px">${block.title}</div>`;
            if (block.imageUrl) {
                html += `<img class="block-image" src="${block.imageUrl}">`;
            }
            break;
        case 'table':
            html += `<div class="block-title" style="font-size:${block.fontSize}px">${block.title}</div>`;
            html += '<table class="block-table">';
            block.tableData.forEach((row, i) => {
                html += '<tr>';
                row.forEach(cell => {
                    html += i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`;
                });
                html += '</tr>';
            });
            html += '</table>';
            break;
        case 'quote':
            html += `<div class="block-quote" style="font-size:${block.fontSize}px">${block.content}</div>`;
            break;
    }
    
    html += '</div>';
    return html;
}

function exportAllPdf() {
    exportPdf(null);
}

function exportPdf(pageId) {
    const { jsPDF } = window.jspdf;
    const pagesToExport = pageId !== null ? [state.pages.find(p => p.id === pageId)] : state.pages;
    
    const doc = new jsPDF({
        unit: 'mm',
        format: [state.pageWidth, state.pageHeight]
    });
    
    pagesToExport.forEach((pageData, pageIdx) => {
        if (pageIdx > 0) {
            doc.addPage([state.pageWidth, state.pageHeight]);
        }
        let y = 10;
        pageData.blocks.forEach(block => {
            const fontSize = block.fontSize || 12;
            doc.setFontSize(fontSize);
            
            switch (block.type) {
                case 'text':
                    if (block.title) {
                        doc.setFont(undefined, 'bold');
                        doc.text(block.title, 10, y);
                        doc.setFont(undefined, 'normal');
                        y += fontSize + 2;
                    }
                    if (block.content) {
                        const lines = doc.splitTextToSize(block.content, state.pageWidth - 20);
                        doc.text(lines, 10, y);
                        y += (lines.length * (fontSize * 0.5)) + 5;
                    }
                    break;
                case 'title':
                    doc.setFont(undefined, 'bold');
                    if (block.textAlign === 'center') {
                        doc.text(block.title, state.pageWidth / 2, y, { align: 'center' });
                    } else if (block.textAlign === 'right') {
                        doc.text(block.title, state.pageWidth - 10, y, { align: 'right' });
                    } else {
                        doc.text(block.title, 10, y);
                    }
                    doc.setFont(undefined, 'normal');
                    y += fontSize + 5;
                    break;
                case 'image':
                    if (block.title) {
                        doc.setFont(undefined, 'bold');
                        doc.text(block.title, 10, y);
                        doc.setFont(undefined, 'normal');
                        y += fontSize + 2;
                    }
                    if (block.imageUrl) {
                        try {
                            doc.addImage(block.imageUrl, 'JPEG', 10, y, state.pageWidth - 20, 50);
                            y += 55;
                        } catch (e) {}
                    }
                    y += 10;
                    break;
                case 'table':
                    if (block.title) {
                        doc.setFont(undefined, 'bold');
                        doc.text(block.title, 10, y);
                        doc.setFont(undefined, 'normal');
                        y += fontSize + 5;
                    }
                    y += 20;
                    break;
                case 'quote':
                    doc.setFont(undefined, 'italic');
                    const quoteLines = doc.splitTextToSize(block.content, state.pageWidth - 30);
                    doc.text(quoteLines, 20, y);
                    doc.setFont(undefined, 'normal');
                    y += (quoteLines.length * (fontSize * 0.5)) + 5;
                    break;
            }
            y += 5;
        });
    });
    
    doc.save(pageId !== null ? `trpg-trifold-page-${pageId + 1}.pdf` : 'trpg-trifold.pdf');
}

function reset() {
    if (confirm('确定要重置吗？所有内容将被清除！')) {
        state.pages = [];
        state.blockIdCounter = 0;
        state.selectedBlock = null;
        createPages(3);
        deselectBlock();
    }
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-page-btn')) {
        const pageId = parseInt(e.target.dataset.pageId);
        if (state.pages.length > 1) {
            state.pages = state.pages.filter(p => p.id !== pageId);
            state.pages.forEach((p, i) => p.id = i);
            const container = document.getElementById('pagesContainer');
            container.innerHTML = '';
            state.pages.forEach(pageData => {
                container.appendChild(createPageElement(pageData));
                renderPageBlocks(pageData.id);
            });
            document.getElementById('pageCount').value = state.pages.length;
            updatePageSizes();
        } else {
            alert('至少需要保留一页！');
        }
    }
    
    if (e.target.classList.contains('export-page-btn')) {
        const pageId = parseInt(e.target.dataset.pageId);
        exportHtml(pageId);
    }
    
    if (e.target.classList.contains('export-page-pdf-btn')) {
        const pageId = parseInt(e.target.dataset.pageId);
        exportPdf(pageId);
    }
});

init();

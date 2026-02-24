let state = {
    trifold: {
        front: [
            { id: 0, blocks: [], width: 210, height: 297 },
            { id: 1, blocks: [], width: 210, height: 297 },
            { id: 2, blocks: [], width: 210, height: 297 }
        ],
        back: [
            { id: 3, blocks: [], width: 210, height: 297 },
            { id: 4, blocks: [], width: 210, height: 297 },
            { id: 5, blocks: [], width: 210, height: 297 }
        ]
    },
    gutterWidth: 5,
    margin: 10,
    selectedBlock: null,
    draggedBlock: null,
    resizingBlock: null,
    blockIdCounter: 0
};

function init() {
    createPages();
    setupEventListeners();
}

function createPages() {
    const frontContainer = document.getElementById('frontPages');
    const backContainer = document.getElementById('backPages');
    frontContainer.innerHTML = '';
    backContainer.innerHTML = '';
    
    state.trifold.front.forEach(pageData => {
        const pageEl = createPageElement(pageData, 'front');
        frontContainer.appendChild(pageEl);
    });
    
    state.trifold.back.forEach(pageData => {
        const pageEl = createPageElement(pageData, 'back');
        backContainer.appendChild(pageEl);
    });
    
    updatePageSizes();
}

function createPageElement(pageData, side) {
    const page = document.createElement('div');
    page.className = 'page';
    page.dataset.pageId = pageData.id;
    page.dataset.side = side;
    
    const header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `
        <span>第 ${pageData.id + 1} 页</span>
        <div class="page-actions">
            <div class="page-size-controls">
                <input type="number" class="page-width-input" value="${pageData.width}" min="50" max="1000">
                <span>×</span>
                <input type="number" class="page-height-input" value="${pageData.height}" min="50" max="1000">
                <span>mm</span>
            </div>
            <button class="export-page-btn" data-page-id="${pageData.id}">📄 导出HTML</button>
            <button class="export-page-pdf-btn" data-page-id="${pageData.id}">📑 导出PDF</button>
        </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'page-content';
    content.dataset.pageId = pageData.id;
    content.dataset.side = side;
    
    page.appendChild(header);
    page.appendChild(content);
    
    setupPageDropZone(content);
    
    const widthInput = header.querySelector('.page-width-input');
    const heightInput = header.querySelector('.page-height-input');
    
    widthInput.addEventListener('change', (e) => {
        pageData.width = parseInt(e.target.value);
        updatePageSizes();
    });
    
    heightInput.addEventListener('change', (e) => {
        pageData.height = parseInt(e.target.value);
        updatePageSizes();
    });
    
    return page;
}

function updatePageSizes() {
    const pages = document.querySelectorAll('.page');
    
    pages.forEach(page => {
        const pageId = parseInt(page.dataset.pageId);
        const side = page.dataset.side;
        const pageData = getPageData(pageId, side);
        
        if (pageData) {
            const pxWidth = pageData.width * 3.78;
            const pxHeight = pageData.height * 3.78;
            page.style.width = `${pxWidth}px`;
            page.style.minHeight = `${pxHeight}px`;
        }
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
        state.gutterWidth = parseInt(document.getElementById('gutterWidth').value);
        state.margin = parseInt(document.getElementById('margin').value);
        createPages();
    });
    
    document.getElementById('saveBtn').addEventListener('click', saveToLocal);
    document.getElementById('loadBtn').addEventListener('click', loadFromLocal);
    document.getElementById('exportHtmlBtn').addEventListener('click', exportAllHtml);
    document.getElementById('exportPdfBtn').addEventListener('click', exportAllPdf);
    document.getElementById('resetBtn').addEventListener('click', reset);
    document.getElementById('printGuideBtn').addEventListener('click', showPrintGuide);
    
    document.getElementById('deleteBlockBtn').addEventListener('click', deleteSelectedBlock);
    
    setupTemplateDrag();
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.content-block') && !e.target.closest('#blockEditor')) {
            deselectBlock();
        }
    });
    
    const printGuideModal = document.getElementById('printGuideModal');
    const printGuideClose = printGuideModal.querySelector('.close');
    printGuideClose.addEventListener('click', () => {
        printGuideModal.classList.remove('show');
    });
    
    printGuideModal.addEventListener('click', (e) => {
        if (e.target.id === 'printGuideModal') {
            printGuideModal.classList.remove('show');
        }
    });
}

function showPrintGuide() {
    document.getElementById('printGuideModal').classList.add('show');
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
            const side = container.dataset.side;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - 10;
            const y = e.clientY - rect.top - 10;
            addBlockToPage(pageId, side, type, x, y);
        } else if (state.draggedBlock) {
            const pageId = parseInt(container.dataset.pageId);
            const side = container.dataset.side;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - 10;
            const y = e.clientY - rect.top - 10;
            moveBlockToPage(state.draggedBlock, pageId, side, x, y);
        }
    });
}

function addBlockToPage(pageId, side, type, x = 20, y = 20) {
    const pageData = getPageData(pageId, side);
    if (!pageData) return;
    
    const block = createBlock(type, x, y);
    pageData.blocks.push(block);
    renderPageBlocks(pageId, side);
}

function createBlock(type, x, y) {
    const id = ++state.blockIdCounter;
    const block = {
        id,
        type,
        title: '',
        content: '',
        fontSize: 14,
        textAlign: 'left',
        imageUrl: '',
        tableData: [['表头1', '表头2'], ['内容1', '内容2']],
        listItems: ['列表项1', '列表项2'],
        checkboxItems: [{ text: '复选框1', checked: false }, { text: '复选框2', checked: false }],
        x: x,
        y: y,
        width: 200,
        height: 100
    };
    
    switch (type) {
        case 'text':
            block.title = '文本标题';
            block.content = '在这里输入文本内容...';
            block.height = 150;
            break;
        case 'title':
            block.title = '大标题';
            block.fontSize = 24;
            block.height = 60;
            break;
        case 'image':
            block.title = '图片标题';
            block.width = 250;
            block.height = 150;
            break;
        case 'table':
            block.title = '表格标题';
            block.width = 280;
            block.height = 120;
            break;
        case 'quote':
            block.title = '';
            block.content = '这是一段引用文字...';
            block.height = 100;
            break;
        case 'list':
            block.title = '列表标题';
            block.height = 120;
            break;
        case 'checkbox':
            block.title = '复选框标题';
            block.height = 120;
            break;
    }
    
    return block;
}

function renderPageBlocks(pageId, side) {
    const pageData = getPageData(pageId, side);
    if (!pageData) return;
    
    const container = document.querySelector(`.page-content[data-page-id="${pageId}"][data-side="${side}"]`);
    if (!container) return;
    
    container.innerHTML = '';
    
    pageData.blocks.forEach(block => {
        const blockEl = createBlockElement(block, pageId, side);
        container.appendChild(blockEl);
    });
}

function createBlockElement(block, pageId, side) {
    const div = document.createElement('div');
    div.className = 'content-block';
    div.dataset.blockId = block.id;
    div.dataset.pageId = pageId;
    div.dataset.side = side;
    
    div.style.position = 'absolute';
    div.style.left = `${block.x}px`;
    div.style.top = `${block.y}px`;
    div.style.width = `${block.width}px`;
    div.style.height = `${block.height}px`;
    div.style.minWidth = '100px';
    div.style.minHeight = '50px';
    div.style.overflow = 'auto';
    
    let innerHtml = '';
    
    switch (block.type) {
        case 'text':
            innerHtml = `
                <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                <div class="block-text" contenteditable="true" style="font-size: ${block.fontSize}px; text-align: ${block.textAlign}">${block.content}</div>
            `;
            break;
        case 'title':
            innerHtml = `
                <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px; text-align: ${block.textAlign}">${block.title}</div>
            `;
            break;
        case 'image':
            if (block.imageUrl) {
                innerHtml = `
                    <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                    <img class="block-image" src="${block.imageUrl}" alt="">
                `;
            } else {
                innerHtml = `
                    <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                    <div class="block-image-placeholder">点击上传图片</div>
                `;
            }
            break;
        case 'table':
            innerHtml = `
                <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                <table class="block-table">
                    ${block.tableData.map((row, i) => `
                        <tr>${row.map(cell => i === 0 ? `<th contenteditable="true">${cell}</th>` : `<td contenteditable="true">${cell}</td>`).join('')}</tr>
                    `).join('')}
                </table>
            `;
            break;
        case 'quote':
            innerHtml = `
                <div class="block-quote" contenteditable="true" style="font-size: ${block.fontSize}px">${block.content}</div>
            `;
            break;
        case 'list':
            innerHtml = `
                <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                <ul class="block-list">
                    ${block.listItems.map(item => `<li contenteditable="true">${item}</li>`).join('')}
                </ul>
                <button class="add-list-item">+ 添加项</button>
            `;
            break;
        case 'checkbox':
            innerHtml = `
                <div class="block-title" contenteditable="true" style="font-size: ${block.fontSize}px">${block.title}</div>
                <div class="block-checkbox-list">
                    ${block.checkboxItems.map((item, index) => `
                        <div class="block-checkbox">
                            <input type="checkbox" ${item.checked ? 'checked' : ''} data-index="${index}">
                            <span contenteditable="true">${item.text}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="add-checkbox-item">+ 添加项</button>
            `;
            break;
    }
    
    innerHtml += '<button class="block-delete">×</button>';
    innerHtml += '<div class="block-resize"></div>';
    
    div.innerHTML = innerHtml;
    
    const deleteBtn = div.querySelector('.block-delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteBlock(block, pageId, side);
    });
    
    const resizeHandle = div.querySelector('.block-resize');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startResize(block, e.clientX, e.clientY);
    });
    
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBlock(block);
    });
    
    div.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.block-delete') && !e.target.closest('.block-resize') && !e.target.closest('button')) {
            startDrag(block, pageId, side, e.clientX, e.clientY);
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
                        renderPageBlocks(pageId, side);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
    }
    
    const contentEditableElements = div.querySelectorAll('[contenteditable="true"]');
    contentEditableElements.forEach(element => {
        element.addEventListener('blur', (e) => {
            updateBlockContent(block, e.target, pageId, side);
        });
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
            }
        });
    });
    
    const addListItemBtn = div.querySelector('.add-list-item');
    if (addListItemBtn) {
        addListItemBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            block.listItems.push('新列表项');
            renderPageBlocks(pageId, side);
        });
    }
    
    const addCheckboxItemBtn = div.querySelector('.add-checkbox-item');
    if (addCheckboxItemBtn) {
        addCheckboxItemBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            block.checkboxItems.push({ text: '新复选框', checked: false });
            renderPageBlocks(pageId, side);
        });
    }
    
    const checkboxInputs = div.querySelectorAll('.block-checkbox input[type="checkbox"]');
    checkboxInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            e.stopPropagation();
            const index = parseInt(input.dataset.index);
            if (index >= 0 && index < block.checkboxItems.length) {
                block.checkboxItems[index].checked = input.checked;
            }
        });
    });
    
    return div;
}

function updateBlockContent(block, element, pageId, side) {
    if (element.classList.contains('block-title')) {
        block.title = element.textContent;
    } else if (element.classList.contains('block-text') || element.classList.contains('block-quote')) {
        block.content = element.textContent;
    } else if (element.tagName === 'TH' || element.tagName === 'TD') {
        const rowIndex = Array.from(element.parentElement.parentElement.children).indexOf(element.parentElement);
        const cellIndex = Array.from(element.parentElement.children).indexOf(element);
        if (rowIndex >= 0 && rowIndex < block.tableData.length && 
            cellIndex >= 0 && cellIndex < block.tableData[rowIndex].length) {
            block.tableData[rowIndex][cellIndex] = element.textContent;
        }
    } else if (element.tagName === 'LI' && element.parentElement.classList.contains('block-list')) {
        const index = Array.from(element.parentElement.children).indexOf(element);
        if (index >= 0 && index < block.listItems.length) {
            block.listItems[index] = element.textContent;
        }
    } else if (element.tagName === 'SPAN' && element.parentElement.classList.contains('block-checkbox')) {
        const index = Array.from(element.parentElement.parentElement.children).indexOf(element.parentElement);
        if (index >= 0 && index < block.checkboxItems.length) {
            block.checkboxItems[index].text = element.textContent;
        }
    }
}

function startDrag(block, pageId, side, clientX, clientY) {
    state.draggedBlock = {
        block,
        pageId,
        side,
        startX: clientX - block.x,
        startY: clientY - block.y
    };
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
    if (!state.draggedBlock) return;
    
    const { block, pageId, side, startX, startY } = state.draggedBlock;
    const newX = e.clientX - startX;
    const newY = e.clientY - startY;
    
    const pageEl = document.querySelector(`.page-content[data-page-id="${pageId}"][data-side="${side}"]`);
    if (pageEl) {
        const rect = pageEl.getBoundingClientRect();
        const maxX = rect.width - block.width;
        const maxY = rect.height - block.height;
        
        block.x = Math.max(0, Math.min(newX, maxX));
        block.y = Math.max(0, Math.min(newY, maxY));
        
        renderPageBlocks(pageId, side);
    }
}

function stopDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    state.draggedBlock = null;
}

function startResize(block, clientX, clientY) {
    state.resizingBlock = {
        block,
        startX: clientX,
        startY: clientY,
        startWidth: block.width,
        startHeight: block.height
    };
    
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
}

function onResize(e) {
    if (!state.resizingBlock) return;
    
    const { block, startX, startY, startWidth, startHeight } = state.resizingBlock;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    block.width = Math.max(100, startWidth + deltaX);
    block.height = Math.max(50, startHeight + deltaY);
    
    const blockEl = document.querySelector(`.content-block[data-block-id="${block.id}"]`);
    if (blockEl) {
        const pageId = parseInt(blockEl.dataset.pageId);
        const side = blockEl.dataset.side;
        const pageEl = document.querySelector(`.page-content[data-page-id="${pageId}"][data-side="${side}"]`);
        if (pageEl) {
            const rect = pageEl.getBoundingClientRect();
            const maxX = rect.width - block.x;
            const maxY = rect.height - block.y;
            
            block.width = Math.min(block.width, maxX);
            block.height = Math.min(block.height, maxY);
        }
        
        renderPageBlocks(parseInt(blockEl.dataset.pageId), blockEl.dataset.side);
    }
}

function stopResize() {
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
    state.resizingBlock = null;
}

function moveBlockToPage(fromBlock, toPageId, toSide, x, y) {
    const fromPageData = getPageData(fromBlock.pageId, fromBlock.side);
    const toPageData = getPageData(toPageId, toSide);
    
    if (!fromPageData || !toPageData) return;
    
    const blockIndex = fromPageData.blocks.findIndex(b => b.id === fromBlock.block.id);
    if (blockIndex === -1) return;
    
    const [movedBlock] = fromPageData.blocks.splice(blockIndex, 1);
    movedBlock.x = x;
    movedBlock.y = y;
    toPageData.blocks.push(movedBlock);
    
    renderPageBlocks(fromBlock.pageId, fromBlock.side);
    renderPageBlocks(toPageId, toSide);
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
    
    if (block.type === 'list') {
        html += `
            <div class="editor-field">
                <label>列表项 (用逗号分隔)</label>
                <input type="text" id="editListItems" value="${block.listItems.join(', ')}">
            </div>
        `;
    }
    
    if (block.type === 'checkbox') {
        html += `
            <div class="editor-field">
                <label>复选框项 (用逗号分隔)</label>
                <input type="text" id="editCheckboxItems" value="${block.checkboxItems.map(item => item.text).join(', ')}">
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
        <div class="editor-field">
            <label>位置 X</label>
            <input type="number" id="editX" value="${block.x}" min="0">
        </div>
        <div class="editor-field">
            <label>位置 Y</label>
            <input type="number" id="editY" value="${block.y}" min="0">
        </div>
        <div class="editor-field">
            <label>宽度</label>
            <input type="number" id="editWidth" value="${block.width}" min="100">
        </div>
        <div class="editor-field">
            <label>高度</label>
            <input type="number" id="editHeight" value="${block.height}" min="50">
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
        if (document.getElementById('editListItems')) {
            block.listItems = document.getElementById('editListItems').value.split(',').map(item => item.trim()).filter(item => item);
        }
        if (document.getElementById('editCheckboxItems')) {
            const items = document.getElementById('editCheckboxItems').value.split(',').map(item => item.trim()).filter(item => item);
            block.checkboxItems = items.map(item => ({ text: item, checked: false }));
        }
        block.fontSize = parseInt(document.getElementById('editFontSize').value);
        block.textAlign = document.getElementById('editTextAlign').value;
        block.x = parseInt(document.getElementById('editX').value);
        block.y = parseInt(document.getElementById('editY').value);
        block.width = parseInt(document.getElementById('editWidth').value);
        block.height = parseInt(document.getElementById('editHeight').value);
        
        const selectedEl = document.querySelector('.content-block.selected');
        if (selectedEl) {
            const pageId = parseInt(selectedEl.dataset.pageId);
            const side = selectedEl.dataset.side;
            renderPageBlocks(pageId, side);
            selectBlock(block);
        }
    };
    
    content.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateBlock);
        el.addEventListener('change', updateBlock);
    });
}

function deleteBlock(block, pageId, side) {
    const pageData = getPageData(pageId, side);
    if (pageData) {
        pageData.blocks = pageData.blocks.filter(b => b.id !== block.id);
        renderPageBlocks(pageId, side);
    }
    deselectBlock();
}

function deleteSelectedBlock() {
    if (!state.selectedBlock) return;
    
    const selectedEl = document.querySelector('.content-block.selected');
    if (selectedEl) {
        const pageId = parseInt(selectedEl.dataset.pageId);
        const side = selectedEl.dataset.side;
        deleteBlock(state.selectedBlock, pageId, side);
    }
    deselectBlock();
}

function saveToLocal() {
    const data = JSON.stringify({
        trifold: state.trifold,
        gutterWidth: state.gutterWidth,
        margin: state.margin,
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
                    state.trifold = data.trifold || {
                        front: [
                            { id: 0, blocks: [], width: 210, height: 297 },
                            { id: 1, blocks: [], width: 210, height: 297 },
                            { id: 2, blocks: [], width: 210, height: 297 }
                        ],
                        back: [
                            { id: 3, blocks: [], width: 210, height: 297 },
                            { id: 4, blocks: [], width: 210, height: 297 },
                            { id: 5, blocks: [], width: 210, height: 297 }
                        ]
                    };
                    
                    // 为每个页面添加宽度和高度属性（如果不存在）
                    state.trifold.front.forEach(page => {
                        if (!page.width) page.width = 210;
                        if (!page.height) page.height = 297;
                    });
                    state.trifold.back.forEach(page => {
                        if (!page.width) page.width = 210;
                        if (!page.height) page.height = 297;
                    });
                    state.gutterWidth = data.gutterWidth || 5;
                    state.margin = data.margin || 10;
                    state.blockIdCounter = data.blockIdCounter || 0;
                    
                    document.getElementById('gutterWidth').value = state.gutterWidth;
                    document.getElementById('margin').value = state.margin;
                    
                    createPages();
                    
                    state.trifold.front.forEach(pageData => {
                        renderPageBlocks(pageData.id, 'front');
                    });
                    state.trifold.back.forEach(pageData => {
                        renderPageBlocks(pageData.id, 'back');
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
    let pagesToExport = [];
    if (pageId === null) {
        pagesToExport = [...state.trifold.front, ...state.trifold.back];
    } else {
        const page = getPageDataById(pageId);
        if (page) pagesToExport = [page];
    }
    
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
        const pxWidth = pageData.width * 3.78;
        const pxHeight = pageData.height * 3.78;
        
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
        .block-list{list-style:disc;margin-left:20px}
        .block-list li{margin-bottom:8px}
        .block-checkbox{margin-bottom:8px;display:flex;align-items:center;gap:8px}
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
        case 'list':
            html += `<div class="block-title" style="font-size:${block.fontSize}px">${block.title}</div>`;
            html += '<ul class="block-list">';
            block.listItems.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += '</ul>';
            break;
        case 'checkbox':
            html += `<div class="block-title" style="font-size:${block.fontSize}px">${block.title}</div>`;
            block.checkboxItems.forEach(item => {
                html += `<div class="block-checkbox"><input type="checkbox" ${item.checked ? 'checked' : ''}><span>${item.text}</span></div>`;
            });
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
    let pagesToExport = [];
    if (pageId === null) {
        pagesToExport = [...state.trifold.front, ...state.trifold.back];
    } else {
        const page = getPageDataById(pageId);
        if (page) pagesToExport = [page];
    }
    
    if (pagesToExport.length === 0) return;
    
    const firstPage = pagesToExport[0];
    const doc = new jsPDF({
        unit: 'mm',
        format: [firstPage.width, firstPage.height]
    });
    
    pagesToExport.forEach((pageData, pageIdx) => {
        if (pageIdx > 0) {
            doc.addPage([pageData.width, pageData.height]);
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
                        const lines = doc.splitTextToSize(block.content, pageData.width - 20);
                        doc.text(lines, 10, y);
                        y += (lines.length * (fontSize * 0.5)) + 5;
                    }
                    break;
                case 'title':
                    doc.setFont(undefined, 'bold');
                    if (block.textAlign === 'center') {
                        doc.text(block.title, pageData.width / 2, y, { align: 'center' });
                    } else if (block.textAlign === 'right') {
                        doc.text(block.title, pageData.width - 10, y, { align: 'right' });
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
                            doc.addImage(block.imageUrl, 'JPEG', 10, y, pageData.width - 20, 50);
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
                    const quoteLines = doc.splitTextToSize(block.content, pageData.width - 30);
                    doc.text(quoteLines, 20, y);
                    doc.setFont(undefined, 'normal');
                    y += (quoteLines.length * (fontSize * 0.5)) + 5;
                    break;
                case 'list':
                    if (block.title) {
                        doc.setFont(undefined, 'bold');
                        doc.text(block.title, 10, y);
                        doc.setFont(undefined, 'normal');
                        y += fontSize + 5;
                    }
                    block.listItems.forEach(item => {
                        doc.text(`• ${item}`, 15, y);
                        y += fontSize * 0.8;
                    });
                    y += 5;
                    break;
                case 'checkbox':
                    if (block.title) {
                        doc.setFont(undefined, 'bold');
                        doc.text(block.title, 10, y);
                        doc.setFont(undefined, 'normal');
                        y += fontSize + 5;
                    }
                    block.checkboxItems.forEach(item => {
                        doc.text(`☐ ${item.text}`, 15, y);
                        y += fontSize * 0.8;
                    });
                    y += 5;
                    break;
            }
            y += 5;
        });
    });
    
    doc.save(pageId !== null ? `trpg-trifold-page-${pageId + 1}.pdf` : 'trpg-trifold.pdf');
}

function reset() {
    if (confirm('确定要重置吗？所有内容将被清除！')) {
        state.trifold = {
            front: [
                { id: 0, blocks: [], width: 210, height: 297 },
                { id: 1, blocks: [], width: 210, height: 297 },
                { id: 2, blocks: [], width: 210, height: 297 }
            ],
            back: [
                { id: 3, blocks: [], width: 210, height: 297 },
                { id: 4, blocks: [], width: 210, height: 297 },
                { id: 5, blocks: [], width: 210, height: 297 }
            ]
        };
        state.blockIdCounter = 0;
        state.selectedBlock = null;
        createPages();
        deselectBlock();
    }
}

function getPageData(pageId, side) {
    if (side === 'front') {
        return state.trifold.front.find(p => p.id === pageId);
    } else if (side === 'back') {
        return state.trifold.back.find(p => p.id === pageId);
    }
    return null;
}

function getPageDataById(pageId) {
    return [...state.trifold.front, ...state.trifold.back].find(p => p.id === pageId);
}

document.addEventListener('click', (e) => {
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
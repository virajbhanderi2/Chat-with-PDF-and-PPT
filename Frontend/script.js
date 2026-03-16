// ===========================
// DocAI — Enterprise Script
// ===========================

const API_BASE_URL = 'http://127.0.0.1:5000';
const API_VERSION = 'v1';
const API_PREFIX = `${API_BASE_URL}/api/${API_VERSION}`;

// ===========================
// DOM Elements
// ===========================
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const uploadProgress = document.getElementById('uploadProgress');
const uploadSuccess = document.getElementById('uploadSuccess');
const fileName = document.getElementById('fileName');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const statusIndicator = document.getElementById('statusIndicator');
const navStatus = document.getElementById('navStatus');
const changeFileBtn = document.getElementById('changeFileBtn');
const topNav = document.getElementById('topNav');
const exportChatBtn = document.getElementById('exportChatBtn');
const pdfPreviewCard = document.getElementById('pdfPreviewCard');
const pdfThumbnailCanvas = document.getElementById('pdfThumbnailCanvas');

// ===========================
// Theme Toggle
// ===========================
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

// Apply saved theme on load
const savedTheme = localStorage.getItem('docai-theme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', next);
    localStorage.setItem('docai-theme', next);

    // Animate the button on toggle
    themeToggle.style.transform = 'rotate(360deg) scale(1.15)';
    setTimeout(() => { themeToggle.style.transform = ''; }, 350);
});

// ===========================
// State
// ===========================
let isPdfLoaded = false;
let isProcessing = false;

// ===========================
// Particle Canvas System
// ===========================
(function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    const PARTICLE_COUNT = 45;
    const CONNECT_DIST = 120;
    let w, h, animId;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.4 + 0.1,
        };
    }

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        // Lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    const opacity = (1 - dist / CONNECT_DIST) * 0.08;
                    ctx.strokeStyle = `rgba(99,102,241,${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        // Dots
        for (const p of particles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(129,140,248,${p.alpha})`;
            ctx.fill();
        }
    }

    function update() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;
        }
    }

    function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', () => { resize(); });
    init();
    loop();
})();

// ===========================
// Nav scroll effect
// ===========================
window.addEventListener('scroll', () => {
    if (topNav) {
        topNav.classList.toggle('scrolled', window.scrollY > 10);
    }
}, { passive: true });

// ===========================
// Upload Functionality
// ===========================
uploadArea.addEventListener('click', () => {
    if (!isPdfLoaded) fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!isPdfLoaded) uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    if (!isPdfLoaded) {
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'application/pdf' || file.name.match(/\.(ppt|pptx)$/i))) {
            handleFileUpload(file);
        } else {
            showError('Please upload a valid PDF or PPT file');
        }
    }
});

if (changeFileBtn) {
    changeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });
}

// Handle upload
async function handleFileUpload(file) {
    if (!(file.type === 'application/pdf' || file.name.match(/\.(ppt|pptx)$/i))) {
        showError('Please upload a PDF or PPT file');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    uploadPlaceholder.style.display = 'none';
    uploadProgress.style.display = 'flex';
    uploadSuccess.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_PREFIX}/load`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.error?.message || data.error || 'Upload failed';
            throw new Error(errorMsg);
        }

        const responseData = data.data || data;
        const chunks = responseData.chunks || 'multiple';
        const message = data.message || 'PDF loaded successfully';

        uploadProgress.style.display = 'none';
        uploadSuccess.style.display = 'flex';
        fileName.textContent = file.name;

        isPdfLoaded = true;
        chatInput.disabled = false;
        sendButton.disabled = false;

        updateStatus('PDF Loaded', true);
        updateNavStatus('Document Ready', true);

        // Render PDF thumbnail preview (only for PDF files)
        if (file.type === 'application/pdf') {
            renderPdfThumbnail(file);
        }

        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.animation = 'fadeOut .3s ease forwards';
            setTimeout(() => welcomeScreen.remove(), 300);
        }

        addMessage('bot', `${message} Document "${file.name}" has been processed into ${chunks} sections. I'm ready to answer your questions.`);

    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'Failed to upload document. Please try again.');
        uploadProgress.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
    }
}

// ===========================
// Chat
// ===========================
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function cleanResponse(text) {
    if (!text) return text;
    let c = text.replace(/RETRIEVED\s+\d+\s+CHUNKS?\s+FROM\s+PDF:\s*/gi, '');
    c = c.replace(/^=+\s*$/gm, '');
    c = c.replace(/\n{3,}/g, '\n\n');
    return c.trim();
}

function formatContent(text) {
    if (!text) return '';
    text = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\*/g, '');

    let paragraphs = text.split(/\n\n+/);
    paragraphs = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        if (/^\d+\./.test(para)) {
            const items = para.split('\n').map(l => {
                l = l.trim();
                return /^\d+\./.test(l) ? `<li>${l.replace(/^\d+\.\s*/, '')}</li>` : l;
            }).join('');
            return `<ol>${items}</ol>`;
        }
        if (/^[-•*]/.test(para)) {
            const items = para.split('\n').map(l => {
                l = l.trim();
                return /^[-•*]/.test(l) ? `<li>${l.replace(/^[-•*]\s*/, '')}</li>` : l;
            }).join('');
            return `<ul>${items}</ul>`;
        }
        return `<p>${para.replace(/\n/g, '<br>')}</p>`;
    });
    return paragraphs.join('');
}

function getTimeString() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function sendMessage() {
    const question = chatInput.value.trim();
    if (!question || isProcessing) return;
    if (!isPdfLoaded) { showError('Please upload a document first'); return; }

    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.style.animation = 'fadeOut .3s ease forwards';
        setTimeout(() => welcomeScreen.remove(), 300);
    }

    addMessage('user', question);
    chatInput.value = '';
    const typingId = showTypingIndicator();

    isProcessing = true;
    chatInput.disabled = true;
    sendButton.disabled = true;
    updateStatus('Thinking…', false);
    updateNavStatus('Processing', false);

    try {
        const response = await fetch(`${API_PREFIX}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (!response.ok) {
            const errorMsg = data.error?.message || data.answer || data.error || 'Failed to get response';
            addMessage('bot', `⚠️ ${errorMsg}`);
        } else {
            const responseData = data.data || data;
            const answer = responseData.answer || data.answer;
            if (answer) {
                addMessage('bot', cleanResponse(answer));
            } else {
                addMessage('bot', 'I received an empty response. Please try again.');
            }
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            addMessage('bot', `⚠️ Cannot connect to the server. Make sure the Flask server is running on ${API_BASE_URL}`);
        } else {
            addMessage('bot', `⚠️ ${error.message || 'Sorry, I encountered an error. Please try again.'}`);
        }
    } finally {
        isProcessing = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        updateStatus('Ready', true);
        updateNavStatus('System Ready', true);
        chatInput.focus();
    }
}

// Add message
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    if (type === 'bot') {
        const avatar = document.createElement('div');
        avatar.className = 'bot-avatar';
        avatar.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 7c1.66 0 3-1.34 3-3S8.66 1 7 1 4 2.34 4 4s1.34 3 3 3z" fill="white" opacity="0.9"/>
                <path d="M7 9c-2.07 0-3.5 1.34-3.5 2.5" stroke="white" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/>
            </svg>
        `;
        messageDiv.appendChild(avatar);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formatContent(content);

    if (type === 'bot' && !content.startsWith('⚠️')) {
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3" y="3" width="6.5" height="6.5" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M8 3V1.5c0-.28-.22-.5-.5-.5h-5c-.28 0-.5.22-.5.5v5c0 .28.22.5.5.5H4" stroke="currentColor" stroke-width="1.1"/></svg> Copy`;
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(contentDiv.innerText).then(() => {
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5L4.5 8L9 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3" y="3" width="6.5" height="6.5" rx="1" stroke="currentColor" stroke-width="1.1"/><path d="M8 3V1.5c0-.28-.22-.5-.5-.5h-5c-.28 0-.5.22-.5.5v5c0 .28.22.5.5.5H4" stroke="currentColor" stroke-width="1.1"/></svg> Copy`;
                }, 2000);
            });
        });
        actions.appendChild(copyBtn);
        contentDiv.appendChild(actions);
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getTimeString();
    contentDiv.appendChild(timeDiv);

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Typing indicator
function showTypingIndicator() {
    const div = document.createElement('div');
    const id = 'typing-' + Date.now();
    div.id = id;
    div.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'bot-avatar';
    avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 7c1.66 0 3-1.34 3-3S8.66 1 7 1 4 2.34 4 4s1.34 3 3 3z" fill="white" opacity="0.9"/><path d="M7 9c-2.07 0-3.5 1.34-3.5 2.5" stroke="white" stroke-width="1.2" stroke-linecap="round" opacity="0.85"/></svg>`;

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;

    div.appendChild(avatar);
    div.appendChild(indicator);
    chatMessages.appendChild(div);
    scrollToBottom();
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.animation = 'fadeOut .2s ease forwards';
        setTimeout(() => el.remove(), 200);
    }
}

function scrollToBottom() {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

// Status updates
function updateStatus(text, isReady) {
    const badgeText = statusIndicator.querySelector('.badge-text');
    const badgeDot = statusIndicator.querySelector('.badge-dot');
    badgeText.textContent = text;
    if (isReady) {
        statusIndicator.classList.remove('thinking');
        badgeDot.style.background = 'var(--success)';
        badgeDot.style.boxShadow = '0 0 6px rgba(52,211,153,0.5)';
        badgeText.style.color = 'var(--success)';
        statusIndicator.style.background = 'var(--success-bg)';
        statusIndicator.style.borderColor = 'rgba(52,211,153,0.12)';
    } else {
        statusIndicator.classList.add('thinking');
        badgeDot.style.background = 'var(--warning)';
        badgeDot.style.boxShadow = '0 0 6px rgba(251,191,36,0.5)';
        badgeText.style.color = 'var(--warning)';
        statusIndicator.style.background = 'var(--warning-bg)';
        statusIndicator.style.borderColor = 'rgba(251,191,36,0.12)';
    }
}

function updateNavStatus(text, isReady) {
    if (!navStatus) return;
    const label = navStatus.querySelector('.status-label');
    const dot = navStatus.querySelector('.status-dot');
    label.textContent = text;
    if (isReady) {
        dot.style.background = 'var(--success)';
        dot.style.boxShadow = '0 0 6px rgba(52,211,153,0.5)';
        navStatus.style.background = 'var(--success-bg)';
        navStatus.style.borderColor = 'rgba(52,211,153,0.15)';
    } else {
        dot.style.background = 'var(--warning)';
        dot.style.boxShadow = '0 0 6px rgba(251,191,36,0.5)';
        navStatus.style.background = 'var(--warning-bg)';
        navStatus.style.borderColor = 'rgba(251,191,36,0.15)';
    }
}

function showError(message) {
    const ws = document.getElementById('welcomeScreen');
    if (ws) {
        ws.style.animation = 'fadeOut .3s ease forwards';
        setTimeout(() => ws.remove(), 300);
    }
    addMessage('bot', `⚠️ ${message}`);
}

function resetUpload() {
    location.reload();
}

// ===========================
// PDF Thumbnail Renderer
// ===========================
async function renderPdfThumbnail(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const desiredWidth = 260;
        const viewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        pdfThumbnailCanvas.width = scaledViewport.width;
        pdfThumbnailCanvas.height = scaledViewport.height;

        const ctx = pdfThumbnailCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pdfThumbnailCanvas.width, pdfThumbnailCanvas.height);

        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

        pdfPreviewCard.style.display = 'block';
    } catch (err) {
        console.warn('PDF thumbnail render failed:', err);
        // Silently fail — preview is optional
    }
}

// ===========================
// Chat Export
// ===========================
function exportChat() {
    const messages = chatMessages.querySelectorAll('.message');
    if (!messages.length) return;

    const lines = [];
    const now = new Date().toLocaleString();
    lines.push(`DocAI — Chat Export`);
    lines.push(`Exported: ${now}`);
    lines.push(`${'='.repeat(50)}`);
    lines.push('');

    messages.forEach(msg => {
        const isUser = msg.classList.contains('user-message');
        const isBot  = msg.classList.contains('bot-message');
        if (!isUser && !isBot) return;

        const contentDiv = msg.querySelector('.message-content');
        if (!contentDiv) return;

        // Get plain text content (ignoring action buttons and timestamps)
        const clone = contentDiv.cloneNode(true);
        clone.querySelectorAll('.message-actions, .message-time').forEach(el => el.remove());
        const text = clone.innerText.trim();

        if (isUser) {
            lines.push(`You: ${text}`);
        } else {
            lines.push(`DocAI: ${text}`);
        }
        lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `DocAI_Chat_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    // Brief visual feedback — turn button green with text
    const originalHTML = exportChatBtn.innerHTML;
    exportChatBtn.classList.add('success');
    exportChatBtn.innerHTML = `✓ Downloaded!`;
    exportChatBtn.style.minWidth = exportChatBtn.offsetWidth + 'px'; // prevent jitter
    setTimeout(() => {
        exportChatBtn.classList.remove('success');
        exportChatBtn.innerHTML = originalHTML;
        exportChatBtn.style.minWidth = '';
    }, 2000);
}

if (exportChatBtn) {
    exportChatBtn.addEventListener('click', exportChat);
}

// Fade-out keyframe
const fadeStyle = document.createElement('style');
fadeStyle.textContent = `@keyframes fadeOut{to{opacity:0;transform:translateY(-8px)}}`;
document.head.appendChild(fadeStyle);

// Console branding
console.log('%c DocAI ', 'background:linear-gradient(135deg,#818cf8,#06b6d4);color:white;font-size:14px;padding:4px 12px;border-radius:6px;font-weight:bold');
console.log('%c Enterprise Edition', 'color:#4f5a6e;font-size:11px');
console.log('%c Backend: ' + API_BASE_URL, 'color:#4f5a6e');
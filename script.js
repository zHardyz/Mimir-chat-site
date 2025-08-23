// Configurações da aplicação
const CONFIG = {
    API_ENDPOINT: '/.netlify/functions/chat', // Será atualizado com a URL do Netlify
    MAX_MESSAGE_LENGTH: 1000,
    TYPING_DELAY: 1000, // Delay antes de mostrar "MIMIR está pensando"
    SCROLL_DELAY: 100 // Delay para scroll automático
};

// Elementos do DOM
const elements = {
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendButton: document.getElementById('send-button'),
    typingIndicator: document.getElementById('typing-indicator'),
    welcomeTime: document.getElementById('welcome-time')
};

// Estado da aplicação
let isProcessing = false;
let conversationHistory = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    setWelcomeTime();
});

// Inicializar aplicação
function initializeApp() {
    // Definir altura máxima do textarea
    elements.messageInput.style.maxHeight = '120px';
    
    // Auto-resize do textarea
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    
    // Focar no input
    elements.messageInput.focus();
    
    console.log('🚀 MIMIR Chat inicializado');
}

// Configurar event listeners
function setupEventListeners() {
    // Enviar mensagem com Enter
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Enviar mensagem com botão
    elements.sendButton.addEventListener('click', sendMessage);
    
    // Atualizar estado do botão baseado no input
    elements.messageInput.addEventListener('input', updateSendButtonState);
    
    // Scroll automático quando novas mensagens aparecem
    const observer = new MutationObserver(() => {
        setTimeout(scrollToBottom, CONFIG.SCROLL_DELAY);
    });
    
    observer.observe(elements.chatMessages, {
        childList: true,
        subtree: true
    });
}

// Definir horário da mensagem de boas-vindas
function setWelcomeTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    elements.welcomeTime.textContent = timeString;
}

// Auto-resize do textarea
function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Atualizar estado do botão de envio
function updateSendButtonState() {
    const message = elements.messageInput.value.trim();
    const isValid = message.length > 0 && message.length <= CONFIG.MAX_MESSAGE_LENGTH;
    
    elements.sendButton.disabled = !isValid || isProcessing;
    
    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        elements.messageInput.style.borderColor = '#ff4444';
    } else {
        elements.messageInput.style.borderColor = '';
    }
}

// Enviar mensagem
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message || message.length > CONFIG.MAX_MESSAGE_LENGTH || isProcessing) {
        return;
    }
    
    // Adicionar mensagem do usuário
    addUserMessage(message);
    
    // Limpar input
    elements.messageInput.value = '';
    autoResizeTextarea();
    updateSendButtonState();
    
    // Processar resposta do MIMIR
    await processMimirResponse(message);
}

// Adicionar mensagem do usuário
function addUserMessage(message) {
    const messageElement = createMessageElement(message, 'user');
    elements.chatMessages.appendChild(messageElement);
    
    // Adicionar ao histórico
    conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
    
    scrollToBottom();
}

// Adicionar mensagem do MIMIR
function addMimirMessage(message) {
    const messageElement = createMessageElement(message, 'mimir');
    elements.chatMessages.appendChild(messageElement);
    
    // Adicionar ao histórico
    conversationHistory.push({
        role: 'assistant',
        content: message,
        timestamp: new Date()
    });
    
    scrollToBottom();
}

// Criar elemento de mensagem
function createMessageElement(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const timeString = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="assets/user-avatar.png" alt="Você" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNmZjZiOWQiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMmMyLjIxIDAgNC0xLjc5IDQtNHMtMS43OS00LTQtNC00IDEuNzktNCA0IDEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo='">
            </div>
            <div class="message-bubble">
                <p>${escapeHtml(message)}</p>
                <span class="message-time">${timeString}</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="assets/artwork.png" alt="MIMIR" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwMGQ0ZmYiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOC4xN2wtOSA5eiIvPgo8L3N2Zz4KPC9zdmc+Cg=='">
            </div>
            <div class="message-bubble">
                <p>${escapeHtml(message)}</p>
                <span class="message-time">${timeString}</span>
            </div>
        `;
    }
    
    return messageDiv;
}

// Processar resposta do MIMIR
async function processMimirResponse(userMessage) {
    isProcessing = true;
    updateSendButtonState();
    
    // Mostrar indicador de digitação
    setTimeout(() => {
        if (isProcessing) {
            elements.typingIndicator.classList.add('show');
        }
    }, CONFIG.TYPING_DELAY);
    
    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userMessage,
                history: conversationHistory.slice(-10) // Últimas 10 mensagens para contexto
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.reply) {
            addMimirMessage(data.reply);
        } else {
            throw new Error('Resposta inválida da API');
        }
        
    } catch (error) {
        console.error('Erro ao comunicar com MIMIR:', error);
        addMimirMessage('Desculpe, estou enfrentando algumas dificuldades técnicas no momento. Pode tentar novamente em alguns instantes?');
    } finally {
        isProcessing = false;
        elements.typingIndicator.classList.remove('show');
        updateSendButtonState();
    }
}

// Scroll para o final da conversa
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Escapar HTML para segurança
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para atualizar endpoint da API (será chamada após deploy)
function updateApiEndpoint(netlifyUrl) {
    CONFIG.API_ENDPOINT = `${netlifyUrl}/.netlify/functions/chat`;
    console.log('🔗 Endpoint da API atualizado:', CONFIG.API_ENDPOINT);
}

// Função para adicionar mensagem de erro
function addErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message mimir-message error';
    errorDiv.innerHTML = `
        <div class="message-avatar">
            <img src="assets/artwork.png" alt="MIMIR">
        </div>
        <div class="message-bubble" style="border-color: #ff4444; background: rgba(255, 68, 68, 0.1);">
            <p>⚠️ ${escapeHtml(message)}</p>
            <span class="message-time">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
    `;
    elements.chatMessages.appendChild(errorDiv);
    scrollToBottom();
}

// Função para limpar conversa
function clearConversation() {
    elements.chatMessages.innerHTML = '';
    conversationHistory = [];
    
    // Adicionar mensagem de boas-vindas novamente
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message mimir-message';
    welcomeMessage.innerHTML = `
        <div class="message-avatar">
            <img src="assets/artwork.png" alt="MIMIR">
        </div>
        <div class="message-bubble">
            <p>Olá, viajante do futuro. Eu sou MIMIR, seu guia através das fronteiras da inovação e tecnologia. Como posso iluminar seu caminho hoje?</p>
            <span class="message-time" id="welcome-time">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
    `;
    elements.chatMessages.appendChild(welcomeMessage);
}

// Exportar funções para uso global (se necessário)
window.MimirChat = {
    updateApiEndpoint,
    clearConversation,
    addErrorMessage
};

// Log de inicialização
console.log('🎯 MIMIR Chat carregado com sucesso!');
console.log('📡 Endpoint atual:', CONFIG.API_ENDPOINT);

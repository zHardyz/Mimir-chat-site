// Script principal do Mimir Chat
// Gerencia a interface do usuário e comunicação com o backend

class MimirChat {
    constructor() {
        // Elementos DOM
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.welcomeTime = document.getElementById('welcome-time');
        
        // Estado da conversa
        this.conversationHistory = [];
        this.isWaitingResponse = false;
        
        // Configurações
        this.maxMessages = 50; // Limite de mensagens para performance
        this.typingDelay = 1000; // Delay mínimo para simular digitação
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWelcomeMessage();
        this.focusInput();
        
        console.log('🤖 Mimir Chat inicializado!');
    }

    setupEventListeners() {
        // Botão enviar
        this.sendButton.addEventListener('click', () => {
            this.handleSendMessage();
        });

        // Enter no input (com suporte a Shift+Enter para quebra de linha)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Auto-resize do textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButtonState();
        });

        // Prevenir envio de formulário se existir
        const form = this.messageInput.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSendMessage();
            });
        }

        // Detectar quando o usuário está digitando
        let typingTimer;
        this.messageInput.addEventListener('input', () => {
            clearTimeout(typingTimer);
            // Implementar indicador de digitação se necessário
        });
    }

    setupWelcomeMessage() {
        // Configurar hora da mensagem de boas-vindas
        if (this.welcomeTime) {
            this.welcomeTime.textContent = this.formatTime(new Date());
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        
        // Validações
        if (!message) return;
        if (this.isWaitingResponse) return;
        if (message.length > 1000) {
            this.showError('Mensagem muito longa! Máximo de 1000 caracteres.');
            return;
        }

        try {
            // Adicionar mensagem do usuário
            this.addMessage(message, 'user');
            
            // Limpar input
            this.messageInput.value = '';
            this.autoResizeTextarea();
            this.updateSendButtonState();
            
            // Mostrar indicador de digitação
            this.showTypingIndicator();
            
            // Enviar para API
            const response = await this.sendToAPI(message);
            
            // Esconder indicador de digitação
            this.hideTypingIndicator();
            
            // Adicionar resposta do Mimir
            if (response && response.reply) {
                // Simular delay de digitação
                setTimeout(() => {
                    this.addMessage(response.reply, 'mimir');
                }, Math.max(this.typingDelay, 500));
            } else {
                throw new Error('Resposta inválida do servidor');
            }

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.hideTypingIndicator();
            
            // Mensagem de erro amigável
            setTimeout(() => {
                this.addMessage(
                    'Ops, parece que encontrei um probleminha técnico! 🤔 Pode tentar novamente?',
                    'mimir'
                );
            }, 500);
        }
    }

    async sendToAPI(message) {
        this.isWaitingResponse = true;
        
        try {
            // Preparar dados para envio
            const payload = {
                message: message,
                history: this.conversationHistory.slice(-10) // Últimas 10 mensagens para contexto
            };

            // Fazer requisição para a função Netlify
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            // Adicionar ao histórico
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.reply }
            );

            // Manter apenas as últimas mensagens para performance
            if (this.conversationHistory.length > this.maxMessages * 2) {
                this.conversationHistory = this.conversationHistory.slice(-this.maxMessages);
            }

            return data;

        } finally {
            this.isWaitingResponse = false;
        }
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        if (sender === 'mimir') {
            const avatarImg = document.createElement('img');
            avatarImg.src = 'assets/sorriso.jpg';
            avatarImg.alt = 'Mimir';
            avatarDiv.appendChild(avatarImg);
        } else {
            // Avatar simples para usuário
            avatarDiv.innerHTML = '<div class="user-avatar">👤</div>';
        }
        
        // Bubble da mensagem
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const contentP = document.createElement('p');
        contentP.textContent = content;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = this.formatTime(new Date());
        
        bubbleDiv.appendChild(contentP);
        bubbleDiv.appendChild(timeSpan);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        
        // Adicionar ao chat
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll para baixo
        this.scrollToBottom();
        
        // Animar entrada da mensagem de forma mais suave
        setTimeout(() => {
            messageDiv.classList.add('animated');
        }, 50);
    }

    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'flex';
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    scrollToBottom() {
        // Usar requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }

    autoResizeTextarea() {
        const textarea = this.messageInput;
        
        // Reset height to auto to get correct scrollHeight
        textarea.style.height = 'auto';
        
        // Calculate new height
        const newHeight = Math.min(textarea.scrollHeight, 120); // Máximo de ~5 linhas
        
        // Set new height
        textarea.style.height = newHeight + 'px';
    }

    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        const isWaiting = this.isWaitingResponse;
        
        this.sendButton.disabled = !hasText || isWaiting;
        
        if (isWaiting) {
            this.sendButton.classList.add('loading');
        } else {
            this.sendButton.classList.remove('loading');
        }
    }

    formatTime(date) {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        // Criar notificação de erro temporária
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(errorDiv);

        // Remover após 5 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(errorDiv);
                }, 300);
            }
        }, 5000);
    }

    focusInput() {
        // Focar no input quando a página carregar
        if (this.messageInput && !('ontouchstart' in window)) {
            // Não focar automaticamente em dispositivos touch
            setTimeout(() => {
                this.messageInput.focus();
            }, 500);
        }
    }

    // Método público para limpar conversa
    clearChat() {
        // Remover todas as mensagens exceto a de boas-vindas
        const messages = this.chatMessages.querySelectorAll('.message:not(.welcome-message)');
        messages.forEach(msg => msg.remove());
        
        // Limpar histórico
        this.conversationHistory = [];
        
        // Focar no input
        this.focusInput();
    }

    // Método público para verificar conectividade
    async testConnection() {
        try {
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'test' })
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// CSS adicional para animações e estilos faltantes
const additionalCSS = `
<style>
    .message {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    }

    .message.animated {
        opacity: 1;
        transform: translateY(0);
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(100%);
        }
    }

    .send-button.loading {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .send-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #7D3CFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        color: white;
    }

    .user-message {
        flex-direction: row-reverse;
    }

    .user-message .message-bubble {
        background: #7D3CFF;
        color: white;
        margin-left: 60px;
        margin-right: 0;
    }

    .user-message .message-avatar {
        margin-left: 12px;
        margin-right: 0;
    }

    .error-notification {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
    }

    /* Melhorar responsividade do textarea */
    #message-input {
        resize: none;
        overflow-y: auto;
        transition: height 0.1s ease;
    }

    /* Indicador de digitação melhorado */
    .typing-indicator {
        padding: 12px 0;
        display: none;
        align-items: center;
        gap: 8px;
        color: #666;
        font-style: italic;
        margin-left: 50px;
    }

    .dots {
        display: flex;
        gap: 4px;
    }

    .dots span {
        width: 6px;
        height: 6px;
        background: #7D3CFF;
        border-radius: 50%;
        animation: dotPulse 1.4s infinite both;
    }

    .dots span:nth-child(1) { animation-delay: -0.32s; }
    .dots span:nth-child(2) { animation-delay: -0.16s; }
    .dots span:nth-child(3) { animation-delay: 0s; }

    @keyframes dotPulse {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
</style>
`;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar CSS adicional
    document.head.insertAdjacentHTML('beforeend', additionalCSS);
    
    // Inicializar chat
    const mimirChat = new MimirChat();
    
    // Disponibilizar globalmente para debugging e extensões
    window.MimirChat = mimirChat;
    
    // Verificar conectividade inicial
    mimirChat.testConnection().then(connected => {
        if (!connected) {
            console.warn('⚠️ Possível problema de conectividade com o backend');
        }
    });
    
    console.log('🚀 Mimir Chat carregado com sucesso!');
});

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Falha silenciosa - service worker é opcional
        });
    });
}
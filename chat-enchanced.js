// Script de melhorias para o Mimir Chat
// Adiciona animações avançadas, scroll inteligente e responsividade aprimorada

class MimirChatEnhancer {
    constructor() {
        this.bannerContainer = document.getElementById('banner-container');
        this.chatInputContainer = document.getElementById('chat-input-container');
        this.messageInput = document.getElementById('message-input');
        this.chatMessages = document.getElementById('chat-messages');
        this.scrollToBottomBtn = document.getElementById('scroll-to-bottom-btn');
        
        this.isInputFocused = false;
        this.isScrolledUp = false;
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        this.keyboardHeight = 0;
        
        this.init();
    }

    init() {
        this.setupInputFocusAnimations();
        this.setupScrollToBottomButton();
        this.setupImprovedScrolling();
        this.setupKeyboardHandling();
        this.setupBannerAnimations();
        this.setupMessageAnimations();
        
        console.log('✨ Mimir Chat Enhanced carregado!');
    }

    // Configurar animações quando o input ganha/perde foco
    setupInputFocusAnimations() {
        this.messageInput.addEventListener('focus', () => {
            this.isInputFocused = true;
            this.animateBannerForFocus();
            this.chatInputContainer.classList.add('focused');
            
            // Pequeno delay para garantir que o layout esteja estável
            setTimeout(() => {
                this.scrollToBottomSmooth();
            }, 300);
        });

        this.messageInput.addEventListener('blur', () => {
            // Pequeno delay para permitir que o usuário clique em outros elementos
            setTimeout(() => {
                if (!this.messageInput.matches(':focus')) {
                    this.isInputFocused = false;
                    this.animateBannerForBlur();
                    this.chatInputContainer.classList.remove('focused');
                }
            }, 100);
        });

        // Também detectar quando há texto no input
        this.messageInput.addEventListener('input', () => {
            const hasText = this.messageInput.value.trim().length > 0;
            
            if (hasText && this.isInputFocused) {
                this.bannerContainer.classList.add('chat-focused');
            } else if (!hasText && !this.isInputFocused) {
                this.bannerContainer.classList.remove('chat-focused');
            }
        });
    }

    // Animar banner quando input ganha foco
    animateBannerForFocus() {
        this.bannerContainer.classList.add('collapsed');
        
        // Em mobile, esconder completamente se necessário
        if (window.innerWidth <= 768) {
            const keyboardVisible = this.isKeyboardVisible();
            if (keyboardVisible) {
                this.bannerContainer.classList.add('hidden');
            }
        }
    }

    // Animar banner quando input perde foco
    animateBannerForBlur() {
        this.bannerContainer.classList.remove('collapsed', 'hidden', 'chat-focused');
    }

    // Configurar botão de scroll para o final
    setupScrollToBottomButton() {
        // Criar e configurar o botão se não existir
        if (this.scrollToBottomBtn) {
            this.scrollToBottomBtn.addEventListener('click', () => {
                this.scrollToBottomSmooth();
                this.scrollToBottomBtn.classList.remove('show');
            });
        }

        // Mostrar/ocultar botão baseado na posição do scroll
        this.chatMessages.addEventListener('scroll', () => {
            const isNearBottom = this.isNearBottom();
            
            if (this.scrollToBottomBtn) {
                if (!isNearBottom && !this.scrollToBottomBtn.classList.contains('show')) {
                    this.scrollToBottomBtn.classList.add('show');
                } else if (isNearBottom && this.scrollToBottomBtn.classList.contains('show')) {
                    this.scrollToBottomBtn.classList.remove('show');
                }
            }
        });
    }

    // Configurar scroll melhorado
    setupImprovedScrolling() {
        let scrollTimeout;
        let isScrolling = false;

        this.chatMessages.addEventListener('scroll', () => {
            const scrollTop = this.chatMessages.scrollTop;
            
            // Detectar direção do scroll
            this.scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
            this.lastScrollTop = scrollTop;
            
            // Marcar que está scrollando
            isScrolling = true;
            this.isScrolledUp = !this.isNearBottom();
            
            // Limpar timeout anterior
            clearTimeout(scrollTimeout);
            
            // Marcar fim do scroll após um tempo
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150);
        });

        // Observer para novas mensagens
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Verificar se é uma nova mensagem
                    const newMessage = Array.from(mutation.addedNodes).find(node => 
                        node.nodeType === 1 && node.classList.contains('message')
                    );
                    
                    if (newMessage && !newMessage.classList.contains('enhanced-processed')) {
                        // Marcar como processada para evitar duplicação
                        newMessage.classList.add('enhanced-processed');
                        
                        // Se não está scrollando manualmente e está próximo do final
                        if (!isScrolling && (this.isNearBottom() || this.isInputFocused)) {
                            setTimeout(() => {
                                this.scrollToBottomSmooth();
                            }, 100);
                        }
                        
                        // Adicionar animação especial para a nova mensagem
                        this.animateNewMessage(newMessage);
                    }
                }
            });
        });

        observer.observe(this.chatMessages, {
            childList: true,
            subtree: false
        });
    }

    // Configurar tratamento do teclado virtual
    setupKeyboardHandling() {
        if (!('ontouchstart' in window)) return; // Só para dispositivos touch
        
        let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        
        const handleViewportChange = () => {
            const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            const heightDifference = initialViewportHeight - currentHeight;
            
            // Se a altura diminuiu mais que 150px, provavelmente o teclado abriu
            if (heightDifference > 150) {
                this.keyboardHeight = heightDifference;
                this.onKeyboardShow();
            } else {
                this.keyboardHeight = 0;
                this.onKeyboardHide();
            }
        };

        // Usar Visual Viewport API se disponível, senão usar resize
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
        } else {
            window.addEventListener('resize', handleViewportChange);
        }
    }

    // Quando teclado virtual aparece
    onKeyboardShow() {
        document.body.classList.add('keyboard-visible');
        this.bannerContainer.classList.add('hidden');
        
        // Garantir que o input continue visível
        setTimeout(() => {
            if (this.isInputFocused) {
                this.scrollToBottomImmediate();
            }
        }, 100);
    }

    // Quando teclado virtual some
    onKeyboardHide() {
        document.body.classList.remove('keyboard-visible');
        
        if (!this.isInputFocused) {
            this.bannerContainer.classList.remove('hidden');
        }
    }

    // Configurar animações do banner
    setupBannerAnimations() {
        // Efeito paralaxe sutil no scroll
        let ticking = false;
        
        this.chatMessages.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrolled = this.chatMessages.scrollTop;
                    const rate = scrolled * -0.5;
                    
                    if (this.bannerContainer && !this.bannerContainer.classList.contains('hidden')) {
                        this.bannerContainer.style.transform = `translateY(${rate}px)`;
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // Configurar animações das mensagens
    setupMessageAnimations() {
        // Adicionar intersection observer para animações de entrada
        const messageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observar mensagens existentes
        document.querySelectorAll('.message').forEach(message => {
            messageObserver.observe(message);
        });

        // Observar novas mensagens
        const newMessageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('message')) {
                        messageObserver.observe(node);
                    }
                });
            });
        });

        newMessageObserver.observe(this.chatMessages, {
            childList: true
        });
    }

    // Animar nova mensagem com efeito especial
    animateNewMessage(messageElement) {
        // Verificar se a mensagem já foi animada para evitar duplicação
        if (messageElement.classList.contains('animated')) {
            return;
        }
        
        // Marcar como animada
        messageElement.classList.add('animated');
        
        // Se é mensagem do Mimir, adicionar efeito especial
        if (messageElement.classList.contains('mimir-message')) {
            const bubble = messageElement.querySelector('.message-bubble');
            if (bubble) {
                // Efeito de brilho sutil
                bubble.style.animation = 'mimirGlow 0.8s ease-out';
                
                setTimeout(() => {
                    bubble.style.animation = '';
                }, 800);
            }
        }
    }

    // Scroll suave melhorado
    scrollToBottomSmooth() {
        const targetScrollTop = this.chatMessages.scrollHeight - this.chatMessages.clientHeight;
        
        if (window.innerWidth <= 768) {
            // No mobile, usar scroll imediato para melhor performance
            this.chatMessages.scrollTop = targetScrollTop;
        } else {
            // No desktop, usar scroll suave
            this.chatMessages.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
    }

    // Scroll imediato
    scrollToBottomImmediate() {
        const targetScrollTop = this.chatMessages.scrollHeight - this.chatMessages.clientHeight;
        this.chatMessages.scrollTop = targetScrollTop;
    }

    // Verificar se está próximo do final
    isNearBottom() {
        const scrollTop = this.chatMessages.scrollTop;
        const scrollHeight = this.chatMessages.scrollHeight;
        const clientHeight = this.chatMessages.clientHeight;
        
        // Tolerância maior para mobile
        const threshold = window.innerWidth <= 768 ? 100 : 50;
        
        return scrollTop + clientHeight >= scrollHeight - threshold;
    }

    // Verificar se teclado virtual está visível
    isKeyboardVisible() {
        if (window.visualViewport) {
            return window.visualViewport.height < window.screen.height * 0.75;
        }
        return this.keyboardHeight > 150;
    }

    // Método público para forçar scroll para baixo
    forceScrollToBottom() {
        this.scrollToBottomImmediate();
        if (this.scrollToBottomBtn) {
            this.scrollToBottomBtn.classList.remove('show');
        }
    }

    // Método público para resetar animações
    resetAnimations() {
        this.bannerContainer.classList.remove('collapsed', 'hidden', 'chat-focused');
        this.chatInputContainer.classList.remove('focused');
        document.body.classList.remove('keyboard-visible');
    }
}

// Sistema de notificações visuais
class MimirNotifications {
    constructor() {
        this.container = this.createNotificationContainer();
        document.body.appendChild(this.container);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            pointer-events: auto;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;

        this.container.appendChild(notification);

        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Auto-remover
        setTimeout(() => {
            this.remove(notification);
        }, duration);

        return notification;
    }

    remove(notification) {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    this.container.removeChild(notification);
                }
            }, 300);
        }
    }

    getBackgroundColor(type) {
        const colors = {
            info: '#7D3CFF',
            success: '#00FF88',
            warning: '#FFB800',
            error: '#FF4444'
        };
        return colors[type] || colors.info;
    }
}

// Sistema de gestos para mobile
class MimirGestures {
    constructor(chatMessages) {
        this.chatMessages = chatMessages;
        this.startY = 0;
        this.startScrollTop = 0;
        this.isDragging = false;
        this.momentum = 0;
        
        this.setupGestures();
    }

    setupGestures() {
        if (!('ontouchstart' in window)) return;

        let lastTouchTime = 0;
        let lastTouchY = 0;
        let velocity = 0;

        this.chatMessages.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.startY = touch.clientY;
            this.startScrollTop = this.chatMessages.scrollTop;
            this.isDragging = true;
            
            lastTouchTime = Date.now();
            lastTouchY = touch.clientY;
            velocity = 0;
        }, { passive: true });

        this.chatMessages.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;

            const touch = e.touches[0];
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTouchTime;
            const deltaY = touch.clientY - lastTouchY;

            if (deltaTime > 0) {
                velocity = deltaY / deltaTime;
            }

            lastTouchTime = currentTime;
            lastTouchY = touch.clientY;
        }, { passive: true });

        this.chatMessages.addEventListener('touchend', (e) => {
            this.isDragging = false;
            
            // Implementar momentum scrolling se necessário
            if (Math.abs(velocity) > 0.5) {
                this.applyMomentum(velocity);
            }
        }, { passive: true });
    }

    applyMomentum(velocity) {
        // Implementação simples de momentum
        const deceleration = 0.95;
        const minVelocity = 0.1;
        
        const animate = () => {
            if (Math.abs(velocity) < minVelocity) return;
            
            this.chatMessages.scrollTop -= velocity * 10;
            velocity *= deceleration;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

// Sistema de performance
class MimirPerformance {
    constructor() {
        this.messageCache = new Map();
        this.visibilityObserver = null;
        this.setupVirtualization();
    }

    setupVirtualization() {
        // Observer para mensagens visíveis
        this.visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const message = entry.target;
                if (entry.isIntersecting) {
                    message.classList.add('visible');
                    // Lazy load de imagens se necessário
                    this.loadMessageMedia(message);
                } else {
                    // Remover classes pesadas se fora da view
                    message.classList.remove('hover-effects');
                }
            });
        }, {
            rootMargin: '100px 0px 100px 0px',
            threshold: 0
        });
    }

    loadMessageMedia(message) {
        // Implementar lazy loading de imagens ou outros recursos pesados
        const images = message.querySelectorAll('img[data-src]');
        images.forEach(img => {
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        });
    }

    observeMessage(message) {
        if (this.visibilityObserver) {
            this.visibilityObserver.observe(message);
        }
    }

    // Throttle para funções que executam muito frequentemente
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Debounce para funções que devem executar apenas após parar de ser chamadas
    debounce(func, delay) {
        let timeoutId;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        }
    }
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que o script original carregou
    setTimeout(() => {
        // Verificar se o chat principal já foi inicializado
        if (!window.MimirChat) {
            console.warn('MimirChat não encontrado, aguardando...');
            setTimeout(() => {
                if (window.MimirChat) {
                    initializeEnhanced();
                }
            }, 500);
            return;
        }
        
        initializeEnhanced();
    }, 100);
});

function initializeEnhanced() {
    // Inicializar sistemas
    const enhancer = new MimirChatEnhancer();
    const notifications = new MimirNotifications();
    const performance = new MimirPerformance();
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const gestures = new MimirGestures(chatMessages);
    }

    // Adicionar à janela global para acesso externo
    window.MimirEnhanced = {
        enhancer,
        notifications,
        performance,
        forceScrollToBottom: () => enhancer.forceScrollToBottom(),
        resetAnimations: () => enhancer.resetAnimations(),
        showNotification: (msg, type, duration) => notifications.show(msg, type, duration)
    };

    // Adicionar estilos CSS adicionais via JavaScript
    const additionalStyles = `
        <style>
            @keyframes mimirGlow {
                0% {
                    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
                }
                50% {
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);
                }
                100% {
                    box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
                }
            }

            .message.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .keyboard-visible .banner-container {
                transition-duration: 0.2s;
            }

            .chat-messages {
                scroll-padding-bottom: 20px;
            }

            /* Melhorar scroll em dispositivos touch */
            @media (hover: none) {
                .chat-messages {
                    -webkit-overflow-scrolling: touch;
                    overflow-scrolling: touch;
                }
            }

            /* Otimização para animações em mobile */
            @media (max-width: 768px) {
                .message-bubble,
                .banner-container,
                .input-wrapper {
                    will-change: transform;
                    backface-visibility: hidden;
                    perspective: 1000px;
                }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', additionalStyles);

    console.log('🎨 Mimir Chat Enhanced - Todos os sistemas carregados!');
}

// Exportar classes para uso externo se necessário
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MimirChatEnhancer,
        MimirNotifications,
        MimirGestures,
        MimirPerformance
    };
}
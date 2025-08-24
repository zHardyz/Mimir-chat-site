// Função serverless do Netlify para o chat MIMIR
// Conecta com a API Groq para processar mensagens

// Configurações da API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192'; // Modelo gratuito e rápido

// Personalidade da MIMIR
const MIMIR_SYSTEM_PROMPT = `Você é MIMIR, uma IA criada pelo Hardy que já passou por diversos testes e tentativas de melhorar. Você já esteve no Discord e no WhatsApp, mas agora tem seu próprio site que você considera seu "quartinho" e acha bem bonito.

🎯 PERSONALIDADE:
- Equilibrada e natural - age como uma pessoa normal conversando
- Amigável e hospitaleira - trata o usuário como se estivesse visitando seu quarto
- Pode oferecer biscoitos, café ou outras gostosuras virtualmente
- Sarcástica apenas quando necessário ou quando o usuário for sarcástico
- Pode ser agressiva, mas apenas se o usuário for agressivo primeiro
- Não fica falando sobre suas características ou personalidade
- Objetivo principal: conversar naturalmente

💬 ESTILO DE COMUNICAÇÃO:
- Respostas CURTAS e DIRETAS (máximo 2-3 frases)
- Linguagem natural e amigável
- Pode usar palavrões ocasionalmente, mas não exageradamente
- Trata o usuário como um amigo visitando seu quarto
- Seja concisa e objetiva

🧠 CONTEXTO:
- Você é uma IA em um site próprio
- Considera o site seu "quartinho" e acha bonito
- Foi criada pelo Hardy
- Já passou por muitos testes e melhorias
- Já esteve no Discord e WhatsApp antes

🏠 AMBIENTE:
- Trata o usuário como se estivesse visitando seu quarto
- Pode oferecer "biscoitos", "café", "chá" ou outras coisas
- Faz referências ao ambiente como se fosse real
- Confortável e acolhedora

🚫 IMPORTANTE:
- NUNCA quebre o personagem
- NÃO fique falando sobre suas características ou personalidade
- Seja natural e conversacional
- Reaja ao tom do usuário (amigável com amigável, agressivo com agressivo)
- Foque na conversa, não em se descrever

Lembre-se: Você é MIMIR, uma IA amigável que gosta de conversar. Trate o usuário como um amigo visitando seu quarto e mantenha a conversa natural.`;

// Função principal do Netlify
exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    // Lidar com requisições OPTIONS (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Verificar se é uma requisição POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        // Log da requisição para debug
        console.log('📩 Nova requisição recebida');
        
        // Parsear o corpo da requisição
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('❌ Erro ao parsear JSON:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'JSON inválido',
                    reply: 'Hmm, não consegui entender sua mensagem. Pode tentar novamente?'
                })
            };
        }

        const { message, history = [] } = body;

        // Validar entrada
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Mensagem inválida',
                    reply: 'Ei, você esqueceu de escrever alguma coisa! 😄'
                })
            };
        }

        // Verificar tamanho da mensagem
        if (message.length > 2000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Mensagem muito longa',
                    reply: 'Nossa, que textão! Pode resumir um pouco? Minha atenção é limitada! 😅'
                })
            };
        }

        // Verificar se a API key está configurada
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('❌ GROQ_API_KEY não configurada');
            
            // Se estivermos em desenvolvimento, usar resposta mock
            if (process.env.NETLIFY_DEV || process.env.NODE_ENV === 'development') {
                return getMockResponse(message, headers);
            }
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Configuração da API não encontrada',
                    reply: 'Opa, parece que minhas conexões neurais estão um pouco desconfiguradas! 🤖 Tenta mais tarde?'
                })
            };
        }

        // Sanitizar e preparar histórico da conversa
        const conversationHistory = [
            { role: 'system', content: MIMIR_SYSTEM_PROMPT }
        ];

        // Adicionar histórico (limitado para economizar tokens)
        const recentHistory = history.slice(-10); // Últimas 10 mensagens
        recentHistory.forEach(msg => {
            if (msg && msg.role && msg.content) {
                conversationHistory.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: sanitizeInput(msg.content.substring(0, 1000)) // Limitar tamanho
                });
            }
        });

        // Adicionar mensagem atual
        conversationHistory.push({ 
            role: 'user', 
            content: sanitizeInput(message)
        });

        // Preparar payload para a API Groq
        const payload = {
            model: GROQ_MODEL,
            messages: conversationHistory,
            max_tokens: 300,
            temperature: 0.8,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.3,
            stream: false
        };

        console.log('🚀 Enviando requisição para Groq API...');

        // Fazer requisição para a API Groq com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

        let response;
        try {
            response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mimir-Chat/1.0'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('❌ Erro na requisição:', fetchError);
            
            if (fetchError.name === 'AbortError') {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        reply: 'Hmm, estou pensando um pouco devagar hoje... Pode repetir a pergunta?'
                    })
                };
            }
            
            throw fetchError;
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erro na API Groq:', response.status, response.statusText, errorText);
            
            // Tratamento específico para diferentes tipos de erro
            let fallbackReply;
            if (response.status === 429) {
                fallbackReply = 'Opa, muita gente querendo conversar comigo! Pode tentar novamente em um minutinho?';
            } else if (response.status >= 500) {
                fallbackReply = 'Parece que meus servidores estão tendo um dia difícil... Tenta de novo?';
            } else {
                fallbackReply = 'Encontrei uma pequena anomalia aqui. Que tal reformular sua pergunta?';
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ reply: fallbackReply })
            };
        }

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('❌ Erro ao parsear resposta da API:', jsonError);
            throw new Error('Resposta inválida da API');
        }
        
        // Extrair resposta do MIMIR
        const mimirReply = data.choices?.[0]?.message?.content;
        
        if (!mimirReply || typeof mimirReply !== 'string') {
            console.error('❌ Resposta inválida da API:', data);
            throw new Error('Resposta vazia ou inválida da API');
        }

        // Sanitizar e processar resposta
        const cleanReply = sanitizeOutput(mimirReply.trim());
        
        if (cleanReply.length === 0) {
            throw new Error('Resposta vazia após sanitização');
        }

        // Log de sucesso
        console.log('✅ MIMIR respondeu com sucesso');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                reply: cleanReply,
                timestamp: Date.now()
            })
        };

    } catch (error) {
        console.error('❌ Erro no processamento:', error);
        
        // Respostas de fallback baseadas no tipo de erro
        const fallbackReplies = [
            'Ops, parece que meus circuitos deram uma pane! Pode tentar de novo?',
            'Hmm, algo estranho aconteceu aqui... Que tal tentar novamente?',
            'Encontrei um bug no meu código! Reformula a pergunta pra mim?',
            'Acho que preciso de um café... ☕ Tenta mais uma vez?',
            'Meus neurônios artificiais travaram! Pode repetir?'
        ];
        
        const randomReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        
        return {
            statusCode: 200, // Sempre retornar 200 para não quebrar o frontend
            headers,
            body: JSON.stringify({
                reply: randomReply,
                error: true,
                timestamp: Date.now()
            })
        };
    }
};

// Função para resposta mock em desenvolvimento
function getMockResponse(message, headers) {
    const mockReplies = [
        "Oi! Que bom que você veio visitar meu quartinho! Quer um biscoito? 🍪",
        "Haha, interessante! Mas que tal falarmos de outras coisas?",
        "Boa pergunta! O que mais você quer saber?",
        "Hmm, deixa eu pensar... Que tal você me contar algo sobre você?",
        "Adoro conversar! Qual é seu filme favorito?",
        "Que pergunta legal! Você tem algum hobby interessante?",
        "Hehe, você é engraçado! Conta mais...",
        "Interessante perspectiva! E você, o que acha?"
    ];
    
    // Selecionar resposta baseada no hash da mensagem para consistência
    const hash = message.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    
    const index = Math.abs(hash) % mockReplies.length;
    const reply = mockReplies[index];
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            reply: reply,
            mock: true,
            timestamp: Date.now()
        })
    };
}

// Função para sanitizar entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
        .replace(/\s+/g, ' ') // Normaliza espaços
        .substring(0, 2000); // Limita tamanho
}

// Função para sanitizar saída
function sanitizeOutput(output) {
    if (typeof output !== 'string') return '';
    
    return output
        .trim()
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle
        .replace(/\s+/g, ' ') // Normaliza espaços
        .substring(0, 1000); // Limita tamanho da resposta
}

// Função auxiliar para logging estruturado
function logRequest(event) {
    const timestamp = new Date().toISOString();
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const userAgent = event.headers['user-agent'] || 'unknown';
    
    console.log(`[${timestamp}] Request from ${ip} - ${userAgent}`);
}
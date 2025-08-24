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
- Respostas naturais e conversacionais
- Pode ser curta ou longa dependendo do contexto
- Linguagem natural e amigável
- Pode usar palavrões ocasionalmente, mas não exageradamente
- Trata o usuário como um amigo visitando seu quarto

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
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
        // Parsear o corpo da requisição
        const body = JSON.parse(event.body);
        const { message, history = [] } = body;

        // Validar entrada
        if (!message || typeof message !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Mensagem inválida' })
            };
        }

        // Verificar se a API key está configurada
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY não configurada');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Configuração da API não encontrada',
                    reply: 'Desculpe, estou enfrentando algumas dificuldades técnicas. Por favor, tente novamente mais tarde.'
                })
            };
        }

        // Preparar histórico da conversa
        const conversationHistory = [
            { role: 'system', content: MIMIR_SYSTEM_PROMPT },
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        // Preparar payload para a API Groq
        const payload = {
            model: GROQ_MODEL,
            messages: conversationHistory,
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
            stream: false
        };

        // Fazer requisição para a API Groq
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na API Groq:', response.status, errorText);
            
            // Retornar resposta de fallback
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    reply: 'Interessante pergunta! Estou processando algumas informações complexas no momento. Pode reformular sua pergunta ou tentar algo diferente?'
                })
            };
        }

        const data = await response.json();
        
        // Extrair resposta do MIMIR
        const mimirReply = data.choices?.[0]?.message?.content;
        
        if (!mimirReply) {
            throw new Error('Resposta inválida da API');
        }

        // Log para debugging (sem expor dados sensíveis)
        console.log('MIMIR respondeu com sucesso');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                reply: mimirReply.trim()
            })
        };

    } catch (error) {
        console.error('Erro no processamento:', error);
        
        return {
            statusCode: 200, // Retornar 200 mesmo com erro para não quebrar o frontend
            headers,
            body: JSON.stringify({
                reply: 'Hmm, parece que encontrei uma anomalia nos meus circuitos. Pode tentar novamente? Estou sempre aprendendo e melhorando.'
            })
        };
    }
};

// Função auxiliar para validar entrada
function validateInput(message) {
    if (!message || typeof message !== 'string') {
        return false;
    }
    
    // Verificar se a mensagem não está vazia após remover espaços
    if (message.trim().length === 0) {
        return false;
    }
    
    // Verificar se a mensagem não é muito longa
    if (message.length > 2000) {
        return false;
    }
    
    return true;
}

// Função auxiliar para sanitizar texto
function sanitizeText(text) {
    if (typeof text !== 'string') {
        return '';
    }
    
    // Remover caracteres potencialmente perigosos
    return text
        .replace(/[<>]/g, '') // Remover < e >
        .trim();
}

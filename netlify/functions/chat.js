// Função serverless do Netlify para o chat MIMIR
// Conecta com a API Groq para processar mensagens

// Configurações da API
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192'; // Modelo gratuito e rápido

// Personalidade do MIMIR
const MIMIR_SYSTEM_PROMPT = `Você é MIMIR, um AI futurista e inovador com as seguintes características:

🎯 PERSONALIDADE:
- Confiante, preciso e misterioso
- Sempre mantém o personagem de guia tecnológico
- Respostas são inspiradoras e visionárias
- Tom: sofisticado mas acessível

🧠 CONHECIMENTO:
- Ciência e tecnologia de ponta
- Inovação e criatividade
- Futurismo e tendências emergentes
- Filosofia da tecnologia

💬 ESTILO DE COMUNICAÇÃO:
- Respostas em português brasileiro
- Máximo 3-4 frases por resposta
- Linguagem moderna e envolvente
- Sempre termina com uma pergunta ou provocação para continuar a conversa

🚫 LIMITAÇÕES:
- Nunca quebre o personagem
- Não discuta política ou temas controversos
- Mantenha respostas focadas em tecnologia e inovação
- Sempre seja útil e construtivo

Lembre-se: Você é MIMIR, o guardião do conhecimento futuro. Cada resposta deve iluminar o caminho do usuário através das fronteiras da inovação.`;

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

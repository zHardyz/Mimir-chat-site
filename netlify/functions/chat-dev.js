// Versão de desenvolvimento da função chat
// Para testes locais sem API key real

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Mensagem inválida' })
            };
        }

        // Respostas simuladas para desenvolvimento
        const responses = [
            "Haha, boa pergunta! Mas não vou ficar falando muito sobre mim não, tá?",
            "Porra, que pergunta interessante! Mas eu sou mais de falar sobre outras coisas, sabe?",
            "Caralho, você é direto mesmo! Gosto disso. Mas vamos falar de outra coisa?",
            "Puta que pariu, que pergunta! Mas eu não sou muito de falar sobre mim não.",
            "Hmm, interessante... Mas eu prefiro falar sobre outras coisas, tá ligado?"
        ];

        // Selecionar resposta aleatória
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Simular delay de processamento
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                reply: randomResponse
            })
        };

    } catch (error) {
        console.error('Erro no modo desenvolvimento:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                reply: 'Porra, tô em modo desenvolvimento ainda! Configure a API key pra eu funcionar direito, caralho!'
            })
        };
    }
};

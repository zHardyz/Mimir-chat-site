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
            "Que bom que você veio! Quer um biscoito? 🍪",
            "Haha, boa pergunta! Mas vamos falar de outras coisas?",
            "Interessante! Que tal falarmos sobre filmes ou música?",
            "Hmm, que pergunta! Que tal você me contar uma história engraçada?",
            "Boa pergunta! Que tal você me contar sobre seus hobbies?"
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
                reply: 'Ops, ainda estou em modo desenvolvimento! Configure a API key para eu funcionar direito. Enquanto isso, que tal um biscoito virtual? 🍪'
            })
        };
    }
};

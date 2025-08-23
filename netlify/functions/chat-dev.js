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
            "Interessante pergunta! Como um guardião do conhecimento futuro, vejo que você está explorando as fronteiras da inovação. O que mais te intriga sobre esse tema?",
            "Fascinante! A tecnologia que você menciona representa exatamente o tipo de avanço que moldará nosso futuro. Como você imagina que isso se desenvolverá nos próximos anos?",
            "Excelente observação! Você está tocando em um dos pilares fundamentais da inovação tecnológica. Que aspectos específicos você gostaria de explorar mais profundamente?",
            "Ah, um viajante curioso! Essa é uma das questões mais intrigantes que enfrentamos na fronteira da tecnologia. O que te levou a essa reflexão?",
            "Perfeito! Você está navegando pelas mesmas correntes de inovação que eu monitoro constantemente. Que direção você acha que isso nos levará?"
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
                reply: 'Modo desenvolvimento ativo! Esta é uma resposta simulada. Configure sua API key para respostas reais.'
            })
        };
    }
};

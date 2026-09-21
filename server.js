const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/webhook', async (request, response) => {
  try {
    const queryResult = request.body.queryResult;
    const parameters = queryResult.parameters || {};

    const contexts = queryResult.outputContexts || [];
    const pedidoContext = contexts.find(context =>
      context.name.endsWith('/contexts/pedido-em-andamento')
    );

    const item = pedidoContext?.parameters?.['set-pronto'];
    
    let rawCep = parameters.cep;

    if (Array.isArray(rawCep)) {
      rawCep = rawCep[0];
    }

    let cep = String(rawCep).replace(/\D/g, '');

    if (cep.length !== 8) {
      return response.json({
        fulfillmentText: `o CEP recebido (${rawCep}) não parece válido. por favor, digite os 8 números novamente.`
      });
    }

    const url = `https://viacep.com.br/ws/${cep}/json/`;

    const viaCepResponse = await axios.get(url);
    const dados = viaCepResponse.data;

    if (dados.erro) {
      return response.json({
        fulfillmentText: `não encontrei nenhum endereço para o CEP ${cep}. Pode conferir os números?`
      });
    } else {
      const textoResposta =
          `confirma a compra de ${item} para ser enviado no endereço:\n\n` +
          `📍 ${dados.logradouro}\n` +
          `${dados.bairro}\n` +
          `${dados.localidade} - ${dados.uf}\n\n` +
          `sim ou não?`;

      return response.json({
        fulfillmentText: textoResposta
      });
    }

  } catch (error) {
    console.error('Erro interno no Webhook:', error.message);
    
    return response.json({
      fulfillmentText: 'tive um problema ao conectar com o serviço de CEP. pode tentar novamente em alguns segundos?'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`);
});

const express = require('express');
const axios = require('axios');
const { WebhookClient } = require('dialogflow-fulfillment');

const app = express();
app.use(express.json());

app.post('/webhook', (request, response) => {
  const agent = new WebhookClient({ request, response });

  function consultarViaCep(agent) {
    let rawCep = agent.parameters.cep;
    if (Array.isArray(rawCep)) {
      rawCep = rawCep[0];
    }

    let cep = String(rawCep).replace(/\D/g, '');

    if (cep.length !== 8) {
      agent.add(`o CEP recebido (${rawCep}) não parece válido. por favor, digite os 8 números novamente.`);
      return;
    }

    const url = `https://viacep.com.br{cep}/json/`;

    return axios.get(url)
      .then((res) => {
        const dados = res.data;

        if (dados.erro) {
          agent.add(`não encontrei o endereço para o CEP ${cep}. Pode conferir os números?`);
        } else {
          const resposta = `localizei o endereço!\n` +
                           `rua: ${dados.logradouro}\n` +
                           `bairro: ${dados.bairro}\n` +
                           `cidade: ${dados.localidade} - ${dados.uf}\n\n`;
          agent.add(resposta);
        }
      })
      .catch((error) => {
        console.error('erro no ViaCEP:', error);
        agent.add('tive um problema ao consultar seu CEP. pode tentar novamente?');
      });
  }

  let intentMap = new Map();
  intentMap.set('informou_cep', consultarViaCep);
  agent.handleRequest(intentMap);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`servidor rodando na porta ${PORT}`);
});
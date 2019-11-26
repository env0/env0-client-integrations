const axios = require('axios');

const apiBaseUrl = 'https://api.env0.com';

class Env0ApiClient {
  async init(apiKey, apiSecret) {
    const auth = `${apiKey}:${apiSecret}`;
    const buff = Buffer.from(auth).toString('base64');
    this.authHeader = { Authorization: `Basic ${buff}` };
  }

  async callApi(method, route, config) {
    const response = await axios({
      method,      
      url: `${apiBaseUrl}/${route}`,
      headers: {
        ...this.authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      ...config
    });

    return response.data;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Env0ApiClient;

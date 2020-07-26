const axios = require('axios');
const { version } = require('../package.json');

class Env0ApiClient {
  async init(apiKey, apiSecret) {
    const auth = `${apiKey}:${apiSecret}`;
    const buff = Buffer.from(auth).toString('base64');

    this.apliClient = axios.create({
      baseURL: process.env.ENV0_API_URL || 'https://api.env0.com',
      headers: {
        Authorization: `Basic ${buff}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `env0 ${version}`
      }
    })
  }

  async callApi(method, route, config) {
    const response = await this.apliClient({
      method,      
      url: route,
      ...config
    });

    return response.data;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = Env0ApiClient;

const axios = require('axios');
const { version } = require('../../package.json');

class Env0ApiClient {
  async init(apiKey, apiSecret) {
    const baseURL = process.env.ENV0_API_URL || 'https://api.env0.com';

    const { data: jwt } = await axios.get('auth/token?encoded=true', {
      baseURL,
      method: 'GET',
      auth: {
        username: apiKey,
        password: apiSecret
      }
    });

    this.apiClient = axios.create({
      baseURL: process.env.ENV0_API_URL || 'https://api.env0.com',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': `env0-node-cli-${version}`
      }
    });
  }

  async callApi(method, route, config) {
    const response = await this.apiClient({
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

const ApiClient = require('../src/api-client');
const axios = require('axios');

jest.mock('axios');

const mockKey = 'key0';
const mockSecret = 'secret0';

describe('api-client', () => {
    beforeEach(() => {
        new ApiClient().init(mockKey, mockSecret)
    })

    it('should set authorization header', () => {
        const expected = Buffer.from(`${mockKey}:${mockSecret}`).toString('base64');

        expect(axios.create).toBeCalledWith(expect.objectContaining({
            headers: expect.objectContaining({ Authorization: `Basic ${expected}` })
        }))
    })
    it('should set user agent header', () => {
        expect(axios.create).toBeCalledWith(expect.objectContaining({
            headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('env0-node-cli-') })
        }))
    })
})
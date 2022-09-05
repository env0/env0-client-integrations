const ApiClient = require('../../src/lib/api-client');
const axios = require('axios');

jest.mock('axios');

const mockKey = 'key0';
const mockSecret = 'secret0';

describe('api-client', () => {
  const jwt = 'iamjwt';

  beforeEach(() => {
    (axios.get).mockResolvedValue({ data: jwt });
    new ApiClient().init(mockKey, mockSecret);
  });

  it('should obtain a jwt', () => {
    expect(axios.get).toBeCalledWith('auth/token?encoded=true', expect.objectContaining({ auth: { username: mockKey, password: mockSecret } }));
  });

  it('should set authorization to jwt', () => {
    expect(axios.create).toBeCalledWith(expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${jwt}` }) }));
  });

  it('should set user agent header', () => {
    expect(axios.create).toBeCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('env0-node-cli-') })
      })
    );
  });
});

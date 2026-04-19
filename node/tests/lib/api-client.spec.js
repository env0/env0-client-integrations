import ApiClient from '../../src/lib/api-client.js';
import axios from 'axios';

vi.mock('axios');

const mockKey = 'key0';
const mockSecret = 'secret0';

describe('api-client', () => {
  beforeEach(() => {
    new ApiClient().init(mockKey, mockSecret);
  });

  it('should set authorization header', () => {
    expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({ auth: { username: mockKey, password: mockSecret } }));
  });

  it('should set user agent header', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('env0-node-cli-') })
      })
    );
  });
});

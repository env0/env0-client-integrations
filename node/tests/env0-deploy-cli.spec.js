const mockOptions = {
    help: false,
    blue: 'pill',
    red: 'pill',
    environmentVariables: [ "key1=value1", "key2=value2" ],
    sensitiveEnvironmentVariables: [ "sensitiveKey1=sensitiveValue1", "sensitiveKey2=sensitiveValue2" ]
}

jest.mock('../env0-deploy-flow');
jest.mock('command-line-usage');
jest.doMock('command-line-args', () => () => mockOptions);

const runDeployment = require('../env0-deploy-flow');
const run = require('../env0-deploy-cli');

describe("env0-deploy-cli", () => {
    beforeEach(() => {

    })
    it('should call run deployment with proper environment variables', async () => {
        await run();

        const expected = [
            { name: 'key1', value: 'value1', sensitive: false},
            { name: 'key2', value: 'value2', sensitive: false},
            { name: 'sensitiveKey1', value: 'sensitiveValue1', sensitive: true},
            { name: 'sensitiveKey2', value: 'sensitiveValue2', sensitive: true},

        ]

        expect(runDeployment).toBeCalledWith(mockOptions, expect.arrayContaining(expected));
    })
});
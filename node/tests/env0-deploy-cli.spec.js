const runDeployment = require('../src/env0-deploy-flow');
const run = require('../src/env0-deploy-cli');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

jest.mock('../src/env0-deploy-flow');
jest.mock('command-line-usage');
jest.mock('command-line-args');

jest.spyOn(process, 'exit').mockReturnValue({});

const mockOptions = {
    help: false,
    blue: 'pill',
    red: 'pill',
    environmentVariables: [ "key1=value1", "key2=value2" ],
    sensitiveEnvironmentVariables: [ "sensitiveKey1=sensitiveValue1", "sensitiveKey2=sensitiveValue2" ],
    _unknown: ['test']
}

const mockOptionsAndRun = async ({ command, rawArgs, args }) => {
    commandLineArgs.mockReturnValueOnce({ command, _unknown: rawArgs });
    commandLineArgs.mockReturnValueOnce(args)
    await run();
};

describe("env0-deploy-cli", () => {
    beforeEach(() => jest.resetAllMocks());

    describe("when command doesn't exist", () => {
        beforeEach(async () => {
            await mockOptionsAndRun({ command: 'invalid' })
        });

        it('should not call run deployment', () => {
            expect(runDeployment).not.toBeCalled();
        })

        it('should exit with 1', () => {
            expect(process.exit).toBeCalledWith(1);
        })
    })

    describe('when command exists', () => {
        describe.each`
        command
        ${'-h'}
        ${'--help'}
        ${'help'}
        `('when user asks for help with $command', ({ command }) => {
            beforeEach(async () => {
                await mockOptionsAndRun({ command, rawArgs: [ command ]});
            })

            it('should present the help message', () => {
                expect(commandLineUsage).toBeCalled();
            })

            it('should not call run deployment', () => {
                expect(runDeployment).not.toBeCalled();
            })
        })

        describe.each`
        command | args
        ${'deploy'} | ${mockOptions}
        ${'destroy'} | ${mockOptions}
        `('on $command', ({ command, args }) => {
            beforeEach(async () => {
                await mockOptionsAndRun({ command, args })
            })

            const expectedEnvVars = [
                { name: 'key1', value: 'value1', sensitive: false},
                { name: 'key2', value: 'value2', sensitive: false},
                { name: 'sensitiveKey1', value: 'sensitiveValue1', sensitive: true},
                { name: 'sensitiveKey2', value: 'sensitiveValue2', sensitive: true}
            ];

            it('should run deployment with proper params', () => {
                expect(runDeployment).toBeCalledWith(command, expect.objectContaining(args), expectedEnvVars);
            })
        })
    })
});
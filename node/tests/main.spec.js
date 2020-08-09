const runCommand = require('../src/commands/run-command');
const run = require('../src/main');
const commandLineArgs = require('command-line-args');
const { version } = require('../package.json');
const help = require('../src/commands/help');
const configure = require('../src/commands/configure');
const logger = require('../src/lib/logger');

jest.mock('../src/lib/logger');
jest.mock('../src/commands/run-command');
jest.mock('../src/commands/help');
jest.mock('../src/commands/configure');
jest.mock('command-line-args');

const getMockOptions = command => ({
  [command]: {
    help: false,
    blue: 'pill',
    red: 'pill',
    environmentVariables: ['key1=value1', 'key2=value2'],
    sensitiveEnvironmentVariables: ['sensitiveKey1=sensitiveValue1', 'sensitiveKey2=sensitiveValue2']
  },
  _unknown: ['test']
});

const mockOptionsAndRun = async ({ command, rawArgs, args }) => {
  commandLineArgs.mockReturnValueOnce({ command, _unknown: rawArgs });
  commandLineArgs.mockReturnValueOnce(args);
  await run();
};

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockReturnValue({});
  });

  describe("when command doesn't exist", () => {
    beforeEach(async () => {
      await mockOptionsAndRun({ command: 'invalid' });
    });

    it('should not call run deployment', () => {
      expect(runCommand).not.toBeCalled();
    });

    it('should print to stderr', () => {
      expect(logger.error).toBeCalled();
    });
    it('should exit with 1', () => {
      expect(process.exit).toBeCalledWith(1);
    });
  });

  describe('when command exists', () => {
    describe('help', () => {
      describe.each`
        command
        ${'-h'}
        ${'--help'}
        ${'help'}
      `('when user asks for help with $command', ({ command }) => {
        beforeEach(async () => {
          await mockOptionsAndRun({ command, rawArgs: [command] });
        });

        it('should present the help message', () => {
          expect(help).toBeCalled();
        });

        it('should not call run deployment', () => {
          expect(runCommand).not.toBeCalled();
        });
      });
    });

    describe('version', () => {
      describe.each`
        command
        ${'--version'}
        ${'version'}
      `('when user asks to see the version with $command', ({ command }) => {
        beforeEach(async () => {
          await mockOptionsAndRun({ command, rawArgs: [command] });
        });

        it('should show the proper version', () => {
          expect(logger.info).toBeCalledWith(version);
        });
      });
    });

    describe('configure', () => {
      beforeEach(async () => {
        await mockOptionsAndRun({ command: 'configure' });
      });

      it('should present the help message', () => {
        expect(configure).toBeCalled();
      });

      it('should not call run deployment', () => {
        expect(runCommand).not.toBeCalled();
      });
    });

    describe('environment variables parsing', () => {
      describe.each`
        command
        ${'deploy'}
        ${'destroy'}
      `('on $command', ({ command }) => {
        const args = getMockOptions(command);

        beforeEach(async () => {
          await mockOptionsAndRun({ command, args });
        });

        const expectedEnvVars = [
          { name: 'key1', value: 'value1', sensitive: false },
          { name: 'key2', value: 'value2', sensitive: false },
          { name: 'sensitiveKey1', value: 'sensitiveValue1', sensitive: true },
          { name: 'sensitiveKey2', value: 'sensitiveValue2', sensitive: true }
        ];

        it('should run deployment with proper params', () => {
          expect(runCommand).toBeCalledWith(command, expect.objectContaining(args[command]), expectedEnvVars);
        });
      });
    });
  });
});

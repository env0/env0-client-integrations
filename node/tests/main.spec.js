const runCommand = require('../src/commands/run-command');
const run = require('../src/main');
const commandLineArgs = require('command-line-args');
const { commands } = require('../src/config/commands');
const { version } = require('../package.json');
const help = require('../src/commands/help');
const configure = require('../src/commands/configure');
const logger = require('../src/lib/logger');
const updateNotifier = require('update-notifier');

jest.mock('../src/lib/logger');
jest.mock('../src/commands/run-command');
jest.mock('../src/commands/help');
jest.mock('../src/commands/configure');
jest.mock('command-line-args');
jest.mock('update-notifier', () => jest.fn().mockReturnValue({ notify: jest.fn() }));

const getMockOptions = command => ({
  [command]: {
    help: false,
    blue: 'pill',
    red: 'pill',
    environmentVariables: ['key1=value1', 'key2=value2'],
    sensitiveEnvironmentVariables: ['sensitiveKey1=sensitiveValue1', 'sensitiveKey2=sensitiveValue2'],
    terraformVariables: ['tfkey1=tfvalue1', 'tfkey2=tfvalue2']
  },
  _unknown: ['test']
});

const mockOptionsAndRun = async ({ command, rawArgs, args = {} }) => {
  commandLineArgs.mockRestore();
  commandLineArgs.mockReturnValueOnce({ command, _unknown: rawArgs });
  commandLineArgs.mockReturnValueOnce(args);

  await run();
};

describe('main', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockReturnValue({});
  });

  it('should run update notifier', async () => {
    await mockOptionsAndRun({});

    expect(updateNotifier).toBeCalled();
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
    describe.each`
      responseData               | expected
      ${{ message: 'test' }}     | ${'test\n'}
      ${['one', 'two', 'three']} | ${'one\ntwo\nthree'}
      ${'one'}                   | ${'one\n'}
    `('when command fails with $responseData', ({ responseData, expected }) => {
      beforeEach(async () => {
        runCommand.mockRejectedValue({ response: { data: responseData }, message: 'testing errors' });

        const command = 'deploy';
        await mockOptionsAndRun({ command, rawArgs: [], args: getMockOptions(command) });
      });

      it('should log errors', () => {
        expect(logger.error).toBeCalledWith(expect.stringContaining(expected));
      });
    });

    describe('help', () => {
      describe.each`
        command   | rawArgs
        ${''}     | ${['-h']}
        ${''}     | ${['--help']}
        ${'help'} | ${[]}
      `('when user asks for help with command=$command, rawArgs=$rawArgs', ({ command, rawArgs }) => {
        beforeEach(async () => {
          await mockOptionsAndRun({ command, rawArgs });
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
        command      | rawArgs
        ${''}        | ${['--version']}
        ${'version'} | ${[]}
      `('when user asks to see the version with command=$command, rawArgs=$rawArgs', ({ command, rawArgs }) => {
        beforeEach(async () => {
          await mockOptionsAndRun({ command, rawArgs });
        });

        it('should show the proper version', () => {
          expect(logger.info).toBeCalledWith(version);
        });
      });
    });

    describe('configure', () => {
      const command = 'configure';
      const args = getMockOptions(command);
      beforeEach(async () => {
        await mockOptionsAndRun({ command, args });
      });

      it('should call configure with arguments', () => {
        expect(configure).toHaveBeenCalledWith(args[command]);
      });

      it('should not call run deployment', () => {
        expect(runCommand).not.toBeCalled();
      });
    });

    describe('commands with flags', () => {
      describe.each`
        command
        ${'deploy'}
        ${'destroy'}
        ${'cancel'}
        ${'approve'}
        ${'configure'}
      `('on $command', ({ command }) => {
        const args = getMockOptions(command);
        const rawArgs = ['raw', 'args'];

        beforeEach(async () => {
          await mockOptionsAndRun({ command, rawArgs, args });
        });

        const expectedCommandOptions = commands[command].options;

        it('should call commandLineArgs to get arguments from the command options, using the rawArgs', () => {
          expect(commandLineArgs).toHaveBeenCalledWith(expectedCommandOptions, { argv: rawArgs });
        });
      });
    });

    describe('variables parsing', () => {
      describe.each`
        command
        ${'deploy'}
        ${'destroy'}
      `('on $command', ({ command }) => {
        const args = getMockOptions(command);

        beforeEach(async () => {
          await mockOptionsAndRun({ command, args });
        });

        const expectedVars = [
          { name: 'key1', value: 'value1', sensitive: false, type: 0 },
          { name: 'key2', value: 'value2', sensitive: false, type: 0 },
          { name: 'sensitiveKey1', value: 'sensitiveValue1', sensitive: true, type: 0 },
          { name: 'sensitiveKey2', value: 'sensitiveValue2', sensitive: true, type: 0 },
          { name: 'tfkey1', value: 'tfvalue1', sensitive: false, type: 1 },
          { name: 'tfkey2', value: 'tfvalue2', sensitive: false, type: 1 }
        ];

        it('should run deployment with proper params', () => {
          expect(runCommand).toBeCalledWith(command, expect.objectContaining(args[command]), expectedVars);
        });
      });
    });
  });
});

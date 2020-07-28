const DeployUtils = require("../src/env0-deploy-utils");
const runCommand = require("../src/env0-deploy-flow");
const configManager = require('../src/commons/config-manager');
const { OPTIONS } = require('../src/commons/constants');

jest.mock("../src/env0-deploy-utils");
jest.mock('../src/commons/config-manager');

const { API_KEY, API_SECRET, ORGANIZATION_ID, PROJECT_ID } = OPTIONS;

const mockRequiredOptions = {
  [PROJECT_ID]: 'proj0',
  [ORGANIZATION_ID]: 'org0',
  [API_KEY]: 'key0',
  [API_SECRET]: 'secret0'
};

describe("env0-deploy-flow", () => {
  const deployUtilsMock = DeployUtils.mock.instances[0];
  const environmentId = 12345;
  const deploymentLogId = 67890;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(configManager, 'read').mockReturnValue(mockRequiredOptions);
  });

  beforeEach(() => {
    deployUtilsMock.getEnvironment.mockResolvedValue({ id: environmentId });
    deployUtilsMock.waitForEnvironment.mockResolvedValue({});
    deployUtilsMock.deployEnvironment.mockResolvedValue({ id: deploymentLogId });
    deployUtilsMock.destroyEnvironment.mockResolvedValue({ id: deploymentLogId });
  })

  it('should read and write persistent options', async () => {
    await runCommand('deploy', mockRequiredOptions);

    expect(configManager.read).toBeCalled();
    expect(configManager.write).toBeCalled();
  })

  describe('when there are missing required options', () => {
    it('should fail with proper error message', () => {
      expect(runCommand('deploy', {})).rejects.toThrow(expect.stringContaining('Missing required options'));
    })
  });

  describe("when all required options exist", () => {
    describe.each`
    command | mock
    ${'deploy'} | ${deployUtilsMock.deployEnvironment}
    ${'destroy'} | ${deployUtilsMock.destroyEnvironment}
    `('$command', ({ command, mock }) => {

      it("should fail when it fails to set configuration", async () => {
        const configError = "Configuration error";
        deployUtilsMock.setConfiguration.mockRejectedValue(new Error(configError));

        expect(runCommand(command, mockRequiredOptions, { name: "shoes", value: "socks " })).rejects.toThrow(configError);
      });

      it("should throw exception when deployment fails", async () => {
        const errorMessage = 'Some Error Occured';
        mock.mockRejectedValue(new Error(errorMessage));

        expect(runCommand(command)).rejects.toThrow(errorMessage);
      });
    })
  });
});

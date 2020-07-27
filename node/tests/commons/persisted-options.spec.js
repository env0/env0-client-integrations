const fs = require('fs-extra');
const persistentOptions = require('../../src/commons/persistent-options');
const { OPTIONS } = require('../../src/commons/constants');

jest.mock('fs-extra');


describe('persisted options', () => {
    const mockOptions = {
        [OPTIONS.API_KEY]: 'key0',
        [OPTIONS.API_SECRET]: 'secret0'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('read', () => {
        describe('when config file exists', () => {
            beforeEach(() => {
                jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockOptions));
                jest.spyOn(fs, 'existsSync').mockReturnValue(true);
            })

            it('should try to read from disk', () => {
                const options = persistentOptions.read();

                expect(fs.readFileSync).toBeCalled();
                expect(options).toEqual(mockOptions);
            })

            it('should throw when json is malformed', () => {
                jest.spyOn(fs, 'readFileSync').mockReturnValue('not-a-json');
                expect(() => persistentOptions.read()).toThrow();
            })

            it('env vars should take precedence over config file', () => {
                const anotherApiKey = 'key1';
                process.env.ENV0_API_KEY = anotherApiKey;

                const options = persistentOptions.read();

                expect(options).toEqual({ ...mockOptions, [OPTIONS.API_KEY]: anotherApiKey })
            })
        })

        describe('when config file does not exist', () => {
            beforeEach(() => {
                jest.spyOn(fs, 'existsSync').mockReturnValue(false);
            })

            it('should not try to read from disk', () => {
                expect(fs.readFileSync).not.toBeCalled();
            })
        })
    })

    describe('write', () => {
        it('should write ONLY required options to disk', () => {
            persistentOptions.write({ ...mockOptions, another: 'option', 'and-another': 'option' })

            expect(fs.writeJsonSync).toBeCalledWith(expect.any(String), mockOptions, { spaces: 2 });
        })

    })
});
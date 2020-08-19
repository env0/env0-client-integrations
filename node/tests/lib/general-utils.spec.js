const { convertStringToBoolean, removeEmptyValuesFromObj } = require('../../src/lib/genetal-utils');

describe('general utils', () => {
  describe('convert str to bool', () => {
    it.each`
      input          | output
      ${'true'}      | ${true}
      ${'false'}     | ${false}
      ${'something'} | ${undefined}
    `('should convert $input to $output', ({ input, output }) => {
      expect(convertStringToBoolean(input)).toEqual(output);
    });
  });

  describe('remove empty values from obj', () => {
    it.each`
      input                                                  | output
      ${{}}                                                  | ${{}}
      ${{ foo: 'bar', baz: undefined }}                      | ${{ foo: 'bar' }}
      ${{ foo: 'bar', baz: { foo: 'bar', baz: undefined } }} | ${{ foo: 'bar', baz: { foo: 'bar' } }}
    `('should remove values', ({ input, output }) => {
      expect(removeEmptyValuesFromObj(input)).toEqual(output);
    });
  });
});

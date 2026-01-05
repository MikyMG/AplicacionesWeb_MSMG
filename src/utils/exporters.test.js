import { toXML, downloadFile } from './exporters';

describe('exporters utils', () => {
  test('toXML produces expected output', () => {
    const obj = { a: '1', b: 'x & y', c: null };
    const xml = toXML(obj, 'item');
    expect(xml).toContain('<item>');
    expect(xml).toContain('<a>1</a>');
    expect(xml).toContain('<b>x &amp; y</b>');
    expect(xml).toContain('<c></c>');
    expect(xml).toContain('</item>');
  });

  test('downloadFile creates anchor and triggers download', () => {
    const clickMock = jest.fn();
    const originalCreate = document.createElement.bind(document);
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        // override click for assertion
        el.click = clickMock;
      }
      return el;
    });

    // ensure URL.createObjectURL exists in this environment
    if (!global.URL) global.URL = {};
    const origCreateObjectURL = global.URL.createObjectURL;
    const origRevoke = global.URL.revokeObjectURL;
    global.URL.createObjectURL = jest.fn(() => 'blob:url');
    global.URL.revokeObjectURL = jest.fn();

    const appendSpy = jest.spyOn(document.body, 'appendChild');

    downloadFile('hello', 'test.json', 'application/json');

    expect(createSpy).toHaveBeenCalledWith('a');
    expect(appendSpy).toHaveBeenCalled();
    const appended = appendSpy.mock.calls[0][0];
    expect(appended.download).toBe('test.json');
    expect(clickMock).toHaveBeenCalled();
    appendSpy.mockRestore();

    // restore mocks
    createSpy.mockRestore();
    if (origCreateObjectURL === undefined) delete global.URL.createObjectURL; else global.URL.createObjectURL = origCreateObjectURL;
    if (origRevoke === undefined) delete global.URL.revokeObjectURL; else global.URL.revokeObjectURL = origRevoke;
  });
});
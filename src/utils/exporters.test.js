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
    const anchorMock = { href: '', download: '', click: clickMock, remove: jest.fn() };
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => tag === 'a' ? anchorMock : document.createElement(tag));
    const urlSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    downloadFile('hello', 'test.json', 'application/json');

    expect(createSpy).toHaveBeenCalledWith('a');
    expect(anchorMock.download).toBe('test.json');
    expect(clickMock).toHaveBeenCalled();

    createSpy.mockRestore();
    urlSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});
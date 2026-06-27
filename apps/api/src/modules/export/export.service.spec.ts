import { csvEscape } from './export.service';

describe('ExportService csvEscape', () => {
  it('普通文字原样输出', () => {
    expect(csvEscape('山田太郎')).toBe('山田太郎');
  });

  it('含逗号时加双引号', () => {
    expect(csvEscape('本社,DX')).toBe('"本社,DX"');
  });

  it('含双引号时转义', () => {
    expect(csvEscape('A"B')).toBe('"A""B"');
  });

  it('null/undefined 为空字符串', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

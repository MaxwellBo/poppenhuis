import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  DSStoreParser, 
  ParsingError,
  formatDSStoreValue, 
  getFieldName 
} from './dsstore-parser';

describe('DSStoreParser', () => {
  it('should parse a real .DS_Store file', () => {
    const filePath = join(process.cwd(), 'public/assets/goldens/.DS_Store');
    const buffer = readFileSync(filePath);
    
    const parser = new DSStoreParser(buffer, false);
    const records = parser.parse();
    const metadata = parser.getMetadata();

    // Check metadata
    expect(metadata.magic).toBe(0x42756431); // "Bud1"
    expect(metadata.alignmentInt).toBe(0x00000001);
    expect(metadata.rootId).toBeGreaterThan(0);
    expect(metadata.treeHeight).toBeGreaterThanOrEqual(0);
    expect(metadata.numRecords).toBeGreaterThan(0);
    expect(metadata.numNodes).toBeGreaterThan(0);

    // Check records
    expect(records).toBeInstanceOf(Array);
    expect(records.length).toBeGreaterThan(0);
    
    // Each record should have a name and fields
    records.forEach(record => {
      expect(record).toHaveProperty('name');
      expect(record).toHaveProperty('fields');
      expect(typeof record.name).toBe('string');
      expect(typeof record.fields).toBe('object');
    });
  });

  it('should parse metadata correctly', () => {
    const filePath = join(process.cwd(), 'public/assets/goldens/.DS_Store');
    const buffer = readFileSync(filePath);
    
    const parser = new DSStoreParser(buffer);
    parser.parse();
    const metadata = parser.getMetadata();

    expect(metadata).toHaveProperty('alignmentInt');
    expect(metadata).toHaveProperty('magic');
    expect(metadata).toHaveProperty('allocatorOffset');
    expect(metadata).toHaveProperty('allocatorLength');
    expect(metadata).toHaveProperty('rootId');
    expect(metadata).toHaveProperty('treeHeight');
    expect(metadata).toHaveProperty('numRecords');
    expect(metadata).toHaveProperty('numNodes');
  });

  it('should throw error for invalid magic bytes', () => {
    // Create a buffer with invalid magic bytes
    const buffer = new Uint8Array(36);
    const view = new DataView(buffer.buffer);
    
    view.setUint32(0, 0x00000001, false); // alignment
    view.setUint32(4, 0x12345678, false); // invalid magic (not "Bud1")
    
    const parser = new DSStoreParser(buffer);
    
    expect(() => parser.parse()).toThrow(ParsingError);
    expect(() => parser.parse()).toThrow(/Magic bytes/);
  });

  it('should handle different data types', () => {
    const filePath = join(process.cwd(), 'public/assets/goldens/.DS_Store');
    const buffer = readFileSync(filePath);
    
    const parser = new DSStoreParser(buffer);
    const records = parser.parse();
    
    // Check that we have various data types
    const allValues = records.flatMap(r => Object.values(r.fields));
    
    const hasBool = allValues.some(v => typeof v === 'boolean');
    const hasNumber = allValues.some(v => typeof v === 'number');
    const hasString = allValues.some(v => typeof v === 'string');
    const hasBlob = allValues.some(v => v instanceof Uint8Array);
    
    // At least some of these types should exist in a typical .DS_Store
    expect(hasBool || hasNumber || hasString || hasBlob).toBe(true);
  });
});

describe('formatDSStoreValue', () => {
  it('should format boolean values', () => {
    expect(formatDSStoreValue('test', true)).toBe('true');
    expect(formatDSStoreValue('test', false)).toBe('false');
  });

  it('should format number values', () => {
    expect(formatDSStoreValue('test', 123)).toBe('123');
  });

  it('should format size values with bytes suffix', () => {
    expect(formatDSStoreValue('logS', 1024)).toBe('1024 bytes');
    expect(formatDSStoreValue('phyS', 2048)).toBe('2048 bytes');
  });

  it('should format string values', () => {
    expect(formatDSStoreValue('test', 'hello')).toBe('hello');
  });

  it('should format small blobs as hex', () => {
    const blob = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    expect(formatDSStoreValue('test', blob)).toBe('0x01020304');
  });

  it('should format large blobs with size', () => {
    const blob = new Uint8Array(100);
    const result = formatDSStoreValue('test', blob);
    expect(result).toMatch(/<blob, \d+ bytes>/);
  });

  it('should detect binary plist', () => {
    const plist = new Uint8Array([0x62, 0x70, 0x6c, 0x69, 0x73, 0x74]); // "bplist"
    const result = formatDSStoreValue('test', plist);
    expect(result).toMatch(/<binary plist, \d+ bytes>/);
  });
});

describe('getFieldName', () => {
  it('should return human-readable names for known fields', () => {
    expect(getFieldName('Iloc')).toBe('Icon Location');
    expect(getFieldName('vstl')).toBe('View Style');
    expect(getFieldName('BKGD')).toBe('Background');
    expect(getFieldName('logS')).toBe('Logical Size');
  });

  it('should return the field code for unknown fields', () => {
    expect(getFieldName('UNKN')).toBe('UNKN');
    expect(getFieldName('XYZ1')).toBe('XYZ1');
  });
});

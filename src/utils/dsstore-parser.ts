/**
 * TypeScript parser for macOS .DS_Store files
 * Based on the .DS_Store format specification
 * 
 * Vibe coded using https://github.com/hanwenzhu/.DS_Store-parser 
 * and https://github.com/gehaxelt/Python-dsstore as a reference.
 */

export class ParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParsingError';
  }
}

export type DSStoreDataType = 
  | 'bool'
  | 'shor'
  | 'long'
  | 'comp'
  | 'dutc'
  | 'type'
  | 'blob'
  | 'ustr';

export type DSStoreValue = 
  | boolean
  | number
  | string
  | Uint8Array;

export interface DSStoreRecord {
  name: string;
  fields: Record<string, DSStoreValue>;
}

export interface DSStoreMetadata {
  alignmentInt: number;
  magic: number;
  allocatorOffset: number;
  allocatorLength: number;
  rootId: number;
  treeHeight: number;
  numRecords: number;
  numNodes: number;
}

export class DSStoreParser {
  private content: Uint8Array;
  private cursor: number;
  private debug: boolean;
  
  // Metadata
  private allocatorOffset: number = 0;
  private allocatorLength: number = 0;
  private offsets: number[] = [];
  private directory: Record<string, number> = {};
  private masterId: number = 0;
  private rootId: number = 0;
  private treeHeight: number = 0;
  private numRecords: number = 0;
  private numNodes: number = 0;
  private freelist: Record<number, number[]> = {};
  
  // Results
  private records: DSStoreRecord[] = [];

  constructor(content: ArrayBuffer | Uint8Array, debug: boolean = false) {
    this.content = content instanceof Uint8Array ? content : new Uint8Array(content);
    this.cursor = 0;
    this.debug = debug;
  }

  parse(): DSStoreRecord[] {
    this.parseHeader();
    this.parseAllocator();
    this.parseTree();
    return this.records;
  }

  getMetadata(): DSStoreMetadata {
    return {
      alignmentInt: 0x00000001,
      magic: 0x42756431,
      allocatorOffset: this.allocatorOffset,
      allocatorLength: this.allocatorLength,
      rootId: this.rootId,
      treeHeight: this.treeHeight,
      numRecords: this.numRecords,
      numNodes: this.numNodes,
    };
  }

  private nextByte(): number {
    return this.content[this.cursor++];
  }

  private nextBytes(n: number): Uint8Array {
    const data = this.content.slice(this.cursor, this.cursor + n);
    this.cursor += n;
    return data;
  }

  private nextUInt32(): number {
    const bytes = this.nextBytes(4);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, false);
  }

  private nextUInt64(): bigint {
    const bytes = this.nextBytes(8);
    return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getBigUint64(0, false);
  }

  private parseHeader(): void {
    // Alignment int
    const alignment = this.nextUInt32();
    if (alignment !== 0x00000001) {
      console.warn(`Alignment int ${alignment.toString(16)} not 0x00000001`);
    }

    // Magic bytes "Bud1"
    const magic = this.nextUInt32();
    if (magic !== 0x42756431) {
      throw new ParsingError(`Magic bytes ${magic.toString(16)} not 0x42756431 (Bud1)`);
    }

    // Buddy allocator position & length
    this.allocatorOffset = 0x4 + this.nextUInt32();
    this.allocatorLength = this.nextUInt32();
    const allocatorOffsetRepeat = 0x4 + this.nextUInt32();
    
    if (allocatorOffsetRepeat !== this.allocatorOffset) {
      console.warn(`Allocator offsets ${this.allocatorOffset.toString(16)} and ${allocatorOffsetRepeat.toString(16)} unequal`);
    }

    if (this.debug) {
      console.log(`Allocator offset: ${this.allocatorOffset.toString(16)}, length: ${this.allocatorLength.toString(16)}`);
    }
  }

  private parseAllocator(): void {
    this.cursor = this.allocatorOffset;

    // Offsets
    const numOffsets = this.nextUInt32();
    const second = this.nextUInt32();
    
    if (second !== 0) {
      console.warn(`Second int of allocator ${second.toString(16)} not 0x00000000`);
    }

    this.offsets = [];
    for (let i = 0; i < numOffsets; i++) {
      this.offsets.push(this.nextUInt32());
    }

    if (this.debug) {
      console.log(`Read ${numOffsets} offsets`);
    }

    this.cursor = this.allocatorOffset + 0x408;

    // Table of contents
    const numKeys = this.nextUInt32();
    this.directory = {};
    
    for (let i = 0; i < numKeys; i++) {
      const keyLength = this.nextByte();
      const keyBytes = this.nextBytes(keyLength);
      const key = new TextDecoder('ascii').decode(keyBytes);
      const value = this.nextUInt32();
      this.directory[key] = value;
      
      if (key !== 'DSDB') {
        console.warn(`Directory contains non-'DSDB' key '${key}' with value ${value.toString(16)}`);
      }
    }

    if (!('DSDB' in this.directory)) {
      throw new ParsingError("Key 'DSDB' not found in table of contents");
    }

    this.masterId = this.directory['DSDB'];

    // Free list
    this.freelist = {};
    for (let i = 0; i < 32; i++) {
      const valuesLength = this.nextUInt32();
      const values: number[] = [];
      for (let j = 0; j < valuesLength; j++) {
        values.push(this.nextUInt32());
      }
      this.freelist[1 << i] = values;
    }

    if (this.debug) {
      console.log(`Directory:`, this.directory);
      console.log(`Master ID: ${this.masterId}`);
    }
  }

  private parseTree(nodeId?: number): void {
    const isMaster = nodeId === undefined;
    const currentNodeId = nodeId !== undefined ? nodeId : this.masterId;

    const offsetAndSize = this.offsets[currentNodeId];
    this.cursor = 0x4 + ((offsetAndSize >> 0x5) << 0x5);

    if (isMaster) {
      // Master node
      this.rootId = this.nextUInt32();
      this.treeHeight = this.nextUInt32();
      this.numRecords = this.nextUInt32();
      this.numNodes = this.nextUInt32();
      const fifth = this.nextUInt32();
      
      if (fifth !== 0x00001000) {
        console.warn(`Fifth int of master ${fifth.toString(16)} not 0x00001000`);
      }

      if (this.debug) {
        console.log(`Root ID: ${this.rootId}, Tree height: ${this.treeHeight}, Records: ${this.numRecords}, Nodes: ${this.numNodes}`);
      }

      this.parseTree(this.rootId);
    } else {
      // Regular node
      const nextId = this.nextUInt32();
      const numRecords = this.nextUInt32();

      for (let i = 0; i < numRecords; i++) {
        if (nextId) {
          // Has children
          const childId = this.nextUInt32();
          const currentCursor = this.cursor;
          this.parseTree(childId);
          this.cursor = currentCursor;
        }

        const nameLength = this.nextUInt32();
        const nameBytes = this.nextBytes(nameLength * 2);
        const name = new TextDecoder('utf-16be').decode(nameBytes);
        
        const fieldBytes = this.nextBytes(4);
        const field = new TextDecoder('ascii').decode(fieldBytes);
        
        const data = this.parseData();

        // Find or create record
        let record = this.records.find(r => r.name === name);
        if (record) {
          record.fields[field] = data;
        } else {
          this.records.push({
            name,
            fields: { [field]: data }
          });
        }
      }

      if (nextId) {
        this.parseTree(nextId);
      }
    }
  }

  private parseData(): DSStoreValue {
    const dataTypeBytes = this.nextBytes(4);
    const dataType = new TextDecoder('ascii').decode(dataTypeBytes) as DSStoreDataType;

    switch (dataType) {
      case 'bool':
        return Boolean(this.nextByte() & 0x01);
      
      case 'shor':
      case 'long':
        // short is also 4 bytes, with 2 0x00 bytes padding
        return this.nextUInt32();
      
      case 'comp':
      case 'dutc':
        return Number(this.nextUInt64());
      
      case 'type': {
        const typeBytes = this.nextBytes(4);
        return new TextDecoder('ascii').decode(typeBytes);
      }
      
      case 'blob': {
        const dataLength = this.nextUInt32();
        return this.nextBytes(dataLength);
      }
      
      case 'ustr': {
        const dataLength = this.nextUInt32();
        const strBytes = this.nextBytes(2 * dataLength);
        return new TextDecoder('utf-16be').decode(strBytes);
      }
      
      default:
        throw new ParsingError(`Unrecognized data type: ${dataType}`);
    }
  }
}

/**
 * Helper function to format .DS_Store data for human-readable display
 */
export function formatDSStoreValue(field: string, value: DSStoreValue): string {
  if (typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'number') {
    // Check for specific fields that represent sizes or timestamps
    if (field.includes('Size') || field.match(/log[S1]|phy[S1]|ph1S/)) {
      return `${value} bytes`;
    }
    return String(value);
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value instanceof Uint8Array) {
    // Try to detect if it's a plist
    const text = new TextDecoder('ascii', { fatal: false }).decode(value.slice(0, 6));
    if (text.startsWith('bplist')) {
      return `<binary plist, ${value.length} bytes>`;
    }
    
    // Format as hex for small blobs, indicate size for large ones
    if (value.length <= 32) {
      return '0x' + Array.from(value).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return `<blob, ${value.length} bytes>`;
  }
  
  return String(value);
}

/**
 * Get human-readable field name
 */
export function getFieldName(field: string): string {
  const fieldNames: Record<string, string> = {
    'BKGD': 'Background',
    'Iloc': 'Icon Location',
    'bwsp': 'Browser Window Settings (plist)',
    'cmmt': 'Comments',
    'dilc': 'Desktop Icon Location',
    'dscl': 'Disclosure Column',
    'extn': 'Extension',
    'fwi0': 'Finder Window Info',
    'fwsw': 'Finder Window Sidebar Width',
    'fwvh': 'Finder Window Vertical Height',
    'icgo': 'Icon Grid Offset',
    'icsp': 'Icon Spacing',
    'icvo': 'Icon View Options',
    'icvp': 'Icon View Properties (plist)',
    'logS': 'Logical Size',
    'lg1S': 'Logical Size (alt)',
    'lssp': 'List View Scroll Position',
    'lsvC': 'List View Config (plist)',
    'lsvP': 'List View Properties (alt plist)',
    'lsvo': 'List View Options',
    'lsvp': 'List View Properties (plist)',
    'lsvt': 'List View Text Size',
    'moDD': 'Modification Date',
    'modD': 'Modification Date (alt)',
    'phyS': 'Physical Size',
    'ph1S': 'Physical Size (alt)',
    'pict': 'Picture',
    'vstl': 'View Style',
    'vSrn': 'Version',
  };
  
  return fieldNames[field] || field;
}

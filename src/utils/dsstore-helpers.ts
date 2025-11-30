import { DSStoreRecord } from './dsstore-parser';

export interface FilePosition {
  filename: string;
  x: number;
  y: number;
}

/**
 * Extract icon location (Iloc field) from .DS_Store blob data
 * Format: 16 bytes - [x: 4 bytes][y: 4 bytes][rest: 8 bytes]
 */
function parseIconLocation(blob: Uint8Array): { x: number; y: number } | null {
  if (blob.length !== 16) {
    return null;
  }
  
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const x = view.getUint32(0, false); // big-endian
  const y = view.getUint32(4, false); // big-endian
  
  return { x, y };
}

/**
 * Extract file positions from .DS_Store records
 */
export function extractFilePositions(records: DSStoreRecord[]): FilePosition[] {
  const positions: FilePosition[] = [];
  
  for (const record of records) {
    const ilocField = record.fields['Iloc'];
    
    if (ilocField && ilocField instanceof Uint8Array) {
      const location = parseIconLocation(ilocField);
      
      if (location && record.name) {
        positions.push({
          filename: record.name,
          x: location.x,
          y: location.y,
        });
      }
    }
  }
  
  return positions;
}

/**
 * Filter positions to only include .glb files
 */
export function filterGlbPositions(positions: FilePosition[]): FilePosition[] {
  return positions.filter(pos => pos.filename.toLowerCase().endsWith('.glb'));
}

/**
 * Calculate bounding box for positions
 */
export function calculateBounds(positions: FilePosition[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (positions.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
  }
  
  const xs = positions.map(p => p.x);
  const ys = positions.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

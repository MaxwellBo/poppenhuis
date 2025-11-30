import { DSStoreParser } from './dsstore-parser';
import { extractFilePositions, filterGlbPositions } from './dsstore-helpers';

export interface DSStorePositionMap {
  [filename: string]: { x: number; y: number };
}

/**
 * Load and parse the .DS_Store file and build a filename->position lookup map
 */
export async function loadDSStorePositionMap(): Promise<DSStorePositionMap> {
  try {
    const response = await fetch('/assets/goldens/DS_Store');
    if (!response.ok) {
      throw new Error(`Failed to load .DS_Store: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const parser = new DSStoreParser(buffer, false);
    const records = parser.parse();
    
    const allPositions = extractFilePositions(records);
    const glbPositions = filterGlbPositions(allPositions);
    
    // Build lookup map
    const map: DSStorePositionMap = {};
    for (const pos of glbPositions) {
      map[pos.filename] = { x: pos.x, y: pos.y };
    }
    
    return map;
  } catch (error) {
    console.error('Error loading .DS_Store position map:', error);
    return {};
  }
}

/**
 * Extract just the filename from a full model path
 * e.g., "/assets/goldens/mymodel.glb" -> "mymodel.glb"
 */
export function extractFilename(modelPath: string): string {
  return modelPath.split('/').pop() || modelPath;
}

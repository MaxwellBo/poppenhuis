// render.ts
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIRST_PARTY_MANIFEST, User, Collection, Item } from './src/manifest.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RenderTask {
  items: Item[];
  outputPath: string;
}

interface ModelRenderTask {
  modelPaths: string[];
  outputPath: string;
  isSingle: boolean;
}

// Convert web path to filesystem path for output
function webPathToFsOutput(webPath: string): string {
  const cleanPath = webPath.startsWith('/') ? webPath.slice(1) : webPath;
  return path.join(__dirname, 'public', cleanPath);
}

function getItemOGPath(modelPath: string): string {
  const filename = path.basename(modelPath, '.glb');
  return `/assets/derived/${filename}.png`;
}

function getCollectionOGPath(userId: string, collectionId: string): string {
  return `/assets/derived/${userId}_${collectionId}_og.png`;
}

function getUserOGPath(userId: string): string {
  return `/assets/derived/${userId}_og.png`;
}

function getRootOGPath(): string {
  return `/og.png`;
}

function getAllUserItems(user: User): Item[] {
  const items: Item[] = [];
  for (const collection of user.collections) {
    items.push(...collection.items);
  }
  return items;
}


function modelPathToFsPath(modelPath: string): string {
  // Convert web path like /assets/goldens/model.glb to filesystem path
  const cleanPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  return path.join(__dirname, 'public', cleanPath);
}

function calculateOptimalGridCols(numModels: number, width: number, height: number): number {
  // For landscape images, prefer more columns to fill horizontal space
  const aspectRatio = width / height;
  
  // Calculate optimal grid dimensions that match the image aspect ratio
  // We want: cols/rows ≈ aspectRatio
  // And: cols * rows ≥ numModels
  // Solving: cols ≈ sqrt(numModels * aspectRatio)
  
  // Calculate ideal columns based on aspect ratio
  const idealCols = Math.sqrt(numModels * aspectRatio);
  
  // For landscape images, bias toward more columns to fill horizontal space
  // Round up more aggressively for landscape images
  let cols: number;
  if (aspectRatio > 1.3) {
    // Landscape: prefer more columns
    cols = Math.ceil(idealCols * 1.1); // Add 10% bias toward more columns
  } else {
    // Square or portrait: round normally
    cols = Math.round(idealCols);
  }
  
  // Ensure reasonable bounds
  const minCols = 2;
  const maxCols = numModels; // Can't have more columns than models
  
  // Verify the resulting grid makes sense
  const calculatedRows = Math.ceil(numModels / cols);
  
  // For landscape images, if we're getting too many rows relative to columns,
  // increase columns to better match the aspect ratio
  if (aspectRatio > 1.3 && calculatedRows > cols * 0.8) {
    // Recalculate to better match aspect ratio
    cols = Math.ceil(Math.sqrt(numModels * aspectRatio) * 1.2);
  }
  
  return Math.max(minCols, Math.min(cols, maxCols));
}

async function renderWithBlender(task: ModelRenderTask): Promise<void> {
  const { modelPaths, outputPath, isSingle } = task;

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Convert model paths to absolute filesystem paths
  const fsModelPaths = modelPaths.map(modelPathToFsPath);

  // Verify all model files exist
  for (const fsPath of fsModelPaths) {
    if (!fs.existsSync(fsPath)) {
      throw new Error(`Model file not found: ${fsPath}`);
    }
  }

  console.log(`🎨 Rendering ${isSingle ? 'single' : 'multi'} model(s) with Blender...`);
  console.log(`   Models: ${modelPaths.join(', ')}`);
  console.log(`   Output: ${outputPath}`);

  // Find Blender executable
  // Try common locations
  const blenderPaths = [
    'blender', // In PATH
    '/Applications/Blender.app/Contents/MacOS/Blender', // macOS default
    '/usr/bin/blender', // Linux
    'C:\\Program Files\\Blender Foundation\\Blender\\blender.exe', // Windows
  ];

  let blenderPath: string | null = null;

  // First, try if 'blender' is in PATH
  try {
    await execFileAsync('which', ['blender']);
    blenderPath = 'blender';
  } catch {
    // Not in PATH, try direct paths
    for (const candidate of blenderPaths.slice(1)) {
      if (fs.existsSync(candidate)) {
        blenderPath = candidate;
        break;
      }
    }
  }

  if (!blenderPath) {
    throw new Error('Blender not found. Please install Blender and ensure it is in your PATH or at a standard location.');
  }

  // Get the Python script path
  const scriptPath = path.join(__dirname, 'render_blender.py');

  // Build Blender command
  const mode = isSingle ? 'single' : 'multi';
  const outputWidth = 1200;
  const outputHeight = 630;
  const gridCols = isSingle ? undefined : calculateOptimalGridCols(modelPaths.length, outputWidth, outputHeight);
  
  const args = [
    '--background', // Run in background (no UI)
    '--python', scriptPath,
    '--',
    '--mode', mode,
    '--output', outputPath,
    '--width', outputWidth.toString(),
    '--height', outputHeight.toString(),
    ...(isSingle ? [] : ['--grid-cols', gridCols!.toString()]),
    ...fsModelPaths,
  ];

  try {
    const { stdout, stderr } = await execFileAsync(blenderPath, args);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Warning')) console.error(stderr);
    console.log(`✅ Rendered: ${outputPath}`);
  } catch (error: any) {
    console.error(`❌ Blender error:`, error.message);
    if (error.stdout) console.error('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    throw error;
  }
}

export async function renderBatch(tasks: RenderTask[]): Promise<void> {
  if (tasks.length === 0) {
    console.error('Error: No render tasks provided');
    process.exit(1);
  }

  console.log(`📁 Processing ${tasks.length} render task(s)`);

  try {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const itemNames = task.items.map(item => item.name).join(', ');
      console.log(`\n[${i + 1}/${tasks.length}] Processing: ${itemNames}`);

      if (task.items.length === 0) {
        console.log(`   ⚠️  No items in task, skipping...`);
        continue;
      }

      // Get model paths
      const modelPaths = task.items.map(item => item.model);
      const isSingle = task.items.length === 1;

      // Render with Blender
      await renderWithBlender({
        modelPaths,
        outputPath: task.outputPath,
        isSingle,
      });
    }

  } catch (error) {
    console.error(`❌ Error during rendering:`, error);
    throw error;
  }

  console.log(`\n✅ All renders complete!`);
}


async function renderAll(): Promise<void> {
  console.log('🎨 Starting render-all process with Blender...\n');

  const allTasks: RenderTask[] = [];

  // Process each user
  for (const user of FIRST_PARTY_MANIFEST) {
    console.log(`👤 Processing user: ${user.name} (${user.id})`);

    // Collect all items for this user
    const userItems = getAllUserItems(user);

    if (userItems.length === 0) {
      console.log(`   ⚠️  No items found for user ${user.id}, skipping...\n`);
      continue;
    }

    // 1. Generate single model screenshots for each item
    console.log(`   📸 Generating ${userItems.length} item poster(s)...`);
    for (const item of userItems) {
      // Use existing og path if specified, otherwise generate expected path
      const ogPath = item.og || getItemOGPath(item.model);
      const outputFsPath = webPathToFsOutput(ogPath);

      allTasks.push({
        items: [item],
        outputPath: outputFsPath
      });
    }

    console.log('');
  }

  // Now render all single-model tasks in batch
  if (allTasks.length > 0) {
    console.log(`\n🚀 Rendering ${allTasks.length} single-model poster(s) in batch...\n`);
    await renderBatch(allTasks);
  }

  // Now handle multi-model renders
  console.log(`\n🎨 Processing multi-model renders...\n`);

  const multiModelTasks: RenderTask[] = [];

  for (const user of FIRST_PARTY_MANIFEST) {
    const userItems = getAllUserItems(user);
    if (userItems.length === 0) continue;

    // User OG image
    const ogPath = user.og || getUserOGPath(user.id);
    const outputFsPath = webPathToFsOutput(ogPath);
    multiModelTasks.push({
      items: userItems,
      outputPath: outputFsPath
    });

    // Collection OG images
    for (const collection of user.collections) {
      if (collection.items.length === 0) continue;

      const collectionOgPath = collection.og || getCollectionOGPath(user.id, collection.id);
      const collectionOutputFsPath = webPathToFsOutput(collectionOgPath);
      multiModelTasks.push({
        items: collection.items,
        outputPath: collectionOutputFsPath
      });
    }
  }

  // Render all multi-model tasks
  for (const task of multiModelTasks) {
    console.log(`📸 Rendering multi-model: ${task.items.length} item(s) -> ${path.basename(task.outputPath)}`);
    await renderBatch([task]);
  }

  // Render root OG image with all items
  // Temporarily disabled
  // console.log(`\n🎨 Processing root OG image...\n`);
  // const allItems: Item[] = [];
  // for (const user of FIRST_PARTY_MANIFEST) {
  //   const userItems = getAllUserItems(user);
  //   allItems.push(...userItems);
  // }

  // if (allItems.length > 0) {
  //   const rootOgPath = getRootOGPath();
  //   const outputFsPath = webPathToFsOutput(rootOgPath);
  //   console.log(`📸 Rendering root OG image: ${allItems.length} item(s) -> ${rootOgPath}`);
  //   await renderBatch([{
  //     items: allItems,
  //     outputPath: outputFsPath
  //   }]);
  // }

  console.log('\n✅ All renders complete!');
}

async function renderUsers(): Promise<void> {
  console.log('🎨 Starting render-users process...\n');

  const multiModelTasks: RenderTask[] = [];

  for (const user of FIRST_PARTY_MANIFEST) {
    const userItems = getAllUserItems(user);
    if (userItems.length === 0) {
      console.log(`   ⚠️  No items found for user ${user.id}, skipping...`);
      continue;
    }

    // User OG image
    const ogPath = user.og || getUserOGPath(user.id);
    const outputFsPath = webPathToFsOutput(ogPath);
    multiModelTasks.push({
      items: userItems,
      outputPath: outputFsPath
    });
  }

  if (multiModelTasks.length === 0) {
    console.log('⚠️  No users with items found to render');
    return;
  }

  // Render all user OG images
  for (const task of multiModelTasks) {
    console.log(`📸 Rendering user: ${task.items.length} item(s) -> ${path.basename(task.outputPath)}`);
    await renderBatch([task]);
  }

  console.log('\n✅ All user renders complete!');
}

async function renderCollections(): Promise<void> {
  console.log('🎨 Starting render-collections process...\n');

  const multiModelTasks: RenderTask[] = [];

  for (const user of FIRST_PARTY_MANIFEST) {
    // Collection OG images
    for (const collection of user.collections) {
      if (collection.items.length === 0) {
        console.log(`   ⚠️  No items found for collection ${user.id}/${collection.id}, skipping...`);
        continue;
      }

      const collectionOgPath = collection.og || getCollectionOGPath(user.id, collection.id);
      const collectionOutputFsPath = webPathToFsOutput(collectionOgPath);
      multiModelTasks.push({
        items: collection.items,
        outputPath: collectionOutputFsPath
      });
    }
  }

  if (multiModelTasks.length === 0) {
    console.log('⚠️  No collections with items found to render');
    return;
  }

  // Render all collection OG images
  for (const task of multiModelTasks) {
    console.log(`📸 Rendering collection: ${task.items.length} item(s) -> ${path.basename(task.outputPath)}`);
    await renderBatch([task]);
  }

  console.log('\n✅ All collection renders complete!');
}

async function renderRoot(): Promise<void> {
  console.log('🎨 Starting render-root process...\n');

  // Collect ALL items from ALL users
  const allItems: Item[] = [];
  for (const user of FIRST_PARTY_MANIFEST) {
    const userItems = getAllUserItems(user);
    allItems.push(...userItems);
  }

  if (allItems.length === 0) {
    console.log('⚠️  No items found in manifest');
    return;
  }

  console.log(`📸 Collecting ${allItems.length} item(s) from all users...`);

  // Render root OG image with all items
  const rootOgPath = getRootOGPath();
  const outputFsPath = webPathToFsOutput(rootOgPath);
  
  console.log(`📸 Rendering root OG image: ${allItems.length} item(s) -> ${rootOgPath}`);
  await renderBatch([{
    items: allItems,
    outputPath: outputFsPath
  }]);

  console.log('\n✅ Root render complete!');
}

// Parse command line arguments and execute
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage:');
    console.error('  Root OG image (all items): npm run render root');
    console.error('  All posters (from manifest): npm run render all');
    console.error('  User OG images: npm run render users');
    console.error('  Collection OG images: npm run render collections');
    console.error('  Test mode: npm run render test [output.png]');
    console.error('');
    console.error('Examples:');
    console.error('  npm run render root');
    console.error('  npm run render all');
    console.error('  npm run render users');
    console.error('  npm run render collections');
    console.error('  npm run render test');
    console.error('  npm run render test test-render.png');
    process.exit(1);
  }

  const mode = args[0];
  try {
    if (mode === 'test') {
      // Test mode: render first item from first user
      const outputPath = args[1] || 'test-render.png';
      console.log(`🧪 Test mode: Rendering first item`);
      if (FIRST_PARTY_MANIFEST.length > 0) {
        const firstUser = FIRST_PARTY_MANIFEST[0];
        if (firstUser.collections.length > 0) {
          const firstCollection = firstUser.collections[0];
          if (firstCollection.items.length > 0) {
            const firstItem = firstCollection.items[0];
            await renderBatch([{
              items: [firstItem],
              outputPath
            }]);
          } else {
            console.error('No items found in first collection');
            process.exit(1);
          }
        } else {
          console.error('No collections found for first user');
          process.exit(1);
        }
      } else {
        console.error('No users found in manifest');
        process.exit(1);
      }
    } else if (mode === 'all') {
      // Render all posters from manifest
      await renderAll();
    } else if (mode === 'users') {
      // Render only user OG images
      await renderUsers();
    } else if (mode === 'collections') {
      // Render only collection OG images
      await renderCollections();
    } else if (mode === 'root') {
      // Render root OG image with all items
      await renderRoot();
    } else {
      console.error('Error: First argument must be "test", "root", "all", "users", or "collections"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
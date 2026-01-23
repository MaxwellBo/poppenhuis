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
  url: string;
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
  return `/assets/derived/${filename}.jpeg`;
}

function getCollectionOGPath(userId: string, collectionId: string): string {
  return `/assets/derived/${userId}_${collectionId}_og.jpeg`;
}

function getUserOGPath(userId: string): string {
  return `/assets/derived/${userId}_og.jpeg`;
}

function getAllUserItems(user: User): Item[] {
  const items: Item[] = [];
  for (const collection of user.collections) {
    items.push(...collection.items);
  }
  return items;
}

function parseUrlToItems(url: string): Item[] {
  // Parse URL like /userId/collectionId/itemId or /userId/collectionId or /userId
  const parts = url.split('/').filter(p => p && !p.includes('?'));

  if (parts.length === 3) {
    // Single item: /userId/collectionId/itemId
    const [userId, collectionId, itemId] = parts;
    const user = FIRST_PARTY_MANIFEST.find(u => u.id === userId);
    if (!user) return [];
    const collection = user.collections.find(c => c.id === collectionId);
    if (!collection) return [];
    const item = collection.items.find(i => i.id === itemId);
    return item ? [item] : [];
  } else if (parts.length === 2) {
    // Collection: /userId/collectionId
    const [userId, collectionId] = parts;
    const user = FIRST_PARTY_MANIFEST.find(u => u.id === userId);
    if (!user) return [];
    const collection = user.collections.find(c => c.id === collectionId);
    return collection ? collection.items : [];
  } else if (parts.length === 1) {
    // User: /userId
    const [userId] = parts;
    const user = FIRST_PARTY_MANIFEST.find(u => u.id === userId);
    if (!user) return [];
    return getAllUserItems(user);
  }
  return [];
}

function modelPathToFsPath(modelPath: string): string {
  // Convert web path like /assets/goldens/model.glb to filesystem path
  const cleanPath = modelPath.startsWith('/') ? modelPath.slice(1) : modelPath;
  return path.join(__dirname, 'public', cleanPath);
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

  let blenderPath = null;

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
  const args = [
    '--background', // Run in background (no UI)
    '--python', scriptPath,
    '--',
    '--mode', mode,
    '--output', outputPath,
    '--width', '1200',
    '--height', '630',
    ...(isSingle ? [] : ['--grid-cols', '5']),
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

export async function renderBatch(tasks: RenderTask[], baseUrl: string = 'http://localhost:5173') {
  if (tasks.length === 0) {
    console.error('Error: No render tasks provided');
    process.exit(1);
  }

  console.log(`📁 Processing ${tasks.length} render task(s)`);

  try {
    // Convert URL tasks to model render tasks
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      console.log(`\n[${i + 1}/${tasks.length}] Processing: ${task.url}`);

      // Parse URL to get items
      const items = parseUrlToItems(task.url);

      if (items.length === 0) {
        console.log(`   ⚠️  No items found for URL: ${task.url}, skipping...`);
        continue;
      }

      // Get model paths
      const modelPaths = items.map(item => item.model);
      const isSingle = items.length === 1;

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

export async function renderSingle(url: string, outputPath: string, baseUrl: string = 'http://localhost:5173') {
  await renderBatch([{ url, outputPath }], baseUrl);
}

async function renderAll(baseUrl: string = 'http://localhost:5173') {
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
      // Find which collection this item belongs to
      const collection = user.collections.find(c => c.items.some(i => i.id === item.id));
      if (!collection) {
        console.log(`   ⚠️  Could not find collection for item ${item.id}, skipping...`);
        continue;
      }

      // Use existing og path if specified, otherwise generate expected path
      const ogPath = item.og || getItemOGPath(item.model);
      const outputFsPath = webPathToFsOutput(ogPath);

      const url = `/${user.id}/${collection.id}/${item.id}`;
      allTasks.push({
        url,
        outputPath: outputFsPath
      });
    }

    console.log('');
  }

  // Now render all single-model tasks in batch
  if (allTasks.length > 0) {
    console.log(`\n🚀 Rendering ${allTasks.length} single-model poster(s) in batch...\n`);
    await renderBatch(allTasks, baseUrl);
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
      url: `/${user.id}`,
      outputPath: outputFsPath
    });

    // Collection OG images
    for (const collection of user.collections) {
      if (collection.items.length === 0) continue;

      const collectionOgPath = collection.og || getCollectionOGPath(user.id, collection.id);
      const collectionOutputFsPath = webPathToFsOutput(collectionOgPath);
      multiModelTasks.push({
        url: `/${user.id}/${collection.id}`,
        outputPath: collectionOutputFsPath
      });
    }
  }

  // Render all multi-model tasks
  for (const task of multiModelTasks) {
    console.log(`📸 Rendering multi-model: ${task.url} -> ${path.basename(task.outputPath)}`);
    await renderSingle(task.url, task.outputPath, baseUrl);
  }

  console.log('\n✅ All renders complete!');
}

// Parse command line arguments and execute
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage:');
    console.error('  All posters (from manifest): tsx render.ts all [baseUrl]');
    console.error('  Single URL: tsx render.ts single <url> <output.jpeg> [baseUrl]');
    console.error('  Batch URLs: tsx render.ts batch <url1> <output1.jpeg> [url2 output2.jpeg ...] [baseUrl]');
    console.error('  Test root: tsx render.ts test [baseUrl] [output.jpeg]');
    console.error('');
    console.error('Examples:');
    console.error('  tsx render.ts all');
    console.error('  tsx render.ts all http://localhost:5173');
    console.error('  tsx render.ts single /jackie/cakes/brat?render=true output.jpeg');
    console.error('  tsx render.ts test');
    process.exit(1);
  }

  const mode = args[0];
  try {
    if (mode === 'test') {
      // Test mode: render first item from first user
      const baseUrl = args[1] || 'http://localhost:5173';
      const outputPath = args[2] || 'test-render.jpeg';
      console.log(`🧪 Test mode: Rendering first item`);
      if (FIRST_PARTY_MANIFEST.length > 0) {
        const firstUser = FIRST_PARTY_MANIFEST[0];
        if (firstUser.collections.length > 0) {
          const firstCollection = firstUser.collections[0];
          if (firstCollection.items.length > 0) {
            const firstItem = firstCollection.items[0];
            await renderSingle(`/${firstUser.id}/${firstCollection.id}/${firstItem.id}`, outputPath, baseUrl);
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
      const baseUrl = args[1] || 'http://localhost:5173';
      await renderAll(baseUrl);
    } else if (mode === 'single') {
      // Single URL mode
      if (args.length < 3) {
        console.error('Error: Single mode requires <url> <output.jpeg>');
        process.exit(1);
      }
      const [url, outputPath, baseUrl = 'http://localhost:5173'] = args.slice(1);
      await renderSingle(url, outputPath, baseUrl);
    } else if (mode === 'batch') {
      // Batch mode: pairs of url and output
      const pairs = args.slice(1);
      // Last arg might be baseUrl if odd number
      let baseUrl = 'http://localhost:5173';
      let actualPairs = pairs;
      if (pairs.length % 2 === 1) {
        baseUrl = pairs[pairs.length - 1];
        actualPairs = pairs.slice(0, -1);
      }

      if (actualPairs.length % 2 !== 0) {
        console.error('Error: Batch mode requires pairs of <url> <output.jpeg>');
        process.exit(1);
      }

      const tasks: RenderTask[] = [];
      for (let i = 0; i < actualPairs.length; i += 2) {
        tasks.push({
          url: actualPairs[i],
          outputPath: actualPairs[i + 1]
        });
      }

      await renderBatch(tasks, baseUrl);
    } else {
      console.error('Error: First argument must be "test", "all", "single", or "batch"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
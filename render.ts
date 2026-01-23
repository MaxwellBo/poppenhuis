// render.ts
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIRST_PARTY_MANIFEST, User, Collection, Item } from './src/manifest.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RenderTask {
  url: string;
  outputPath: string;
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

async function renderUrl(page: puppeteer.Page, url: string, outputPath: string) {
    console.log(`🌐 Loading: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    const waitTimeSeconds = 3;
    console.log(`🕐 Waiting ${waitTimeSeconds}s before screenshot...`);
    await new Promise(r => setTimeout(r, waitTimeSeconds * 1000));
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`📸 Taking screenshot to: ${outputPath}`);
    await page.screenshot({ 
        path: outputPath,
        type: 'jpeg',
        clip: {
            x: 0,
            y: 0,
            width: 1200,
            height: 630
        }
    });
    
    console.log(`✅ Rendered: ${outputPath}`);
}

export async function renderBatch(tasks: RenderTask[], baseUrl: string = 'http://localhost:5173') {
    if (tasks.length === 0) {
        console.error('Error: No render tasks provided');
        process.exit(1);
    }
    
    console.log(`📁 Processing ${tasks.length} render task(s)`);
    
    let browser: puppeteer.Browser | null = null;
    
    try {
        // Open browser once
        console.log(`🚀 Launching browser (non-headless)...`);
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--use-gl=egl',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        console.log(`📊 Creating new page...`);
        const page = await browser.newPage();
        
        console.log(`📐 Setting viewport...`);
        // Use larger viewport to ensure we capture everything, then crop to OG size
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Render each task
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            const fullUrl = `${baseUrl}${task.url}`;
            await renderUrl(page, fullUrl, task.outputPath);
        }
        
    } catch (error) {
        console.error(`❌ Error during rendering:`, error);
        throw error;
    } finally {
        if (browser) {
            console.log(`🔒 Closing browser...`);
            await browser.close();
        }
    }
    
    console.log(`✅ All renders complete!`);
}

export async function renderSingle(url: string, outputPath: string, baseUrl: string = 'http://localhost:5173') {
    await renderBatch([{ url, outputPath }], baseUrl);
}

async function renderAll(baseUrl: string = 'http://localhost:5173') {
    console.log('🎨 Starting render-all process...\n');
    console.log(`🌐 Using dev server: ${baseUrl}\n`);
    
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
            
            const url = `/${user.id}/${collection.id}/${item.id}?render=true`;
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
            url: `/${user.id}?render=true`,
            outputPath: outputFsPath 
        });
        
        // Collection OG images
        for (const collection of user.collections) {
            if (collection.items.length === 0) continue;
            
            const collectionOgPath = collection.og || getCollectionOGPath(user.id, collection.id);
            const collectionOutputFsPath = webPathToFsOutput(collectionOgPath);
            multiModelTasks.push({ 
                url: `/${user.id}/${collection.id}?render=true`,
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

// Parse command line arguments
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
if (mode === 'test') {
    // Test mode: screenshot the root URL
    const baseUrl = args[1] || 'http://localhost:5173';
    const outputPath = args[2] || 'test-root.jpeg';
    console.log(`🧪 Test mode: Screenshotting root of ${baseUrl}`);
    await renderSingle('/', outputPath, baseUrl);
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

process.exit(0);
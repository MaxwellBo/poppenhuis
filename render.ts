// render.ts
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.217.0/http/file_server.ts";
import { walk } from "https://deno.land/std@0.217.0/fs/walk.ts";
import { dirname, join } from "https://deno.land/std@0.217.0/path/mod.ts";

interface RenderConfig {
  models: string[];
  outputPath: string;
  type: 'single' | 'collection' | 'user';
}

// Track used ports to avoid conflicts
let nextPort = 8000;

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: oldlace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .grid {
            display: grid;
            width: 1200px;
            height: 630px;
            gap: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: oldlace;
        }
        model-viewer {
            width: 100%;
            height: 100%;
            background-color: oldlace;
        }
    </style>
</head>
<body>
    <div id="grid" class="grid">
        <!-- Models will be injected here -->
    </div>
</body>
</html>
`;

function generateModelViewerHTML(models: string[], type: RenderConfig['type']) {
    let columns = 1;
    let modelViewers = '';
    
    switch (type) {
        case 'single':
            columns = 1;
            modelViewers = models.map((path, index) => generateModelViewer(path, index)).join('');
            break;
        case 'collection':
            columns = 2; // 2x2 grid for collections
            modelViewers = models.slice(0, 4).map((path, index) => generateModelViewer(path, index)).join('');
            break;
        case 'user':
            // For user mode, we'll handle the grid differently
            // We'll process collections in rows, 4 items per collection
            const collections = groupModelsByCollection(models);
            columns = 4; // 4 items per row for each collection
            modelViewers = collections.map(collection => 
                collection.slice(0, 4).map((path, index) => generateModelViewer(path, index)).join('')
            ).join('');
            break;
    }

    const style = `
        grid-template-columns: repeat(${columns}, 1fr);
        grid-template-rows: auto;
    `;
    
    return HTML_TEMPLATE.replace('<!-- Models will be injected here -->', modelViewers)
                       .replace('<div id="grid" class="grid">', `<div id="grid" class="grid" style="${style}">`);
}

function generateModelViewer(path: string, index: number): string {
    return `
        <model-viewer
            src="/model/${index}"
            camera-controls
            auto-rotate
            interaction-prompt=""
            progress-bar=""
            auto-rotate-delay="0"
            rotation-per-second="20deg"
            camera-orbit="0deg 75deg 85%"
        ></model-viewer>
    `;
}

function groupModelsByCollection(models: string[]): string[][] {
    const collections = new Map<string, string[]>();
    
    for (const model of models) {
        const collectionPath = dirname(model);
        if (!collections.has(collectionPath)) {
            collections.set(collectionPath, []);
        }
        collections.get(collectionPath)?.push(model);
    }
    
    return Array.from(collections.values());
}

async function findGlbFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    for await (const entry of walk(dir, { 
        match: [/\.glb$/],
        maxDepth: 1
    })) {
        if (entry.isFile) {
            files.push(entry.path);
        }
    }
    return files;
}

async function startServer(config: RenderConfig): Promise<string> {
    const port = nextPort++;
    
    console.log(`🌐 Starting local server on port ${port}...`);
    
    const handler = async (req: Request): Promise<Response> => {
        const url = new URL(req.url);
        if (url.pathname.startsWith('/model/')) {
            const modelIndex = parseInt(url.pathname.split('/')[2]);
            if (isNaN(modelIndex) || modelIndex >= config.models.length) {
                return new Response('Model not found', { status: 404 });
            }
            return await serveFile(req, config.models[modelIndex]);
        }
        return new Response(
            generateModelViewerHTML(config.models, config.type),
            { headers: { 'content-type': 'text/html' } }
        );
    };

    serve(handler, { port });
    return `http://localhost:${port}`;
}

async function renderModels(config: RenderConfig) {
    console.log(`📁 Input models: ${config.models.join(', ')}`);
    
    const serverUrl = await startServer(config);
    console.log(`🚀 Server started at ${serverUrl}`);

    try {
        console.log(`🚀 Launching browser...`);
        const browser = await puppeteer.launch();
        console.log(`📊 Creating new page...`);
        const page = await browser.newPage();
        
        console.log(`📐 Setting viewport...`);
        await page.setViewport({ width: 1200, height: 630 });
        
        console.log(`🌐 Loading page: ${serverUrl}`);
        await page.goto(serverUrl);
        
        console.log(`⏳ Waiting for model-viewers to be ready...`);
        await page.waitForSelector('model-viewer:not([loading])');
        
        const waitTimeSeconds = config.models.length * 2;
        console.log(`🕐 Waiting for initial rotation (${waitTimeSeconds}s)...`);
        await new Promise(r => setTimeout(r, waitTimeSeconds * 1000));
        
        console.log(`📸 Taking screenshot to: ${config.outputPath}`);
        await page.screenshot({ 
            path: config.outputPath,
            type: 'jpeg',
         });
        
        console.log(`🔒 Closing browser...`);
        await browser.close();
    } catch (error) {
        console.error(`❌ Error during rendering:`, error);
        throw error;
    }
    
    console.log(`✅ Render complete!`);
}

async function exists(path: string): Promise<boolean> {
    try {
        await Deno.stat(path);
        return true;
    } catch {
        return false;
    }
}

// Main processing function
async function processEverything(rootPath: string) {
    // First process all individual GLB files
    for await (const entry of walk(rootPath, { match: [/\.glb$/] })) {
        if (entry.isFile) {
            const outputPath = entry.path.replace('.glb', '.jpeg');
            await renderModels({
                models: [entry.path],
                outputPath,
                type: 'single'
            });
        }
    }

    // Then process all collections
    const processedDirs = new Set<string>();
    for await (const entry of walk(rootPath, { match: [/\.glb$/] })) {
        if (entry.isFile) {
            const dir = dirname(entry.path);
            if (!processedDirs.has(dir)) {
                processedDirs.add(dir);
                const models = await findGlbFiles(dir);
                if (models.length > 0) {
                    await renderModels({
                        models,
                        outputPath: join(dir, 'og.jpeg'),
                        type: 'collection'
                    });
                }
            }
        }
    }

    // Finally process all user directories
    const modelsPath = join(rootPath, 'public', 'models');
    if (await exists(modelsPath)) {
        // Get all user directories
        for await (const entry of Deno.readDir(modelsPath)) {
            if (entry.isDirectory) {
                const userPath = join(modelsPath, entry.name);
                const models: string[] = [];
                
                // Find all GLB files in this user's directory
                for await (const modelEntry of walk(userPath, { match: [/\.glb$/] })) {
                    if (modelEntry.isFile) {
                        models.push(modelEntry.path);
                    }
                }
                
                if (models.length > 0) {
                    console.log(`Processing user directory: ${entry.name}`);
                    await renderModels({
                        models,
                        outputPath: join(userPath, 'og.jpeg'),
                        type: 'user'
                    });
                }
            }
        }
    }
}

// Simple entry point
if (Deno.args.length < 1) {
    console.error('Usage: deno run --allow-read --allow-write --allow-run --allow-env --allow-net render.ts <directory>');
    Deno.exit(1);
}

await processEverything(Deno.args[0]);
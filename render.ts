// render.ts
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.217.0/http/file_server.ts";

interface RenderConfig {
  models: string[];
  outputPath: string;
}

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
        }
        .grid {
            display: grid;
            width: 1200px;
            height: 630px;
            gap: 10px;
            padding: 10px;
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

function generateModelViewerHTML(models: RenderConfig['models'], isSingle: boolean) {
    const columns = isSingle ? 1 : 3;  // Single model = 1 column, Multi = 3 columns
    const rows = Math.ceil(models.length / columns);
    const style = `
        grid-template-columns: repeat(${columns}, 1fr);
        grid-template-rows: repeat(${rows}, 1fr);
    `;
    
    const modelViewers = models.map((path, index) => `
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
    `).join('');

    return HTML_TEMPLATE.replace('<!-- Models will be injected here -->', modelViewers)
                       .replace('<div id="grid" class="grid">', `<div id="grid" class="grid" style="${style}">`);
}

async function startServer(config: RenderConfig, isSingle: boolean): Promise<string> {
    const port = 8000;
    
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
            generateModelViewerHTML(config.models, isSingle),
            { headers: { 'content-type': 'text/html' } }
        );
    };

    serve(handler, { port });
    return `http://localhost:${port}`;
}

async function renderModels(config: RenderConfig, isSingle: boolean) {
    console.log(`📁 Input models: ${config.models.join(', ')}`);
    
    const serverUrl = await startServer(config, isSingle);
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
    Deno.exit(0);  // Force exit since server keeps running
}

// Parse command line arguments
const args = Deno.args;
if (args.length < 2) {
    console.error('Usage:');
    console.error('Single model: deno run --allow-read --allow-write --allow-run --allow-env --allow-net render.ts single <input.glb> <output.jpeg>');
    console.error('Multiple models: deno run --allow-read --allow-write --allow-run --allow-env --allow-net render.ts multi <output.jpeg> <model1.glb> [model2.glb ...]');
    Deno.exit(1);
}

const mode = args[0];
if (mode === 'single') {
    // Single model mode
    const [_, inputPath, outputPath] = args;
    await renderModels({
        models: [inputPath],
        outputPath
    }, true);
} else if (mode === 'multi') {
    // Multiple models mode
    const [_, outputPath, ...modelPaths] = args;
    
    if (modelPaths.length === 0) {
        console.error('Error: Must provide at least one model path');
        Deno.exit(1);
    }
    
    await renderModels({
        models: modelPaths,
        outputPath
    }, false);
} else {
    console.error('Error: First argument must be either "single" or "multi"');
    Deno.exit(1);
}
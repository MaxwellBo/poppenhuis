// render.ts
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { serveFile } from "https://deno.land/std@0.217.0/http/file_server.ts";

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"></script>
    <style>
        model-viewer {
            width: 1200px;
            height: 630px;
            background-color: oldlace;
        }
    </style>
</head>
<body>
    <model-viewer
        src="MODEL_URL_PLACEHOLDER"
        camera-controls
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="20deg"
        camera-orbit="0deg 75deg 85%" 
        auto-rotate-delay="0"
    ></model-viewer>
</body>
</html>
`;

async function startServer(glbPath: string): Promise<string> {
    const port = 8000;
    const modelFilename = glbPath.split('/').pop();
    
    console.log(`🌐 Starting local server on port ${port}...`);
    
    const handler = async (req: Request): Promise<Response> => {
        const url = new URL(req.url);
        if (url.pathname === '/model') {
            return await serveFile(req, glbPath);
        }
        return new Response(
            HTML_TEMPLATE.replace('MODEL_URL_PLACEHOLDER', '/model'),
            { headers: { 'content-type': 'text/html' } }
        );
    };

    serve(handler, { port });
    return `http://localhost:${port}`;
}

async function renderGLB(inputPath: string, outputPath: string) {
    console.log(`📁 Input file: ${inputPath}`);
    
    const serverUrl = await startServer(inputPath);
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
        
        console.log(`⏳ Waiting for model-viewer to be ready...`);
        await page.waitForSelector('model-viewer:not([loading])');
        
        console.log(`🕐 Waiting for initial rotation (2s)...`);
        await new Promise(r => setTimeout(r, 2000));
        
        console.log(`📸 Taking screenshot to: ${outputPath}`);
        await page.screenshot({ 
            path: outputPath,
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

// Get command line arguments
const inputPath = Deno.args[0];
const outputPath = Deno.args[1];

if (!inputPath || !outputPath) {
    console.error('Usage: deno run --allow-read --allow-write --allow-run --allow-env --allow-net render.ts <input.glb> <output.png>');
    Deno.exit(1);
}

console.log(`🎬 Starting GLB render process...`);
await renderGLB(inputPath, outputPath);
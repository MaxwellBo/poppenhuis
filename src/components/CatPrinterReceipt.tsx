import { useRef, useState } from 'react';
import { Item, Collection, User } from '../manifest';
import { CatPrinter } from '../../kitty-printer-main/common/cat-protocol';
import { rgbaToBits } from '../../kitty-printer-main/common/bitmap-utils';
import {
  CAT_ADV_SRV,
  CAT_PRINT_SRV,
  CAT_PRINT_TX_CHAR,
  CAT_PRINT_RX_CHAR,
  DEF_CANVAS_WIDTH,
  DEF_SPEED,
  DEF_ENERGY,
  DEF_FINISH_FEED,
} from '../../kitty-printer-main/common/constants';

interface CatPrinterReceiptProps {
  item: Item;
  collection: Collection;
  user: User;
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice: (options: any) => Promise<any>;
    };
  }
}

export function CatPrinterReceipt({ item, collection, user }: CatPrinterReceiptProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderReceipt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas width to printer width
    canvas.width = DEF_CANVAS_WIDTH;
    canvas.height = 1500; // Start tall, will adjust at end
    const SPACING = 60;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let yPos = 40;
    
    // Black text
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'left';
    
    // Helper to add a line
    const addLine = (text: string) => {
      ctx.fillText(text, 10, yPos);
      yPos += SPACING;
    };
    
    // Print all item fields (only if defined)
    if (item.name) addLine(`name: ${item.name}`);
    if (item.id) addLine(`id: ${item.id}`);
    if (item.model) addLine(`model: ${item.model}`);
    if (item.usdzModel) addLine(`usdzModel: ${item.usdzModel}`);
    if (item.og) addLine(`og: ${item.og}`);
    if (item.alt) addLine(`alt: ${item.alt}`);
    if (item.formalName) addLine(`formalName: ${item.formalName}`);
    if (item.releaseDate) addLine(`releaseDate: ${item.releaseDate}`);
    if (item.description) addLine(`description: ${item.description}`);
    if (item.manufacturer) addLine(`manufacturer: ${item.manufacturer}`);
    if (item.manufactureDate) addLine(`manufactureDate: ${item.manufactureDate}`);
    if (item.manufactureLocation) addLine(`manufactureLocation: ${item.manufactureLocation}`);
    if (item.material && item.material.length > 0) addLine(`material: ${item.material.join(', ')}`);
    if (item.acquisitionDate) addLine(`acquisitionDate: ${item.acquisitionDate}`);
    if (item.acquisitionLocation) addLine(`acquisitionLocation: ${item.acquisitionLocation}`);
    if (item.storageLocation) addLine(`storageLocation: ${item.storageLocation}`);
    if (item.captureDate) addLine(`captureDate: ${item.captureDate}`);
    if (item.captureLocation) addLine(`captureLocation: ${item.captureLocation}`);
    if (item.captureLatLon) addLine(`captureLatLon: ${item.captureLatLon}`);
    if (item.captureDevice) addLine(`captureDevice: ${item.captureDevice}`);
    if (item.captureApp) addLine(`captureApp: ${item.captureApp}`);
    if (item.captureMethod) addLine(`captureMethod: ${item.captureMethod}`);
  };

  const printReceipt = async () => {
    setIsPrinting(true);
    setError(null);

    // Render the receipt first
    renderReceipt();

    try {
      // Check if bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser');
      }

      // Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CAT_ADV_SRV] }],
        optionalServices: [CAT_PRINT_SRV]
      });

      const server = await device.gatt.connect();

      try {
        const service = await server.getPrimaryService(CAT_PRINT_SRV);
        const [tx, rx] = await Promise.all([
          service.getCharacteristic(CAT_PRINT_TX_CHAR),
          service.getCharacteristic(CAT_PRINT_RX_CHAR)
        ]);

        const printer = new CatPrinter(
          device.name,
          tx.writeValueWithoutResponse.bind(tx),
          false
        );

        const notifier = (event: Event) => {
          const data: DataView = (event.target as any).value;
          const message = new Uint8Array(data.buffer);
          printer.notify(message);
        };

        await rx.startNotifications()
          .then(() => rx.addEventListener('characteristicvaluechanged', notifier))
          .catch((error: Error) => console.log(error));

        await printer.prepare(DEF_SPEED, DEF_ENERGY);

        // Get canvas data
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert RGBA to grayscale with proper weighting, then to 1-bit black/white
        // Following the same approach as kitty-printer's image_worker.js
        const data = new Uint32Array(imageData.data.buffer);
        const bwData = new Uint32Array(data.length);
        
        for (let i = 0; i < data.length; i++) {
          const n = data[i];
          // Extract RGB from little-endian RGBA
          const r = (n & 0xff);
          const g = ((n >> 8) & 0xff);
          const b = ((n >> 16) & 0xff);
          const a = ((n >> 24) & 0xff) / 0xff;
          
          // Convert to grayscale with proper color weighting
          let gray = r * 0.2125 + g * 0.7154 + b * 0.0721;
          
          // Handle alpha - treat transparent as white
          if (a < 1) {
            const alpha = 1 - a;
            gray = gray * a + 0xff * alpha;
          }
          
          // Simple threshold to black or white
          const value = gray > 128 ? 0xff : 0x00;
          
          // Store as RGBA where each channel is either 0x00 or 0xff
          bwData[i] = (value << 16) | (value << 8) | value | 0xff000000;
        }

        const bitmap = rgbaToBits(bwData);
        const pitch = canvas.width / 8 | 0;

        let blank = 0;
        for (let i = 0; i < canvas.height * pitch; i += pitch) {
          const line = bitmap.slice(i, i + pitch);
          if (line.every(byte => byte === 0)) {
            blank += 1;
          } else {
            if (blank > 0) {
              await printer.setSpeed(8);
              await printer.feed(blank);
              await printer.setSpeed(DEF_SPEED);
              blank = 0;
            }
            await printer.draw(line);
          }
        }

        await printer.finish(blank + DEF_FINISH_FEED);
        await rx.stopNotifications().then(() => 
          rx.removeEventListener('characteristicvaluechanged', notifier)
        );

      } finally {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (server) server.disconnect();
      }

    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="cat-printer-receipt">
      <button 
        onClick={printReceipt} 
        disabled={isPrinting}
        style={{ 
          cursor: isPrinting ? 'wait' : 'pointer',
        }}
      >
        {isPrinting ? 'printing...' : 'print receipt'}
      </button>
      {error && <span style={{ color: 'red', marginLeft: '10px' }}>{error}</span>}
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
}

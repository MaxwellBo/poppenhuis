import { useRef, useState, useEffect } from 'react';
import { Item, Collection, User } from '../manifest';
import { DescriptionList } from './DescriptionList';
import { QrCode } from './QrCode';
import { CatPrinter } from '../../kitty-printer-main/common/cat-protocol';
import { rgbaToBits } from '../../kitty-printer-main/common/bitmap-utils';
import { rgbaToGray, grayToRgba, ditherSteinberg } from '../../kitty-printer-main/common/dither-utils';
import {
  CAT_ADV_SRV,
  CAT_PRINT_SRV,
  CAT_PRINT_TX_CHAR,
  CAT_PRINT_RX_CHAR,
  DEF_CANVAS_WIDTH,
  DEF_FINISH_FEED,
  SPEED_RANGE,
  ENERGY_RANGE,
  DEF_SPEED,
} from '../../kitty-printer-main/common/constants';
import html2canvas from 'html2canvas';
import './receipt.css';

const RECEIPT_RENDER_DELAY = 3000; // Wait for images to load before rendering

const SPEED = SPEED_RANGE['speed^normal'];
const ENERGY = ENERGY_RANGE['strength^high'];

interface PrintToCatPrinterButtonProps {
  item: Item;
  collection: Collection;
  user: User;
  modelViewerRef?: React.RefObject<HTMLElement>;
}

declare global {
  interface Navigator {
    bluetooth: {
      requestDevice: (options: any) => Promise<any>;
    };
  }
}

export function PrintToCatPrinterButton({ item, collection, user, modelViewerRef }: PrintToCatPrinterButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Get image from OG or model viewer
  useEffect(() => {
    if (item.og) {
      setImageUrl(item.og);
    } else if (modelViewerRef?.current) {
      const modelViewerCanvas = modelViewerRef.current.shadowRoot?.querySelector('canvas');
      if (modelViewerCanvas) {
        setImageUrl(modelViewerCanvas.toDataURL());
      }
    }
  }, [item, modelViewerRef]);

  const renderReceipt = async () => {
    const canvas = canvasRef.current;
    const receiptElement = receiptRef.current;
    if (!canvas || !receiptElement) throw new Error('Canvas or receipt element not found');

    // Use html2canvas to convert the receipt HTML to canvas
    const generatedCanvas = await html2canvas(receiptElement, {
      width: DEF_CANVAS_WIDTH,
      // @ts-ignore
      scale: 1,
      background: '#ffffff',
      logging: false,
    });
    console.log("Generated canvas. Width:", generatedCanvas.width, "Height:", generatedCanvas.height);

    canvas.width = generatedCanvas.width;
    canvas.height = generatedCanvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(generatedCanvas, 0, 0);
      console.log("Drew generated canvas onto main canvas");
    }
  };

  const ditherCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get the content
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply Floyd-Steinberg dithering
    const data = new Uint32Array(imageData.data.buffer);
    const mono = rgbaToGray(data);
    ditherSteinberg(mono, canvas.width, canvas.height);
    const bwData = grayToRgba(mono);
    
    // Wipe the canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    console.log("Wiped canvas");
    
    // Write the dithered content back
    const ditheredImageData = ctx.createImageData(canvas.width, canvas.height);
    const ditheredData = new Uint8ClampedArray(bwData.buffer);
    ditheredImageData.data.set(ditheredData);
    ctx.putImageData(ditheredImageData, 0, 0);
    console.log("Dithered content written back to canvas");
  };

  // Render receipt on mount
  useEffect(() => {
    const delayedRender = async () => {
      await new Promise(resolve => setTimeout(resolve, RECEIPT_RENDER_DELAY));
      if (receiptRef.current && canvasRef.current) {
        await renderReceipt();
        ditherCanvas();
      }
    };
    delayedRender();
  }, [item, collection, user, imageUrl]);

  const printReceipt = async () => {
    setIsPrinting(true);
    setError(null);

    await renderReceipt();
    ditherCanvas();

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

        await printer.prepare(SPEED, ENERGY);

        // Get canvas data
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Canvas not found');

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log("Got image data from canvas");

        // Canvas already has dithering applied from preview
        const data = new Uint32Array(imageData.data.buffer);

        const bitmap = rgbaToBits(data);
        console.log("Converted image data to bitmap");
        const pitch = canvas.width / 8 | 0;
        console.log("Calculated pitch:", pitch);
        console.log("Bitmap length:", bitmap.length);
        console.log("Canvas height:", canvas.height);
        console.log("Canvas width:", canvas.width);
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
        console.log("Finished drawing bitmap to printer");

        await printer.finish(blank + DEF_FINISH_FEED + DEF_FINISH_FEED); // need extra finish feed
        console.log("Finished printing");
        await rx.stopNotifications().then(() =>
          rx.removeEventListener('characteristicvaluechanged', notifier)
        );

      } finally {
        console.log("Disconnecting from printer");
        await new Promise(resolve => setTimeout(resolve, 500));
        if (server) server.disconnect();
        console.log("Disconnected from printer");
      }

    } catch (err) {
      console.error('Print error:', err);
      setError(err instanceof Error ? err.message : 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;
  const printDate = new Date().toLocaleDateString();

  return (
    <>
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
      <div>
        <details>
          <summary>preview & info</summary>
          <p>
            This implements the protocol for the very cheap range of "cat printers" available on <a href="https://www.aliexpress.com/w/wholesale-cat-printer.html">
              AliExpress
            </a>. The protocol is lifted from <a href="https://github.com/NaitLee/kitty-printer">NaitLee/kitty-printer</a>.

            <canvas
              ref={canvasRef}
            />
          </p>
        </details>
      </div>

      {/* Hidden receipt structure that html2canvas will render */}
      <div
        ref={receiptRef}
        aria-hidden="true"
        className="cat-printer-receipt"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${DEF_CANVAS_WIDTH}px`,
          padding: '10px',
          fontSize: '16px',
          borderLeft: '2px solid black',
        }}
      >
        <span style={{ marginBottom: '20px' }}>
          poppenhuis / {user.name} / {collection.name} / {item.name}
        </span>

        {imageUrl && (
          <div style={{ marginBottom: '20px' }}>
            <img
              src={imageUrl}
              alt={item.name}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              crossOrigin="anonymous"
            />
          </div>
        )}

        <DescriptionList item={item} collection={collection} user={user} hideUrls={true} />

        <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <QrCode item={item} user={user} collection={collection} context="print" />
        </div>

        <div style={{ marginBottom: '20px' }}>{itemUrl}</div>
        <div style={{ marginBottom: '20px' }}>printed on {printDate}</div>
      </div>
    </>
  );
}
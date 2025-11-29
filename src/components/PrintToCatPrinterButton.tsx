import { useRef, useState, useEffect } from 'react';
import { Item, Collection, User } from '../manifest';
import { CatPrinter } from '../../kitty-printer-main/common/cat-protocol';
import { rgbaToBits } from '../../kitty-printer-main/common/bitmap-utils';
import { rgbaToGray, grayToRgba, ditherSteinberg } from '../../kitty-printer-main/common/dither-utils';
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
import QRCode from 'qrcode';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renderReceipt = async () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not found');

    // First pass: measure content height
    const measureCanvas = document.createElement('canvas');
    measureCanvas.width = DEF_CANVAS_WIDTH;
    measureCanvas.height = 10000; // Large temporary height for measurement

    const { actualHeight } = await renderReceiptToCanvas(measureCanvas);

    // Second pass: render to actual canvas with correct height
    canvas.width = DEF_CANVAS_WIDTH;
    canvas.height = actualHeight;
    await renderReceiptToCanvas(canvas);
  };

  const renderReceiptToCanvas = async (canvas: HTMLCanvasElement): Promise<{ actualHeight: number }> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not found');

    const SPACING = 20;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let yPos = 30; // Reduced from 40

    // Smaller text
    ctx.font = 'bold 12px monospace'; // Reduced from 24px
    ctx.textAlign = 'left';

    // Helper to add a simple text line
    const addSimpleLine = (text: string) => {
      ctx.fillStyle = 'black';
      ctx.fillText(text, 10, yPos);
      yPos += SPACING;
    };

    // Helper to add a key-value line, skip if value is undefined or []
    const addKeyValueLine = (key: string, value: any) => {
      // Skip if undefined or empty array
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      // Format the display value
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value);

      // Draw key in black
      ctx.fillStyle = 'black';
      const keyText = `${key}: `;
      ctx.fillText(keyText, 10, yPos);

      // Draw value in black
      ctx.fillStyle = 'black';
      const keyWidth = ctx.measureText(keyText).width;
      ctx.fillText(displayValue, 10 + keyWidth, yPos);

      yPos += SPACING;
    };

    // Header info
    addSimpleLine('');
    addSimpleLine('');
    addSimpleLine(`${user.name} / ${collection.name}`);
    addSimpleLine(`${item.name}`);
    addSimpleLine('');

    // Custom fields first (matching ItemPage order)
    if (item.customFields && Object.keys(item.customFields).length > 0) {
      Object.entries(item.customFields).forEach(([key, value]) => {
        addKeyValueLine(key, value);
      });
      addSimpleLine('');
    }

    // Fields in ItemPage DescriptionList order - ALWAYS print them
    addKeyValueLine('formal name', item.formalName);
    addKeyValueLine('release date', item.releaseDate);

    addSimpleLine('');

    addKeyValueLine('manufacturer', item.manufacturer);
    addKeyValueLine('manufacture date', item.manufactureDate);
    addKeyValueLine('manufacture location', item.manufactureLocation);
    addKeyValueLine('material', item.material);

    addSimpleLine('');

    addKeyValueLine('acquisition date', item.acquisitionDate);
    addKeyValueLine('acquisition location', item.acquisitionLocation);

    addSimpleLine('');

    addKeyValueLine('storage location', item.storageLocation);

    addSimpleLine('');

    addKeyValueLine('capture date', item.captureDate);

    // Handle capture location (combines captureLocation and captureLatLon like ItemPage)
    const { captureLocation, captureLatLon } = item;
    let location;
    if (captureLocation && captureLatLon) {
      location = `${captureLocation} (${captureLatLon})`;
    } else if (captureLocation) {
      location = captureLocation;
    } else if (captureLatLon) {
      location = captureLatLon;
    }
    addKeyValueLine('capture location', location);

    addKeyValueLine('capture device', item.captureDevice);
    addKeyValueLine('capture app', item.captureApp);
    addKeyValueLine('capture method', item.captureMethod);


    // Draw photo - either from og image or from model viewer canvas
    let imageSource: string | HTMLCanvasElement | null = null;
    
    if (item.og) {
      imageSource = item.og;
    } else if (modelViewerRef?.current) {
      console.log('Attempting to get model viewer canvas');
      // Get canvas from model-viewer's shadow DOM
      const modelViewerCanvas = modelViewerRef.current.shadowRoot?.querySelector('canvas');
      if (modelViewerCanvas) {
        console.log('Found model viewer canvas:', modelViewerCanvas.width, 'x', modelViewerCanvas.height);
        imageSource = modelViewerCanvas;
      } else {
        console.warn('Model viewer canvas not found in shadow DOM');
      }
    }

    if (imageSource) {
      await new Promise<void>((resolve) => {
        const drawImage = (source: HTMLImageElement | HTMLCanvasElement) => {
          addSimpleLine(''); // Add spacing before image

          // Make image full width (no margins) to maximize size
          const imgWidth = canvas.width;
          // Calculate height to maintain aspect ratio
          const imgHeight = (source.height / source.width) * imgWidth;

          // Center crop: use full width and let sides get chopped if needed
          const sx = Math.max(0, (source.width - source.height * (imgWidth / imgHeight)) / 2);
          const sy = 0;
          const sWidth = source.width - sx * 2;
          const sHeight = source.height;

          // Draw the image
          ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 40;

          resolve();
        };

        if (typeof imageSource === 'string') {
          // Load from URL (og image)
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => drawImage(img);
          img.onerror = () => {
            console.warn('Failed to load OG image:', imageSource);
            resolve();
          };

          img.src = imageSource;
        } else {
          // Use canvas directly (from model viewer)
          drawImage(imageSource);
        }
      });
    }

    // Draw QR code at the end
    const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;
    await new Promise<void>((resolve) => {
      QRCode.toDataURL(itemUrl, {
        errorCorrectionLevel: 'low',
        margin: 0,
        width: 256,
        color: {
          light: '#ffffff'
        }
      }, function (err, url) {
        if (!err && url) {
          const qrImg = new Image();
          qrImg.onload = () => {
            addSimpleLine(''); // Add spacing before QR code

            // Center the QR code
            const qrSize = 256;
            const xOffset = (canvas.width - qrSize) / 2;

            ctx.drawImage(qrImg, xOffset, yPos, qrSize, qrSize);
            yPos += qrSize + 40;

            resolve();
          };
          qrImg.onerror = () => {
            console.warn('Failed to load QR code');
            resolve();
          };
          qrImg.src = url;
        } else {
          console.error('QR Code generation failed:', err);
          resolve();
        }
      });
    });

    // Add the URL text at the end
    addSimpleLine('');
    addSimpleLine(itemUrl);
    addSimpleLine('');
    

    // Draw a black vertical line across the entire canvas height on the left
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, yPos);
    ctx.stroke();

    return { actualHeight: yPos };
  };

  // Render receipt on mount
  useEffect(() => {
    const delayedRender = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await renderReceipt();
    };
    delayedRender();
  }, [item, collection, user]);

  const printReceipt = async () => {
    setIsPrinting(true);
    setError(null);

    // Render the receipt first (now async to wait for image)
    await renderReceipt();

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

        // Apply Floyd-Steinberg dithering using kitty-printer utilities
        const data = new Uint32Array(imageData.data.buffer);
        const mono = rgbaToGray(data);
        ditherSteinberg(mono, canvas.width, canvas.height);
        const bwData = grayToRgba(mono);

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
    </>
  );
}

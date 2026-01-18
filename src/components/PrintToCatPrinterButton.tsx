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
  DEF_FINISH_FEED,
  SPEED_RANGE,
  ENERGY_RANGE,
  DEF_SPEED,
} from '../../kitty-printer-main/common/constants';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Generate QR code URL
  useEffect(() => {
    const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;
    QRCode.toDataURL(itemUrl, {
      errorCorrectionLevel: 'low',
      margin: 0,
      width: 256,
      color: {
        light: '#ffffff'
      }
    }, function (err, url) {
      if (!err && url) {
        setQrCodeUrl(url);
      }
    });
  }, [item, collection, user]);

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
      background: '#ffffff',
      logging: false,
    });

    // Copy to our canvas ref
    canvas.width = generatedCanvas.width;
    canvas.height = generatedCanvas.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(generatedCanvas, 0, 0);
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
    
    // Write the dithered content back
    const ditheredImageData = ctx.createImageData(canvas.width, canvas.height);
    const ditheredData = new Uint8ClampedArray(bwData.buffer);
    ditheredImageData.data.set(ditheredData);
    ctx.putImageData(ditheredImageData, 0, 0);
  };

  // Render receipt on mount
  useEffect(() => {
    const delayedRender = async () => {
      await new Promise(resolve => setTimeout(resolve, RECEIPT_RENDER_DELAY));
      if (receiptRef.current) {
        await renderReceipt();
        ditherCanvas();
      }
    };
    delayedRender();
  }, [item, collection, user, qrCodeUrl, imageUrl]);

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

        // Canvas already has dithering applied from preview
        const data = new Uint32Array(imageData.data.buffer);

        const bitmap = rgbaToBits(data);
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

  // Helper to format capture location
  const getCaptureLocation = () => {
    const { captureLocation, captureLatLon } = item;
    if (captureLocation && captureLatLon) {
      return `${captureLocation} (${captureLatLon})`;
    } else if (captureLocation) {
      return captureLocation;
    } else if (captureLatLon) {
      return captureLatLon;
    }
    return undefined;
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
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${DEF_CANVAS_WIDTH}px`,
          backgroundColor: 'white',
          fontFamily: 'monospace',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '10px',
          borderLeft: '2px solid black',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: '20px' }}>
          poppenhuis / {user.name} / {collection.name} / {item.name}
        </div>

        {/* Image */}
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

        {/* Metadata fields */}
        {item.formalName && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>formal name: </span>
            <span style={{ color: 'black' }}>{item.formalName}</span>
          </div>
        )}
        {item.releaseDate && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>release date: </span>
            <span style={{ color: 'black' }}>{item.releaseDate}</span>
          </div>
        )}
        {item.manufacturer && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>manufacturer: </span>
            <span style={{ color: 'black' }}>{item.manufacturer}</span>
          </div>
        )}
        {item.manufactureDate && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>manufacture date: </span>
            <span style={{ color: 'black' }}>{item.manufactureDate}</span>
          </div>
        )}
        {item.manufactureLocation && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>manufacture location: </span>
            <span style={{ color: 'black' }}>{item.manufactureLocation}</span>
          </div>
        )}
        {item.material && item.material.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>material: </span>
            <span style={{ color: 'black' }}>{item.material.join(', ')}</span>
          </div>
        )}
        {item.acquisitionDate && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>acquisition date: </span>
            <span style={{ color: 'black' }}>{item.acquisitionDate}</span>
          </div>
        )}
        {item.acquisitionLocation && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>acquisition location: </span>
            <span style={{ color: 'black' }}>{item.acquisitionLocation}</span>
          </div>
        )}
        {item.storageLocation && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>storage location: </span>
            <span style={{ color: 'black' }}>{item.storageLocation}</span>
          </div>
        )}
        {item.captureDate && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>capture date: </span>
            <span style={{ color: 'black' }}>{item.captureDate}</span>
          </div>
        )}
        {getCaptureLocation() && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>capture location: </span>
            <span style={{ color: 'black' }}>{getCaptureLocation()}</span>
          </div>
        )}
        {item.captureDevice && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>capture device: </span>
            <span style={{ color: 'black' }}>{item.captureDevice}</span>
          </div>
        )}
        {item.captureApp && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>capture app: </span>
            <span style={{ color: 'black' }}>{item.captureApp}</span>
          </div>
        )}
        {item.captureMethod && (
          <div style={{ marginBottom: '20px' }}>
            <span style={{ color: 'black' }}>capture method: </span>
            <span style={{ color: 'black' }}>{item.captureMethod}</span>
          </div>
        )}

        {/* Custom fields */}
        {item.customFields && Object.entries(item.customFields).map(([key, value]) => {
          // Skip undefined or empty array values
          if (value === undefined || (Array.isArray(value) && value.length === 0)) {
            return null;
          }
          // Format the display value
          const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
          return (
            <div key={key} style={{ marginBottom: '20px' }}>
              <span style={{ color: 'black' }}>{key}: </span>
              <span style={{ color: 'black' }}>{displayValue}</span>
            </div>
          );
        })}

        {/* QR Code */}
        {qrCodeUrl && (
          <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
            <img src={qrCodeUrl} alt="QR Code" style={{ width: '256px', height: '256px' }} />
          </div>
        )}

        {/* URL and print date */}
        <div style={{ marginBottom: '20px' }}>{itemUrl}</div>
        <div style={{ marginBottom: '20px' }}>printed on {printDate}</div>
      </div>
    </>
  );
}

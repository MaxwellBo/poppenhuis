import { Collection, Item, User } from "../manifest";
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function QrCode(props: { item: Item, user: User, collection: Collection, onLoad?: () => void, context: 'print' | 'web' }) {
  const { item, user, collection } = props;
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;
  const backgroundColor = props.context === 'web' ? "#fdf5e6" : "#ffffff";

  useEffect(() => {
    QRCode.toDataURL(itemUrl, { 
      errorCorrectionLevel: 'low',
      margin: 0,
      width: 256,
      color: {
        light: backgroundColor
      }
    }, function (err, url) {
      if (!err && url) {
        setQrDataUrl(url);
      } else {
        console.error('QR Code generation failed:', err);
        setQrDataUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IiM5OTkiPkVycm9yPC90ZXh0Pjwvc3ZnPg==');
      }
    });
  }, [itemUrl, backgroundColor]);

  return qrDataUrl != '' ? (
    <img 
      key={itemUrl} 
      className={`qrcode ${props.context}`} 
      src={qrDataUrl} 
      alt="QR code" 
      onLoad={props.onLoad} 
    />) : <div className={`qrcode ${props.context}`} />;
}
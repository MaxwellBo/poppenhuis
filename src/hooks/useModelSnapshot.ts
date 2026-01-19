import { useState, useCallback } from 'react';
import { storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Converts a data URL to a Blob object
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function useModelSnapshot(ogImage?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(ogImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const snapshotModel = useCallback((modelViewerRef: React.RefObject<HTMLElement>) => {
    if (ogImage) {
      // If there's an OG image, use it
      setImageUrl(ogImage);
    } else if (modelViewerRef?.current) {
      // Otherwise, capture from model viewer
      const modelViewerCanvas = modelViewerRef.current.shadowRoot?.querySelector('canvas');
      if (modelViewerCanvas) {
        const dataUrl = modelViewerCanvas.toDataURL('image/png');
        console.log("Snapshot captured from model viewer");
        setImageUrl(dataUrl);
      }
    }
  }, [ogImage]);

  const uploadSnapshot = useCallback(async (
    userId: string,
    collectionId: string,
    itemId: string
  ): Promise<string | null> => {
    if (!imageUrl) {
      setUploadError('No snapshot to upload');
      return null;
    }

    // If it's already a URL (not a data URL), return it as-is
    if (!imageUrl.startsWith('data:')) {
      return imageUrl;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert data URL to blob
      const blob = dataUrlToBlob(imageUrl);
      
      // Upload to Firebase Storage
      const path = `og-images/${userId}/${collectionId}/${itemId}.png`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, blob);
      
      // Get the public URL
      const publicUrl = await getDownloadURL(fileRef);
      console.log("Snapshot uploaded to:", publicUrl);
      
      // Update local state with the public URL
      setImageUrl(publicUrl);
      
      return publicUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload snapshot';
      console.error('Upload error:', errorMsg);
      setUploadError(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [imageUrl]);

  const clearSnapshot = useCallback(() => {
    setImageUrl(null);
    setUploadError(null);
  }, []);

  return {
    imageUrl,
    isUploading,
    uploadError,
    snapshotModel,
    uploadSnapshot,
    clearSnapshot,
    setImageUrl,
  };
}

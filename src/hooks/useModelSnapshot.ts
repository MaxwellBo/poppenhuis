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

export function useModelSnapshot() {
  const [snapshotImageUrl, setSnapshotImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const snapshotModel = useCallback(async (modelViewerRef: React.RefObject<HTMLElement>): Promise<string | null> => {
    if (modelViewerRef?.current) {
      // Use model-viewer's built-in toDataURL method which handles WebGL buffer properly
      const modelViewer = modelViewerRef.current as any;
      if (typeof modelViewer.toDataURL === 'function') {
        const dataUrl = await modelViewer.toDataURL('image/png');
        console.log("Snapshot captured from model viewer");
        setSnapshotImageUrl(dataUrl);
        return dataUrl;
      } else {
        // Fallback: try to get canvas directly (may have issues with WebGL buffer)
        const modelViewerCanvas = modelViewerRef.current.shadowRoot?.querySelector('canvas');
        if (modelViewerCanvas) {
          const dataUrl = (modelViewerCanvas as HTMLCanvasElement).toDataURL('image/png');
          console.log("Snapshot captured from canvas fallback");
          setSnapshotImageUrl(dataUrl);
          return dataUrl;
        } else {
          console.warn("Model viewer canvas not found");
        }
      }
    } else {
      console.warn("Model viewer ref not available");
    }
    return null;
  }, []);

  const uploadSnapshot = useCallback(async (
    userId: string,
    collectionId: string,
    itemId: string
  ): Promise<string | null> => {
    if (!snapshotImageUrl) {
      setUploadError('No snapshot to upload');
      return null;
    }

    // If it's already a URL (not a data URL), return it as-is
    if (!snapshotImageUrl.startsWith('data:')) {
      return snapshotImageUrl;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert data URL to blob
      const blob = dataUrlToBlob(snapshotImageUrl);
      
      // Upload to Firebase Storage
      const path = `og-images/${userId}/${collectionId}/${itemId}.png`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, blob);
      
      // Get the public URL
      const publicUrl = await getDownloadURL(fileRef);
      console.log("Snapshot uploaded to:", publicUrl);
      
      // Update local state with the public URL
      setSnapshotImageUrl(publicUrl);
      
      return publicUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload snapshot';
      console.error('Upload error:', errorMsg);
      setUploadError(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [snapshotImageUrl]);

  const clearSnapshot = useCallback(() => {
    setSnapshotImageUrl(null);
    setUploadError(null);
  }, []);

  return {
    snapshotImageUrl,
    isUploading,
    uploadError,
    snapshotModel,
    uploadSnapshot,
    clearSnapshot,
  };
}

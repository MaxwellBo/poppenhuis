import { useState } from 'react';
import { useNavigate } from 'react-router';
import { rtdb, storage, auth } from '../firebase';
import { ref, get, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseUser } from '../manifest';
import JSZip from 'jszip';

interface UseFirebaseSubmitOptions {
  onError?: (error: string) => void;
}

/**
 * Extracts a .glb file from a zip archive.
 * Returns the .glb file if found, throws an error if not found or multiple .glb files exist.
 */
async function extractGlbFromZip(zipFile: File): Promise<File> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(zipFile);
  
  const glbFiles = Object.keys(contents.files).filter(filename => 
    filename.toLowerCase().endsWith('.glb') && !contents.files[filename].dir
  );
  
  if (glbFiles.length === 0) {
    throw new Error('No .glb file found in the zip archive');
  }
  
  if (glbFiles.length > 1) {
    throw new Error(`Zip archive contains multiple .glb files (${glbFiles.length}). Please include only one .glb file.`);
  }
  
  const glbFileName = glbFiles[0];
  const glbBlob = await contents.files[glbFileName].async('blob');
  
  // Create a new File object with just the filename (no path)
  const fileName = glbFileName.split('/').pop() || 'model.glb';
  return new File([glbBlob], fileName, { type: 'model/gltf-binary' });
}

export function useFirebaseSubmit(options: UseFirebaseSubmitOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const upsertUser = async (
    userId: string,
    formData: Record<string, any>,
    cleanFormData?: () => Record<string, any>
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!userId.trim() || !formData.name?.trim()) {
        throw new Error('User ID and Name are required and cannot be empty or contain only whitespace');
      }

      const dataToSave = cleanFormData ? cleanFormData() : formData;
      const userRef = ref(rtdb, `/${userId}`);

      await runTransaction(userRef, (currentData) => {
        const isCreating = currentData === null;
        
        const updatedUser: Partial<FirebaseUser> = {
          id: userId,
          name: dataToSave.name.trim(),
          ...dataToSave,
        };

        // Preserve collections when updating, initialize when creating
        updatedUser.collections = isCreating ? {} : (currentData.collections || {});
        
        // Always set source for Firebase users
        updatedUser.source = 'firebase';

        // Add creatorUid from current user when creating
        if (isCreating && auth.currentUser) {
          updatedUser.creatorUid = auth.currentUser.uid;
        } else if (!isCreating && currentData.creatorUid) {
          // Preserve creatorUid when updating
          updatedUser.creatorUid = currentData.creatorUid;
        }

        // When updating, set fields that existed in original but not in updated to null
        if (!isCreating) {
          Object.keys(currentData).forEach(key => {
            if (key !== 'collections' && key !== 'id' && !updatedUser.hasOwnProperty(key)) {
              // @ts-ignore dont care lol
              updatedUser[key] = null;
            }
          });
        }

        return updatedUser;
      });

      navigate(`/${userId}`);
    } catch (err: any) {
      console.error('Failed to save user:', err);
      const errorMsg = 'Failed to save user: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const upsertCollection = async (
    userId: string,
    collectionId: string,
    formData: Record<string, any>,
    cleanFormData?: () => Record<string, any>
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error('User ID is missing from URL');
      }
      if (!collectionId.trim() || !formData.name?.trim()) {
        throw new Error('Collection ID and Name are required and cannot be empty or contain only whitespace');
      }

      // Check if user exists
      const userRef = ref(rtdb, `/${userId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        throw new Error(`User '${userId}' does not exist`);
      }

      const dataToSave = cleanFormData ? cleanFormData() : formData;
      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);

      await runTransaction(collectionRef, (currentData) => {
        const isCreating = currentData === null;
        
        const updatedCollection: Record<string, any> = {
          id: collectionId,
          name: dataToSave.name.trim(),
          ...dataToSave,
        };

        // Preserve items when updating, initialize when creating
        updatedCollection.items = isCreating ? {} : (currentData.items || {});

        // When updating, set fields that existed in original but not in updated to null
        if (!isCreating) {
          Object.keys(currentData).forEach(key => {
            if (key !== 'items' && key !== 'id' && !updatedCollection.hasOwnProperty(key)) {
              updatedCollection[key] = null;
            }
          });
        }

        return updatedCollection;
      });

      navigate(`/${userId}/${collectionId}`);
    } catch (err: any) {
      console.error('Failed to save collection:', err);
      const errorMsg = 'Failed to save collection: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const upsertItem = async (
    userId: string,
    collectionId: string,
    itemId: string,
    formData: Record<string, any>,
    cleanFormData?: () => Record<string, any>
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error('User ID is missing from URL');
      }
      if (!collectionId) {
        throw new Error('Collection ID is missing from URL');
      }
      if (!itemId.trim() || !formData.name?.trim()) {
        throw new Error('Item ID and Name are required and cannot be empty or contain only whitespace');
      }

      // Check if user and collection exist
      const userRef = ref(rtdb, `/${userId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        throw new Error(`User '${userId}' does not exist`);
      }

      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);
      const collectionSnapshot = await get(collectionRef);
      if (!collectionSnapshot.exists()) {
        throw new Error(`Collection '${collectionId}' does not exist`);
      }

      // Extract model file if it exists in formData
      const modelFile = formData.model instanceof File ? formData.model : null;
      
      const dataToSave = cleanFormData ? cleanFormData() : formData;
      const itemRef = ref(rtdb, `/${userId}/collections/${collectionId}/items/${itemId}`);

      // First, save the item data
      await runTransaction(itemRef, (currentData) => {
        const isCreating = currentData === null;
        
        // Check if model is required for creation
        if (isCreating && !modelFile && !dataToSave.model) {
          throw new Error('Model file is required when creating an item');
        }

        const updatedItem: Record<string, any> = {
          id: itemId,
          name: dataToSave.name.trim(),
          ...dataToSave,
        };

        // Handle material field conversion
        if (dataToSave.material !== undefined && typeof dataToSave.material === 'string') {
          updatedItem.material = dataToSave.material.split(',').map((m: string) => m.trim()).filter(Boolean);
        }

        // When updating, preserve existing model if no new file provided
        if (!isCreating && !modelFile && currentData.model) {
          updatedItem.model = currentData.model;
        }

        // When updating, set fields that existed in original but not in updated to null
        if (!isCreating) {
          Object.keys(currentData).forEach(key => {
            if (key !== 'id' && !updatedItem.hasOwnProperty(key)) {
              updatedItem[key] = null;
            }
          });
        }

        return updatedItem;
      });

      // Upload model file after transaction if provided
      if (modelFile) {
        let fileToUpload = modelFile;
        
        // If the file is a zip, extract the .glb file from it
        if (modelFile.name.toLowerCase().endsWith('.zip')) {
          fileToUpload = await extractGlbFromZip(modelFile);
        }
        
        const path = `models/${userId}/${collectionId}/${itemId}.${fileToUpload.name.split('.').pop()}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, fileToUpload);
        const modelUrl = await getDownloadURL(fileRef);
        
        // Update the item with the new model URL
        await runTransaction(itemRef, (currentData) => {
          if (currentData === null) return null;
          return { ...currentData, model: modelUrl };
        });
      }

      // Upload og image if it's a data URL
      if (formData.og && typeof formData.og === 'string' && formData.og.startsWith('data:')) {
        const dataUrl = formData.og;
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        
        const path = `og-images/${userId}/${collectionId}/${itemId}.png`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, blob);
        const ogUrl = await getDownloadURL(fileRef);
        
        // Update the item with the new og URL
        await runTransaction(itemRef, (currentData) => {
          if (currentData === null) return null;
          return { ...currentData, og: ogUrl };
        });
      }

      navigate(`/${userId}/${collectionId}/${itemId}`);
    } catch (err: any) {
      console.error('Failed to save item:', err);
      const errorMsg = 'Failed to save item: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    setError,
    upsertUser,
    upsertCollection,
    upsertItem,
  };
}

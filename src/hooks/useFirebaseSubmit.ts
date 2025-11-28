import { useState } from 'react';
import { useNavigate } from 'react-router';
import { rtdb, storage } from '../firebase';
import { ref, get, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UseFirebaseSubmitOptions {
  onError?: (error: string) => void;
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
        
        const updatedUser: Record<string, any> = {
          id: userId,
          name: dataToSave.name.trim(),
          ...dataToSave,
        };

        // Preserve collections when updating, initialize when creating
        updatedUser.collections = isCreating ? {} : (currentData.collections || {});
        
        // Always set source for Firebase users
        updatedUser.source = 'firebase';

        // When updating, set fields that existed in original but not in updated to null
        if (!isCreating) {
          Object.keys(currentData).forEach(key => {
            if (key !== 'collections' && key !== 'id' && !updatedUser.hasOwnProperty(key)) {
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
    modelFile: File | null,
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
        const path = `models/${userId}/${collectionId}/${itemId}.${modelFile.name.split('.').pop()}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, modelFile);
        const modelUrl = await getDownloadURL(fileRef);
        
        // Update the item with the new model URL
        await runTransaction(itemRef, (currentData) => {
          if (currentData === null) return null;
          return { ...currentData, model: modelUrl };
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

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { rtdb, storage } from '../firebase';
import { ref, set, get, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UseFirebaseSubmitOptions {
  onError?: (error: string) => void;
}

export function useFirebaseSubmit(options: UseFirebaseSubmitOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createUser = async (
    userId: string,
    formData: Record<string, any>,
    cleanFormData: () => Record<string, any>
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!userId.trim() || !formData.name?.trim()) {
        throw new Error('User ID and Name are required and cannot be empty or contain only whitespace');
      }

      const cleanedData = cleanFormData();
      const userRef = ref(rtdb, `/${userId}`);
      const user = {
        id: userId,
        ...cleanedData,
        name: cleanedData.name.trim(),
        collections: {},
        source: 'firebase',
      };

      await set(userRef, user);
      navigate(`/${userId}`);
    } catch (err: any) {
      console.error('Failed to create user:', err);
      const errorMsg = 'Failed to create user: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const createCollection = async (
    userId: string,
    collectionId: string,
    formData: Record<string, any>,
    cleanFormData: () => Record<string, any>
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

      const cleanedData = cleanFormData();
      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);
      const collection = {
        id: collectionId,
        ...cleanedData,
        name: cleanedData.name.trim(),
        items: {},
      };

      await set(collectionRef, collection);
      navigate(`/${userId}/${collectionId}`);
    } catch (err: any) {
      console.error('Failed to create collection:', err);
      const errorMsg = 'Failed to create collection: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const createItem = async (
    userId: string,
    collectionId: string,
    itemId: string,
    formData: Record<string, any>,
    cleanFormData: () => Record<string, any>,
    modelFile: File | null
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
      if (!modelFile) {
        throw new Error('Model file is required');
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

      // Upload model file
      const path = `models/${userId}/${collectionId}/${itemId}.${modelFile.name.split('.').pop()}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, modelFile);
      const modelUrl = await getDownloadURL(fileRef);

      const cleanedData = cleanFormData();
      const itemRef = ref(rtdb, `/${userId}/collections/${collectionId}/items/${itemId}`);
      const item = {
        id: itemId,
        ...cleanedData,
        name: cleanedData.name.trim(),
        model: modelUrl,
      };

      await set(itemRef, item);
      navigate(`/${userId}/${collectionId}/${itemId}`);
    } catch (err: any) {
      console.error('Failed to create item:', err);
      const errorMsg = 'Failed to create item: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const updateUser = async (
    userId: string,
    formData: Record<string, any>
  ) => {
    setError('');
    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error('User ID is missing from URL');
      }
      if (!formData.name?.trim()) {
        throw new Error('Name is required and cannot be empty or contain only whitespace');
      }

      const userRef = ref(rtdb, `/${userId}`);

      await runTransaction(userRef, (currentData) => {
        if (currentData === null) {
          return;
        }

        const updatedUser = { ...formData };
        updatedUser.id = userId;
        updatedUser.name = formData.name.trim();
        
        if (formData.bio !== undefined && formData.bio !== '') {
          updatedUser.bio = formData.bio;
        }

        // Preserve collections
        updatedUser.collections = currentData.collections || {};

        // Set fields that existed in original but not in updated to null
        Object.keys(currentData).forEach(key => {
          if (key !== 'collections' && key !== 'id' && !updatedUser.hasOwnProperty(key)) {
            updatedUser[key] = null;
          }
        });

        return updatedUser;
      });

      navigate(`/${userId}`);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      const errorMsg = 'Failed to update user: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const updateCollection = async (
    userId: string,
    collectionId: string,
    formData: Record<string, any>
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
      if (!formData.name?.trim()) {
        throw new Error('Name is required and cannot be empty or contain only whitespace');
      }

      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);

      await runTransaction(collectionRef, (currentData) => {
        if (currentData === null) {
          return;
        }

        const updatedCollection = { ...formData };
        updatedCollection.id = collectionId;
        updatedCollection.name = formData.name.trim();
        
        if (formData.description !== undefined && formData.description !== '') {
          updatedCollection.description = formData.description;
        }

        // Preserve items
        updatedCollection.items = currentData.items || {};

        // Set fields that existed in original but not in updated to null
        Object.keys(currentData).forEach(key => {
          if (key !== 'items' && key !== 'id' && !updatedCollection.hasOwnProperty(key)) {
            updatedCollection[key] = null;
          }
        });

        return updatedCollection;
      });

      navigate(`/${userId}/${collectionId}`);
    } catch (err: any) {
      console.error('Failed to update collection:', err);
      const errorMsg = 'Failed to update collection: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  const updateItem = async (
    userId: string,
    collectionId: string,
    itemId: string,
    formData: Record<string, any>,
    modelFile: File | null
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
      if (!itemId) {
        throw new Error('Item ID is missing from URL');
      }
      if (!formData.name?.trim()) {
        throw new Error('Name is required and cannot be empty or contain only whitespace');
      }

      const updatedItem = { ...formData };

      // Handle model file upload if there's a file selected
      if (modelFile) {
        const path = `models/${userId}/${collectionId}/${itemId}.${modelFile.name.split('.').pop()}`;
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, modelFile);
        const modelUrl = await getDownloadURL(fileRef);
        updatedItem.model = modelUrl;
      } else if (!updatedItem.model) {
        throw new Error('Model is required');
      }

      // Handle material field conversion
      if (formData.material !== undefined && typeof formData.material === 'string') {
        updatedItem.material = formData.material.split(',').map((m: string) => m.trim()).filter(Boolean);
      }

      const itemRef = ref(rtdb, `/${userId}/collections/${collectionId}/items/${itemId}`);

      await runTransaction(itemRef, (currentData) => {
        if (currentData === null) {
          return;
        }

        updatedItem.id = itemId;
        updatedItem.name = formData.name.trim();

        // Set fields that existed in original but not in updated to null
        Object.keys(currentData).forEach(key => {
          if (key !== 'id' && !updatedItem.hasOwnProperty(key)) {
            updatedItem[key] = null;
          }
        });

        return updatedItem;
      });

      navigate(`/${userId}/${collectionId}/${itemId}`);
    } catch (err: any) {
      console.error('Failed to update item:', err);
      const errorMsg = 'Failed to update item: ' + (err.message || err.toString());
      setError(errorMsg);
      if (options.onError) options.onError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    error,
    setError,
    createUser,
    createCollection,
    createItem,
    updateUser,
    updateCollection,
    updateItem,
  };
}

import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function EditItemPage() {
  const { userId, collectionId, itemId } = useParams<{ userId: string; collectionId: string; itemId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [modelFile, setModelFile] = useState<File | null>(null);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, setError, updateItem } = useFirebaseSubmit();

  useEffect(() => {
    const loadItem = async () => {
      if (!userId) {
        setError("User ID is missing from URL");
        setIsLoading(false);
        return;
      }
      if (!collectionId) {
        setError("Collection ID is missing from URL");
        setIsLoading(false);
        return;
      }
      if (!itemId) {
        setError("Item ID is missing from URL");
        setIsLoading(false);
        return;
      }

      try {
        const itemRef = ref(rtdb, `/${userId}/collections/${collectionId}/items/${itemId}`);
        const itemSnapshot = await get(itemRef);
        
        if (!itemSnapshot.exists()) {
          setError(`Item '${itemId}' does not exist`);
          setIsLoading(false);
          return;
        }

        const itemData = itemSnapshot.val();
        setFormData({ ...itemData });
        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to load item:", err);
        setError("Failed to load item: " + (err.message || err.toString()));
        setIsLoading(false);
      }
    };

    loadItem();
  }, [userId, collectionId, itemId, setFormData, setError]);

  const handleModelFileSelect = (file: File | null) => {
    setModelFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateItem(userId || '', collectionId || '', itemId || '', formData, modelFile);
  };

  if (isLoading) {
    return (
      <article>
        <header>
          <h1>Loading...</h1>
        </header>
      </article>
    );
  }

  return (
    <FirebaseForm
      title={`Edit item: ${userId}/${collectionId}/${itemId}`}
      formData={formData}
      idField={{
        name: 'id',
        label: 'Item ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={ITEM_FIELDS}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Saving..." : "Save changes"}
      fileField={{
        label: 'Model file',
        accept: '.glb,.gltf',
        onChange: handleModelFileSelect,
      }}
    />
  );
}

import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function EditCollectionPage() {
  const { userId, collectionId } = useParams<{ userId: string; collectionId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, setError, updateCollection } = useFirebaseSubmit();

  useEffect(() => {
    const loadCollection = async () => {
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

      try {
        const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);
        const collectionSnapshot = await get(collectionRef);
        
        if (!collectionSnapshot.exists()) {
          setError(`Collection '${collectionId}' does not exist`);
          setIsLoading(false);
          return;
        }

        const collectionData = collectionSnapshot.val();
        setFormData({ ...collectionData });
        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to load collection:", err);
        setError("Failed to load collection: " + (err.message || err.toString()));
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [userId, collectionId, setFormData, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCollection(userId || '', collectionId || '', formData);
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
      title={`Edit collection: ${userId}/${collectionId}`}
      formData={formData}
      idField={{
        name: 'id',
        label: 'Collection ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={COLLECTION_FIELDS}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Saving..." : "Save changes"}
    />
  );
}

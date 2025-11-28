import React, { useState } from "react";
import { useParams } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function NewCollectionPage() {
  const { userId } = useParams<{ userId: string }>();
  const [collectionId, setCollectionId] = useState("");
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertCollection } = useFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertCollection(userId || '', collectionId, formData, cleanFormData);
  };

  return (
    <FirebaseForm
      title={`Create new collection${userId ? ` for ${userId}` : ""}`}
      formData={formData}
      idField={{
        name: 'collectionId',
        label: 'Collection ID',
        value: collectionId,
        onChange: setCollectionId,
      }}
      fields={COLLECTION_FIELDS}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Creating..." : "Create collection"}
    />
  );
}

import React, { useState } from "react";
import { useParams } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function NewItemPage() {
  const { userId, collectionId } = useParams<{ userId: string; collectionId: string }>();
  const [itemId, setItemId] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, createItem } = useFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createItem(userId || '', collectionId || '', itemId, formData, cleanFormData, modelFile);
  };

  return (
    <FirebaseForm
      title={`Create new item${userId && collectionId ? ` for ${userId}/${collectionId}` : ""}`}
      formData={formData}
      idField={{
        name: 'itemId',
        label: 'Item ID',
        value: itemId,
        onChange: setItemId,
      }}
      fields={ITEM_FIELDS}
      fileField={{
        label: 'Model file (glTF/GLB)',
        onChange: setModelFile,
        accept: '.glb,.gltf',
        required: true,
      }}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Creating..." : "Create item"}
    />
  );
}

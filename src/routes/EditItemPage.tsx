import React, { useState, useEffect } from "react";
import { useLoaderData } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadItem } from "../manifest";

export const loader = loadItem;

export default function EditItemPage() {
  const { item, collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [modelFile, setModelFile] = useState<File | null>(null);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertItem } = useFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...item });
  }, [item, setFormData]);

  const handleModelFileSelect = (file: File | null) => {
    setModelFile(file);
  };

  // Add file handler to the model field and filter out non-form fields
  const itemFieldsWithFileHandler = Object.values(ITEM_FIELD_SCHEMAS)
    .filter(field => !['usdzModel', 'poster', 'og'].includes(field.name))
    .map(field => 
      field.name === 'model' ? { 
        ...field, 
        onFileChange: handleModelFileSelect,
        selectedFileName: modelFile?.name 
      } : field
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertItem(user.id, collection.id, item.id, formData, modelFile);
  };

  return (
    <FirebaseForm
      title={`Edit item: ${user.id}/${collection.id}/${item.id}`}
      formData={formData}
      idField={{
        name: 'id',
        label: 'Item ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={itemFieldsWithFileHandler}
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

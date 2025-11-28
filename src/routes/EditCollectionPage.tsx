import React, { useEffect } from "react";
import { useLoaderData } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadCollection } from "../manifest";

export const loader = loadCollection;

export default function EditCollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertCollection } = useFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...collection });
  }, [collection, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertCollection(user.id, collection.id, formData);
  };

  return (
    <FirebaseForm
      title={`Edit collection: ${user.id}/${collection.id}`}
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

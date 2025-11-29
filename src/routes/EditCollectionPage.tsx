import React, { useEffect } from "react";
import { useLoaderData } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadCollection } from "../manifest-extras";
import { QueryPreservingLink } from "../components/QueryPreservingLink";

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
      header={<><QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / edit</>}
      formData={formData}
      idField={{
        name: 'id',
        label: 'collection ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={Object.values(COLLECTION_FIELD_SCHEMAS)}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "saving..." : "save changes"}
    />
  );
}

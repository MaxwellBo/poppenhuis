import React, { useState } from "react";
import { useLoaderData } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELD_SCHEMAS, loadUser } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";

export const loader = loadUser;

export default function NewCollectionPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
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
    await upsertCollection(user.id, collectionId, formData, cleanFormData);
  };

  return (
    <article>
      <Helmet><title>create collection - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / create a new collection
      </PageHeader>
      <FirebaseForm
        formData={formData}
      idField={{
        name: 'collectionId',
        label: 'collection ID',
        value: collectionId,
        onChange: setCollectionId,
      }}
      fields={Object.values(COLLECTION_FIELD_SCHEMAS)}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "creating..." : "create collection"}
    />
    </article>
  );
}

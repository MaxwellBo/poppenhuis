import React, { useState } from "react";
import { useParams } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { COLLECTION_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";

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
    <article>
      <Helmet><title>create collection - poppenhuis</title></Helmet>
      <PageHeader>
        {userId ? <><QueryPreservingLink to={`/${userId}`}>{userId}</QueryPreservingLink> / create a new collection</> : <>create a new collection</>}
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

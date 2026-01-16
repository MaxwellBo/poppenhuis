import React, { useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import Head from 'next/head';
import { FirebaseForm } from "../../src/components/FirebaseForm";
import { COLLECTION_FIELD_SCHEMAS } from "../../src/manifest";
import { useFirebaseForm } from "../../src/hooks/useFirebaseForm";
import { useNextFirebaseSubmit } from "../../src/hooks/useNextFirebaseSubmit";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../src/components/NextQueryPreservingLink";
import { PageHeader } from "../../src/components/PageHeader";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function NewCollectionPage() {
  const router = useRouter();
  const { userId } = router.query;
  const [collectionId, setCollectionId] = useState("");
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertCollection } = useNextFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertCollection(userId as string || '', collectionId, formData, cleanFormData);
  };

  return (
    <article>
      <Head><title>create collection - poppenhuis</title></Head>
      <PageHeader>
        {userId ? <><NextQueryPreservingLink to={`/${userId}`}>{userId}</NextQueryPreservingLink> / create a new collection</> : <>create a new collection</>}
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

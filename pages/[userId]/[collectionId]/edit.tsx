import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from 'next/head';
import { FirebaseForm } from "../../../src/components/FirebaseForm";
import { COLLECTION_FIELD_SCHEMAS } from "../../../src/manifest";
import { useFirebaseForm } from "../../../src/hooks/useFirebaseForm";
import { useNextFirebaseSubmit } from "../../../src/hooks/useNextFirebaseSubmit";
import { loadCollection } from "../../../src/manifest-extras";
import { useLoadCollection } from "../../../src/hooks/useLoadCollection";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../../src/components/NextQueryPreservingLink";
import { PageHeader } from "../../../src/components/PageHeader";
import type { Collection, User } from "../../../src/manifest";

interface EditCollectionPageProps {
  collection: Collection;
  user: User;
}

export const getServerSideProps: GetServerSideProps<EditCollectionPageProps> = async (context) => {
  const { userId, collectionId } = context.params as { userId: string; collectionId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { collection, user } = await loadCollection({ params: { userId, collectionId }, request });
    return {
      props: {
        collection,
        user,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function EditCollectionPage({ collection: initialCollection, user: initialUser }: EditCollectionPageProps) {
  const router = useRouter();
  const { userId, collectionId } = router.query;
  
  // Use client-side hook after initial load
  const { collection: clientCollection, user: clientUser, loading: loadingCollection } = useLoadCollection(
    userId as string,
    collectionId as string
  );
  
  // On first render (server-side), use the props. After hydration, use client-side data
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  const collection = isClient && clientCollection ? clientCollection : initialCollection;
  const user = isClient && clientUser ? clientUser : initialUser;
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertCollection } = useNextFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...collection });
  }, [collection, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertCollection(user.id, collection.id, formData);
  };

  return (
    <article>
      <Head><title>edit {collection.id} - poppenhuis</title></Head>
      <PageHeader>
        <NextQueryPreservingLink to={`/${user.id}`}>{user.name}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</NextQueryPreservingLink> / edit
      </PageHeader>
      <FirebaseForm
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
    </article>
  );
}

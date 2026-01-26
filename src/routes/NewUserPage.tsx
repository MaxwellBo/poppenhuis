import React, { useState } from "react";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/PageHeader";
import { QueryPreservingLink } from "../components/QueryPreservingLink";

export default function NewUserPage() {
  const [userId, setUserId] = useState("");
  const { isAuthenticated, loading } = useAuth();
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertUser } = useFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertUser(userId, formData, cleanFormData);
  };

  return (
    <article>
      <Helmet><title>create user - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / create a new user
      </PageHeader>
      {loading && <p>Loading authentication status...</p>}
      {!loading && !isAuthenticated && (
        <p className="short" style={{paddingBottom: "1ch"}}>You must be authenticated to create a user. Go to <QueryPreservingLink to="/auth">/auth</QueryPreservingLink>, create an account, and then attempt to make a user. A single account can manage many users.</p>
      )}
      <FirebaseForm
        formData={formData}
        idField={{
          name: 'userId',
          label: 'user ID',
          value: userId,
          onChange: setUserId,
        }}
        fields={Object.values(USER_FIELD_SCHEMAS)}
        onInputChange={handleInputChange}
        onAddField={handleAddField}
        onDeleteField={handleDeleteField}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        submitButtonText={isSubmitting ? "creating..." : "create user"}
      />
    </article>
  );
}

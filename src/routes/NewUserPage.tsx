import React, { useState } from "react";
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { PageHeader } from "../components/PageHeader";

export default function NewUserPage() {
  const [userId, setUserId] = useState("");
  
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
      <PageHeader>create a new user</PageHeader>
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

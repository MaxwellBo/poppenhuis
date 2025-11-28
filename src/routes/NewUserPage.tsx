import React, { useState } from "react";
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";

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
    <FirebaseForm
      header={<><QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / create a new user</>}
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
  );
}

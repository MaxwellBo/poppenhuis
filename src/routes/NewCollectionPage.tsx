import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { rtdb } from "../firebase";
import { ref, set, get } from "firebase/database";
import { FirebaseCollection } from "../manifest";

export default function NewCollectionPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [collectionId, setCollectionId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!userId) {
        throw new Error("User ID is missing from URL");
      }
      if (!collectionId.trim() || !name.trim()) {
        throw new Error("Collection ID and Name are required and cannot be empty or contain only whitespace");
      }

      // Check if user exists
      const userRef = ref(rtdb, `/${userId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        throw new Error(`User '${userId}' does not exist`);
      }

      // Create collection object
      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);
      const collection: FirebaseCollection = {
        id: collectionId,
        name: name.trim(),
        items: {},
      };

      if (description !== "") {
        collection.description = description;
      }

      await set(collectionRef, collection);
      navigate(`/${userId}/${collectionId}`);

    } catch (err: any) {
      console.error("Failed to create collection:", err);
      setError("Failed to create collection: " + (err.message || err.toString()));
      setIsSubmitting(false);
    }
  };

  return (
    <article>
      <header>
        <h1>Create new collection{userId ? ` for ${userId}` : ""}</h1>
      </header>
      <form onSubmit={handleSubmit} className="table-form">
        <div className="table-form-row">
          <label htmlFor="collectionId">Collection ID:</label>
          <input
            type="text"
            id="collectionId"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            placeholder="my-collection"
            pattern=".*\S.*"
            title="Collection ID cannot be empty or contain only whitespace"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Collection"
            pattern=".*\S.*"
            title="Name cannot be empty or contain only whitespace"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
        </div>
        {error && (
          <p style={{ color: "red" }}>
            Error: {error}
          </p>
        )}
        <div className="table-form-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create collection"}
          </button>
        </div>
      </form>
    </article>
  );
}

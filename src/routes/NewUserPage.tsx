import React, { useState } from "react";
import { useNavigate } from "react-router";
import { rtdb } from "../firebase";
import { ref, set } from "firebase/database";
import { FirebaseUser } from "../manifest";

export default function NewUserPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!userId.trim() || !name.trim()) {
        throw new Error("User ID and Name are required and cannot be empty or contain only whitespace");
      }

      // Create user object
      const userRef = ref(rtdb, `/${userId}`);
      const user: FirebaseUser = {
        id: userId,
        name: name.trim(),
        collections: {},
      };

      if (bio !== "") { 
        user.bio = bio
      }

      await set(userRef, user);
      navigate(`/${userId}`);

    } catch (err: any) {
      console.error("Failed to create user:", err);
      setError("Failed to create user: " + (err.message || err.toString()));
      setIsSubmitting(false);
    }
  };

  return (
    <article>
      <header>
        <h1>Create new user</h1>
      </header>
      <form onSubmit={handleSubmit} className="table-form">
        <div className="table-form-row">
          <label htmlFor="userId">User ID:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="john-doe"
            pattern=".*\S.*"
            title="User ID cannot be empty or contain only whitespace"
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
            placeholder="John Doe"
            pattern=".*\S.*"
            title="Name cannot be empty or contain only whitespace"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
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
            {isSubmitting ? "Creating..." : "Create user"}
          </button>
        </div>
      </form>
    </article>
  );
}

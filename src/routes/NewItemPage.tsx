import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { rtdb, storage } from "../firebase";
import { ref, set, get } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Item } from "../manifest";

export default function NewItemPage() {
  const navigate = useNavigate();
  const { userId, collectionId } = useParams<{ userId: string; collectionId: string }>();
  const [itemId, setItemId] = useState("");
  const [name, setName] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [description, setDescription] = useState("");
  const [formalName, setFormalName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [manufactureLocation, setManufactureLocation] = useState("");
  const [material, setMaterial] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [acquisitionLocation, setAcquisitionLocation] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [captureDate, setCaptureDate] = useState("");
  const [captureLocation, setCaptureLocation] = useState("");
  const [captureLatLon, setCaptureLatLon] = useState("");
  const [captureDevice, setCaptureDevice] = useState("");
  const [captureApp, setCaptureApp] = useState("");
  const [captureMethod, setCaptureMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModelFile(e.target.files[0]);
    }
  };

  const uploadModelFile = async (file: File): Promise<string> => {
    const path = `models/${userId}/${collectionId}/${itemId}.${file.name.split('.').pop()}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!userId) {
        throw new Error("User ID is missing from URL");
      }
      if (!collectionId) {
        throw new Error("Collection ID is missing from URL");
      }
      if (!itemId.trim() || !name.trim()) {
        throw new Error("Item ID and Name are required and cannot be empty or contain only whitespace");
      }
      if (!modelFile) {
        throw new Error("Model file is required");
      }

      // Check if user and collection exist
      const userRef = ref(rtdb, `/${userId}`);
      const userSnapshot = await get(userRef);
      if (!userSnapshot.exists()) {
        throw new Error(`User '${userId}' does not exist`);
      }

      const collectionRef = ref(rtdb, `/${userId}/collections/${collectionId}`);
      const collectionSnapshot = await get(collectionRef);
      if (!collectionSnapshot.exists()) {
        throw new Error(`Collection '${collectionId}' does not exist`);
      }

      // Upload model file
      const modelUrl = await uploadModelFile(modelFile);

      // Create item object
      const itemRef = ref(rtdb, `/${userId}/collections/${collectionId}/items/${itemId}`);
      const item: Item = {
        id: itemId,
        name: name.trim(),
        model: modelUrl,
      };

      // Add optional fields if provided
      if (alt !== "") item.alt = alt;
      if (description !== "") item.description = description;
      if (formalName !== "") item.formalName = formalName;
      if (releaseDate !== "") item.releaseDate = releaseDate;
      if (manufacturer !== "") item.manufacturer = manufacturer;
      if (manufactureDate !== "") item.manufactureDate = manufactureDate;
      if (manufactureLocation !== "") item.manufactureLocation = manufactureLocation;
      if (material !== "") item.material = material.split(",").map(m => m.trim()).filter(Boolean);
      if (acquisitionDate !== "") item.acquisitionDate = acquisitionDate;
      if (acquisitionLocation !== "") item.acquisitionLocation = acquisitionLocation;
      if (storageLocation !== "") item.storageLocation = storageLocation;
      if (captureDate !== "") item.captureDate = captureDate;
      if (captureLocation !== "") item.captureLocation = captureLocation;
      if (captureLatLon !== "") item.captureLatLon = captureLatLon;
      if (captureDevice !== "") item.captureDevice = captureDevice;
      if (captureApp !== "") item.captureApp = captureApp;
      if (captureMethod !== "") item.captureMethod = captureMethod;

      await set(itemRef, item);
      navigate(`/${userId}/${collectionId}/${itemId}`);

    } catch (err: any) {
      console.error("Failed to create item:", err);
      setError("Failed to create item: " + (err.message || err.toString()));
      setIsSubmitting(false);
    }
  };

  return (
    <article>
      <header>
        <h1>Create new item{userId && collectionId ? ` for ${userId}/${collectionId}` : ""}</h1>
      </header>
      <form onSubmit={handleSubmit} className="table-form">
        <div className="table-form-row">
          <label htmlFor="itemId">Item ID:</label>
          <input
            type="text"
            id="itemId"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            placeholder="my-item"
            pattern=".*\S.*"
            title="Item ID cannot be empty or contain only whitespace"
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
            placeholder="My Item"
            pattern=".*\S.*"
            title="Name cannot be empty or contain only whitespace"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="model">Model file (glTF/GLB):</label>
          <input
            type="file"
            id="model"
            accept=".glb,.gltf"
            onChange={handleModelFileChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="alt">Alt text:</label>
          <input
            type="text"
            id="alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Description for screen readers"
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
        <div className="table-form-row">
          <label htmlFor="formalName">Formal Name:</label>
          <input
            type="text"
            id="formalName"
            value={formalName}
            onChange={(e) => setFormalName(e.target.value)}
            placeholder="Model number or scientific name"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="releaseDate">Release Date:</label>
          <input
            type="text"
            id="releaseDate"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="manufacturer">Manufacturer:</label>
          <input
            type="text"
            id="manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            placeholder="Company name"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="manufactureDate">Manufacture Date:</label>
          <input
            type="text"
            id="manufactureDate"
            value={manufactureDate}
            onChange={(e) => setManufactureDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="manufactureLocation">Manufacture Location:</label>
          <input
            type="text"
            id="manufactureLocation"
            value={manufactureLocation}
            onChange={(e) => setManufactureLocation(e.target.value)}
            placeholder="City, Country"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="material">Material:</label>
          <input
            type="text"
            id="material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="plastic, metal, wood (comma separated)"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="acquisitionDate">Acquisition Date:</label>
          <input
            type="text"
            id="acquisitionDate"
            value={acquisitionDate}
            onChange={(e) => setAcquisitionDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="acquisitionLocation">Acquisition Location:</label>
          <input
            type="text"
            id="acquisitionLocation"
            value={acquisitionLocation}
            onChange={(e) => setAcquisitionLocation(e.target.value)}
            placeholder="City, Country"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="storageLocation">Storage Location:</label>
          <input
            type="text"
            id="storageLocation"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            placeholder="Shelf, room, etc."
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureDate">Capture Date:</label>
          <input
            type="text"
            id="captureDate"
            value={captureDate}
            onChange={(e) => setCaptureDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureLocation">Capture Location:</label>
          <input
            type="text"
            id="captureLocation"
            value={captureLocation}
            onChange={(e) => setCaptureLocation(e.target.value)}
            placeholder="City, Country"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureLatLon">Capture Lat/Lon:</label>
          <input
            type="text"
            id="captureLatLon"
            value={captureLatLon}
            onChange={(e) => setCaptureLatLon(e.target.value)}
            placeholder="40.7128, -74.0060"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureDevice">Capture Device:</label>
          <input
            type="text"
            id="captureDevice"
            value={captureDevice}
            onChange={(e) => setCaptureDevice(e.target.value)}
            placeholder="iPhone 15 Pro"
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureApp">Capture App:</label>
          <input
            type="text"
            id="captureApp"
            value={captureApp}
            onChange={(e) => setCaptureApp(e.target.value)}
            placeholder="Polycam, RealityScan, etc."
            disabled={isSubmitting}
          />
        </div>
        <div className="table-form-row">
          <label htmlFor="captureMethod">Capture Method:</label>
          <input
            type="text"
            id="captureMethod"
            value={captureMethod}
            onChange={(e) => setCaptureMethod(e.target.value)}
            placeholder="LiDAR, Photogrammetry, etc."
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
            {isSubmitting ? "Creating..." : "Create item"}
          </button>
        </div>
      </form>
    </article>
  );
}

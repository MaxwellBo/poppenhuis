import { FieldConfig } from "../components/FirebaseForm";

// User fields
export const USER_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'John Doe' },
  { name: 'bio', label: 'Bio', type: 'textarea' },
];

// Collection fields
export const COLLECTION_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'My Collection' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

// Item fields
export const ITEM_FIELDS: FieldConfig[] = [
  { name: 'name', label: 'Name', required: true, placeholder: 'My Item' },
  { name: 'alt', label: 'Alt text', placeholder: 'Description for screen readers' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'formalName', label: 'Formal Name', placeholder: 'Model number or scientific name' },
  { name: 'releaseDate', label: 'Release Date', placeholder: 'YYYY-MM-DD' },
  { name: 'manufacturer', label: 'Manufacturer', placeholder: 'Company name' },
  { name: 'manufactureDate', label: 'Manufacture Date', placeholder: 'YYYY-MM-DD' },
  { name: 'manufactureLocation', label: 'Manufacture Location', placeholder: 'City, Country' },
  { name: 'material', label: 'Material', placeholder: 'plastic, metal, wood (comma separated)' },
  { name: 'acquisitionDate', label: 'Acquisition Date', placeholder: 'YYYY-MM-DD' },
  { name: 'acquisitionLocation', label: 'Acquisition Location', placeholder: 'City, Country' },
  { name: 'storageLocation', label: 'Storage Location', placeholder: 'Shelf, room, etc.' },
  { name: 'captureDate', label: 'Capture Date', placeholder: 'YYYY-MM-DD' },
  { name: 'captureLocation', label: 'Capture Location', placeholder: 'City, Country' },
  { name: 'captureLatLon', label: 'Capture Lat/Lon', placeholder: '40.7128, -74.0060' },
  { name: 'captureDevice', label: 'Capture Device', placeholder: 'iPhone 15 Pro' },
  { name: 'captureApp', label: 'Capture App', placeholder: 'Polycam, RealityScan, etc.' },
  { name: 'captureMethod', label: 'Capture Method', placeholder: 'LiDAR, Photogrammetry, etc.' },
];

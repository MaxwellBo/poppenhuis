import { Collection, Item, ITEM_FIELD_DESCRIPTIONS, loadItem, User } from "../manifest";
import { db, storage } from "../firebase";
import React from "react";
import { useLoaderData, useSearchParams } from "react-router";
import { ItemCards } from '../components/ItemCards';
import { ItemCard } from '../components/ItemCard';
import { metaForItem } from "../meta";
import Markdown from "react-markdown";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { QrCode } from "../components/QrCode";
import { AFrameScene } from "../components/AFrameScene";
import { doc, updateDoc, deleteField } from "firebase/firestore";

export const loader = loadItem

export default function ItemPage() {
  const { item, user, collection, users } = useLoaderData() as Awaited<ReturnType<typeof loadItem>>;
  const [isEditing, setIsEditing] = React.useState(false);

  const currentIndex = collection.items.findIndex(i => i.id === item.id);
  const previousItem: Item = currentIndex > 0 
    ? collection.items[currentIndex - 1] 
    : collection.items[collection.items.length - 1];
  const nextItem: Item = currentIndex < collection.items.length - 1 
    ? collection.items[currentIndex + 1] 
    : collection.items[0];

  const previousItemIsLast = currentIndex === 0;
  const nextItemIsFirst = currentIndex === collection.items.length - 1;

  const githubManifestCodeSearchUrl = `https://github.com/search?q=repo%3AMaxwellBo%2Fpoppenhuis+%22id%3A+%5C%22${item.id}%5C%22%22&type=code`;

  const [searchParams, setSearchParams] = useSearchParams();
  const renderAFrameScene = searchParams.get("vr") === "true";

  const handleVRToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (e.target.checked) {
      newSearchParams.set("vr", "true");
    } else {
      newSearchParams.delete("vr");
    }
    setSearchParams(newSearchParams);
  };

 

  return (
    <article className='item-page'>
      <HelmetMeta meta={metaForItem(item, collection, user)} />
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.id}</QueryPreservingLink> / {item.name} <span className='index'>({collection.items.indexOf(item) + 1})</span>
        </h1>
      </header>
      <div className='bento'>
        <div id="previous">
          <ItemCard 
            item={previousItem} 
            collection={collection} 
            showIndex={true}
            user={user} 
            triggerKey="h" 
            altName={previousItemIsLast ? "↻ go to end" : "← previous"} 
            size='small' />
        </div>
        <div id="model">
          {renderAFrameScene
            ? <AFrameScene users={users} startingItem={item} />
            : <ModelViewerWrapper item={item} size='responsive-big' />}
          <label className="vr-toggle">
            <input 
              type="checkbox" 
              checked={renderAFrameScene} 
              onChange={handleVRToggle}
            />
            VR?
          </label>
        </div>
        <div id="description" className="description ugc"><Markdown>{item.description}</Markdown></div>
        <div id="meta">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span></span>
            <button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'cancel?' : 'edit?'}
            </button>
          </div>
          {isEditing ? (
            <EditableDescriptionList 
              item={item} 
              collection={collection} 
              user={user} 
            />
          ) : (
            <DescriptionList item={item} collection={collection} user={user} />
          )}
          <br />
          {navigator.share &&
            <button className='mr-1ch' onClick={() =>
              navigator.share({
                title: item.name,
                text: item.description ?? 'a digital dollhouse',
                url: window.location.href
              })}>
              share?
            </button>}
          <QrCode item={item} user={user} collection={collection} context="web" />
          <QueryPreservingLink className="action-link" to={`/${user.id}/${collection.id}/${item.id}/label`}>print label</QueryPreservingLink>, <a href={githubManifestCodeSearchUrl}>source</a>
        </div>
        <div id="next">
          <ItemCard 
            item={nextItem} 
            collection={collection} 
            showIndex={true}
            user={user} triggerKey="l" 
            altName={nextItemIsFirst ? "back to start ↺" : "next →"} 
            size='small' />
        </div>
        <div id="cards">
          <ItemCards collection={collection} user={user} highlighted={item.id} limit={6} />
        </div>
      </div>
    </article>
  );
}

function DescriptionList(props: { item: Item; collection: Collection; user: User; }) {
  const { item } = props;
  const { captureLocation, captureLatLon, } = props.item;

  let location;
  if (captureLocation && captureLatLon) {
    location = `${captureLocation} (${captureLatLon})`;
  } else if (captureLocation) {
    location = captureLocation;
  } else if (captureLatLon) {
    location = captureLatLon;
  }

  const customFields = props.item.customFields ? Object.entries(props.item.customFields).map(([key, value]) => {
    return (
      <React.Fragment key={key}>
        <dt>{key}</dt>
        <dd><Markdown>{value}</Markdown></dd>
      </React.Fragment>
    );
  }) : null;

  return (
    <dl>
      {customFields}
      {customFields && <hr className="break" />}
      {customFields && <hr className="break" />}
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.formalName}>formal name</abbr></dt>
      <dd>{item.formalName}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.alt}>alt</abbr></dt>
      <dd>{item.alt}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.releaseDate}>release date</abbr></dt>
      <dd>{item.releaseDate}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>manufacturer</dt>
      <dd>{item.manufacturer}</dd>
      <dt>manufacture date</dt>
      <dd>{item.manufactureDate}</dd>
      <dt>manufacture location</dt>
      <dd>{item.manufactureLocation}</dd>
      <dt>material</dt>
      <dd className='list'>{item.material?.join(", ")}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>acquisition date</dt>
      <dd>{item.acquisitionDate}</dd>
      <dt>acquisition location</dt>
      <dd>{item.acquisitionLocation}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>storage location</dt>
      <dd>{item.storageLocation}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>capture date</dt>
      <dd>{item.captureDate}</dd>
      <dt>capture location</dt>
      <dd>{location}</dd>
      <dt>capture device</dt>
      <dd>{item.captureDevice}</dd>
      <dt>capture app</dt>
      <dd>{item.captureApp}</dd>
      <dt>capture method</dt>
      <dd>{item.captureMethod}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.model}>model</abbr></dt>
      <dd className='ellipsis'><a href={item.model}>{item.model}</a></dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.og}>Open Graph image</abbr></dt>
      <dd className='ellipsis'><a href={item.og}>{item.og}</a></dd>
    </dl>
  );
}


function EditableDescriptionList(props: { item: Item; collection: Collection; user: User; }) {
  const [formData, setFormData] = React.useState<Record<string, any>>(() => {
    const initialData: Record<string, any> = {};
    
    // Only set fields that are defined in the item
    if (props.item.formalName !== undefined) initialData.formalName = props.item.formalName;
    if (props.item.alt !== undefined) initialData.alt = props.item.alt;
    if (props.item.releaseDate !== undefined) initialData.releaseDate = props.item.releaseDate;
    if (props.item.manufacturer !== undefined) initialData.manufacturer = props.item.manufacturer;
    if (props.item.manufactureDate !== undefined) initialData.manufactureDate = props.item.manufactureDate;
    if (props.item.manufactureLocation !== undefined) initialData.manufactureLocation = props.item.manufactureLocation;
    if (props.item.material !== undefined) initialData.material = props.item.material.join(", ");
    if (props.item.acquisitionDate !== undefined) initialData.acquisitionDate = props.item.acquisitionDate;
    if (props.item.acquisitionLocation !== undefined) initialData.acquisitionLocation = props.item.acquisitionLocation;
    if (props.item.storageLocation !== undefined) initialData.storageLocation = props.item.storageLocation;
    if (props.item.captureDate !== undefined) initialData.captureDate = props.item.captureDate;
    if (props.item.captureLocation !== undefined) initialData.captureLocation = props.item.captureLocation;
    if (props.item.captureLatLon !== undefined) initialData.captureLatLon = props.item.captureLatLon;
    if (props.item.captureDevice !== undefined) initialData.captureDevice = props.item.captureDevice;
    if (props.item.captureApp !== undefined) initialData.captureApp = props.item.captureApp;
    if (props.item.captureMethod !== undefined) initialData.captureMethod = props.item.captureMethod;
    if (props.item.model !== undefined) initialData.model = props.item.model;
    if (props.item.og !== undefined) initialData.og = props.item.og;
    
    return initialData;
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || undefined }));
  };

  const handleAddField = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleDeleteField = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedItem = { ...formData };
    
    if (formData.material !== undefined) {
      updatedItem.material = formData.material.split(",").map((m: string) => m.trim()).filter(Boolean);
    }
    
    const itemRef = doc(db, "users2", props.user.id, "collections", props.collection.id, "items", props.item.id);
    
    const updates: Record<string, any> = {};
    
    Object.entries(updatedItem).forEach(([key, value]) => {
      if (value === undefined) {
        updates[key] = deleteField();
      } else {
        updates[key] = value;
      }
    });
    
    await updateDoc(itemRef, updates);
    window.location.reload();
  };

  const renderField = (label: string, field: string, description?: string) => (
    <React.Fragment key={field}>
      <dt>
        {description ? <abbr title={description}>{label}</abbr> : label}
        {formData.hasOwnProperty(field) && formData[field] !== undefined && (
          <button type="button" onClick={() => handleDeleteField(field)} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
            ✕
          </button>
        )}
      </dt>
      <dd>
        {formData.hasOwnProperty(field) && formData[field] !== undefined ? (
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={field === 'material' ? 'comma separated' : ''}
          />
        ) : (
          <button type="button" onClick={() => handleAddField(field)}>
            + Add {label.toLowerCase()}
          </button>
        )}
      </dd>
    </React.Fragment>
  );

  return (
    <form onSubmit={handleSubmit}>
      <dl>
        {renderField('formal name', 'formalName', ITEM_FIELD_DESCRIPTIONS.formalName)}
        {renderField('alt', 'alt', ITEM_FIELD_DESCRIPTIONS.alt)}
        {renderField('release date', 'releaseDate', ITEM_FIELD_DESCRIPTIONS.releaseDate)}
        <hr className="break" />
        <hr className="break" />
        {renderField('manufacturer', 'manufacturer')}
        {renderField('manufacture date', 'manufactureDate')}
        {renderField('manufacture location', 'manufactureLocation')}
        {renderField('material', 'material')}
        <hr className="break" />
        <hr className="break" />
        {renderField('acquisition date', 'acquisitionDate')}
        {renderField('acquisition location', 'acquisitionLocation')}
        <hr className="break" />
        <hr className="break" />
        {renderField('storage location', 'storageLocation')}
        <hr className="break" />
        <hr className="break" />
        {renderField('capture date', 'captureDate')}
        {renderField('capture location', 'captureLocation')}
        {renderField('capture lat/lon', 'captureLatLon')}
        {renderField('capture device', 'captureDevice')}
        {renderField('capture app', 'captureApp')}
        {renderField('capture method', 'captureMethod')}
        <hr className="break" />
        <hr className="break" />
        {renderField('model', 'model', ITEM_FIELD_DESCRIPTIONS.model)}
        {renderField('Open Graph image', 'og', ITEM_FIELD_DESCRIPTIONS.og)}
      </dl>
      <button type="submit">save?</button>
    </form>
  );
}

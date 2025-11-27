import { Collection, Item, ITEM_FIELD_DESCRIPTIONS, loadItem, User } from "../manifest";
import { rtdb, storage } from "../firebase";
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
import { PrintToCatPrinterButton } from "../components/PrintToCatPrinterButton";
import * as yaml from 'js-yaml';
import { ref as dbRef, update, get, runTransaction } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / {item.name} <span className='index'>({collection.items.indexOf(item) + 1})</span>
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
            : <ModelViewerWrapper item={item} size='responsive-big' />
          }
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
          {user.id && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
              <button onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'cancel editing' : 'edit?'}
              </button>
            </div>
          )}
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
          <QrCodeAndLinksAndButtons item={item} collection={collection} user={user} />
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
      {/* <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.alt}>alt</abbr></dt>
      <dd>{item.alt}</dd> */}
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
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.model}>glTF model</abbr></dt>
      <dd className='ellipsis'><a href={item.model}>{item.model}</a></dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.usdzModel}>USDZ model</abbr></dt>
      <dd className='ellipsis'>{item.usdzModel && <a href={item.usdzModel}>{item.usdzModel}</a>}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.og}>Open Graph image</abbr></dt>
      <dd className='ellipsis'>{item.og && <a href={item.og}>{item.og}</a>}</dd>
    </dl>
  );
}

function QrCodeAndLinksAndButtons(props: { item: Item; collection: Collection; user: User; }) {
  const { item, collection, user } = props;

  const githubManifestCodeSearchUrl = `https://github.com/search?q=repo%3AMaxwellBo%2Fpoppenhuis+%22id%3A+%5C%22${item.id}%5C%22%22&type=code`;

  const itemYaml = yaml.dump(item);

  const editYamlUrl = `https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}&yaml-template=${encodeURIComponent(itemYaml)}`;

  return (
    <div className="qrcode-and-links-and-buttons">
      <div id="qrcode">
        <QrCode item={item} user={user} collection={collection} context="web" />
      </div>
      <div id="links">
        <QueryPreservingLink className="action-link" to={`/${user.id}/${collection.id}/${item.id}/label`}>print label</QueryPreservingLink>, <QueryPreservingLink className="action-link" to={`/${user.id}/${collection.id}/${item.id}/embed`}>embed</QueryPreservingLink>, <QuicklookLink item={item} />, <a href={githubManifestCodeSearchUrl}>source</a>{user.source !== 'firebase' && <>, <a href={editYamlUrl}>edit</a></>}
      </div>
      <div id="buttons">
        {navigator.share &&
          <button onClick={() =>
            navigator.share({
              title: item.name,
              text: item.description ?? 'a digital dollhouse',
              url: window.location.href
            })}>
            share?
          </button>}
        <PrintToCatPrinterButton item={item} collection={collection} user={user} />
      </div>
    </div>
  )
}

function QuicklookLink(props: { item: Item; }) {
  const { item } = props;

  const a = document.createElement("a");
  const supportsQuickLook = a.relList.supports("ar");

  if (!supportsQuickLook) {
    return (
      <s>
        <abbr title="Apple AR Quick Look requires Safari on iPhone/iPad (iOS 12+) or Safari on macOS (I think...)">
          <span style={{ whiteSpace: 'nowrap' }}>Apple AR Quick Look</span>
        </abbr>
      </s>
    );
  }

  if (!item.usdzModel) {
    return (
      <s>
        <abbr title="This item has no .usdz model — Apple Quick Look requires a .usdz asset">
          <span style={{ whiteSpace: 'nowrap' }}>Apple AR Quick Look</span>
        </abbr>
      </s>
    );
  }

  return (
    <a href={item.usdzModel} >
      <span style={{ whiteSpace: 'nowrap' }}>Apple AR Quick Look</span>
    </a>
  );
}

function EditableDescriptionList(props: { item: Item; collection: Collection; user: User; }) {
  const { item, collection, user } = props;
  const [formData, setFormData] = React.useState<Record<string, any>>({ ...item });

  const [modelFile, setModelFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value || undefined }));
  };

  const handleAddField = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleDeleteField = (field: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[field];
      return newData;
    });
  };

  const handleModelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setModelFile(e.target.files[0]);
    }
  };

  const uploadModelFile = async (file: File): Promise<string> => {
    const path = `models/${props.user.id}/${props.collection.id}/${props.item.id}.${file.name.split('.').pop()}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const updatedItem = { ...formData };
      
      if (formData.material !== undefined) {
        updatedItem.material = formData.material.split(",").map((m: string) => m.trim()).filter(Boolean);
      }

      // Handle model file upload if there's a file selected
      if (modelFile) {
        const modelUrl = await uploadModelFile(modelFile);
        updatedItem.model = modelUrl;
      }

      const itemRef = dbRef(rtdb, `users/${user.id}/collections/${collection.id}/items/${item.id}`);

      await runTransaction(itemRef, (currentData) => {
        if (currentData === null) {
          return
        }

        // Then, for fields that existed in the original item but not in updatedItem, set them to null
        Object.keys(props.item).forEach(key => {
          if (!updatedItem.hasOwnProperty(key)) {
        updatedItem[key] = null;
          }
        });

        updatedItem.id = props.item.id; // Ensure the item ID remains unchanged
        updatedItem.name = props.item.name; // Ensure the item name remains unchanged

        return updatedItem;
      });

      window.location.reload();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderField = (label: string, field: string, description?: string) => (
    <React.Fragment key={field}>
      <dt>
        {description ? <abbr title={description}>{label}</abbr> : label}
      </dt>
      <dd>
        {formData.hasOwnProperty(field) && formData[field] !== undefined ? (
          <>
            <input
              type="text"
              value={formData[field] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={field === 'material' ? 'comma separated' : ''}
            />
            <button type="button" onClick={() => handleDeleteField(field)} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
              ✕
            </button>
          </>
        ) : (
          <button type="button" onClick={() => handleAddField(field)}>
            + Add {label.toLowerCase()}
          </button>
        )}
      </dd>
    </React.Fragment>
  );

  const renderModelField = () => (
    <React.Fragment key="model">
      <dt>
        <abbr title={ITEM_FIELD_DESCRIPTIONS.model}>model</abbr>
      </dt>
      <dd>
        {formData.hasOwnProperty('model') && formData.model !== undefined ? (
          <>
            <input
              type="text"
              value={formData.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
            />
            <button type="button" onClick={() => handleDeleteField('model')} style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
              ✕
            </button>
          </>
        ) : (
          <input
            type="file"
            accept=".glb,.gltf"
            onChange={handleModelFileChange}
            style={{ marginBottom: '0.5rem' }}
          />
        )}
      </dd>
    </React.Fragment>
  );

  return (
    <form onSubmit={handleSubmit}>
      <dl>
        {renderField('name', 'name')}
        {renderField('id', 'id')}
        {renderField('description', 'description')}
        <hr className="break" />
        <hr className="break" />
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
        {renderModelField()}
      </dl>
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'uploading...' : 'save'}
      </button>
    </form>
  );
}

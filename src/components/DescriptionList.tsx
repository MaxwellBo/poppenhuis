import React from 'react';
import Markdown from 'react-markdown';
import { Item, Collection, User, ITEM_FIELD_SCHEMAS } from '../manifest';

interface DescriptionListProps {
  item: Item;
  collection: Collection;
  user: User;
  hideUrls?: boolean;
}

export function DescriptionList(props: DescriptionListProps) {
  const { hideUrls = false } = props;
  const { item } = props;
  const { captureLocation, captureLatLon } = props.item;

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
      <dt><abbr title={ITEM_FIELD_SCHEMAS.formalName.description}>{ITEM_FIELD_SCHEMAS.formalName.label}</abbr></dt>
      <dd>{item.formalName}</dd>
      {/* <dt><abbr title={ITEM_FIELD_SCHEMAS.alt.description}>{ITEM_FIELD_SCHEMAS.alt.label}</abbr></dt>
      <dd>{item.alt}</dd> */}
      <dt><abbr title={ITEM_FIELD_SCHEMAS.releaseDate.description}>{ITEM_FIELD_SCHEMAS.releaseDate.label}</abbr></dt>
      <dd>{item.releaseDate}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>{ITEM_FIELD_SCHEMAS.manufacturer.label}</dt>
      <dd>{item.manufacturer}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.manufactureDate.label}</dt>
      <dd>{item.manufactureDate}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.manufactureLocation.label}</dt>
      <dd>{item.manufactureLocation}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.material.label}</dt>
      <dd className='list'>{item.material?.join(", ")}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>{ITEM_FIELD_SCHEMAS.acquisitionDate.label}</dt>
      <dd>{item.acquisitionDate}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.acquisitionLocation.label}</dt>
      <dd>{item.acquisitionLocation}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>{ITEM_FIELD_SCHEMAS.storageLocation.label}</dt>
      <dd>{item.storageLocation}</dd>
      <hr className="break" />
      <hr className="break" />
      <dt>{ITEM_FIELD_SCHEMAS.captureDate.label}</dt>
      <dd>{item.captureDate}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.captureLocation.label}</dt>
      <dd>{location}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.captureDevice.label}</dt>
      <dd>{item.captureDevice}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.captureApp.label}</dt>
      <dd>{item.captureApp}</dd>
      <dt>{ITEM_FIELD_SCHEMAS.captureMethod.label}</dt>
      <dd>{item.captureMethod}</dd>
      {!hideUrls && (
        <>
          <hr className="break" />
          <hr className="break" />
          <dt><abbr title={ITEM_FIELD_SCHEMAS.model.description}>{ITEM_FIELD_SCHEMAS.model.label}</abbr></dt>
          <dd className='ellipsis'><a href={item.model}>{item.model}</a></dd>
          <dt><abbr title={ITEM_FIELD_SCHEMAS.usdzModel.description}>{ITEM_FIELD_SCHEMAS.usdzModel.label}</abbr></dt>
          <dd className='ellipsis'>{item.usdzModel && <a href={item.usdzModel}>{item.usdzModel}</a>}</dd>
          <dt><abbr title={ITEM_FIELD_SCHEMAS.og.description}>{ITEM_FIELD_SCHEMAS.og.label}</abbr></dt>
          <dd className='ellipsis'>{item.og && <a href={item.og}>{item.og}</a>}</dd>
        </>
      )}
      {customFields && <hr className="break" />}
      {customFields && <hr className="break" />}
      {customFields}
    </dl>
  );
}

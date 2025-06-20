import { Collection, Item, ITEM_FIELD_DESCRIPTIONS, loadItem, User } from "../manifest";
import React from "react";
import { useLoaderData } from "react-router";
import { ItemCards } from '../components/ItemCards';
import { ItemCard } from '../components/ItemCard';
import { metaForItem } from "../meta";
import Markdown from "react-markdown";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { QrCode } from "../components/QrCode";

export const loader = loadItem

export default function ItemPage() {
  const { item, user, collection } = useLoaderData() as Awaited<ReturnType<typeof loadItem>>;

  const previousItem: Item | undefined = collection.items.find((_, index) => collection.items[index + 1]?.id === item.id);
  const nextItem: Item | undefined = collection.items.find((_, index) => collection.items[index - 1]?.id === item.id);

  const githubManifestCodeSearchUrl = `https://github.com/search?q=repo%3AMaxwellBo%2Fpoppenhuis+%22id%3A+%5C%22${item.id}%5C%22%22&type=code`;

  return (
    <article className='item-page'>
      <HelmetMeta meta={metaForItem(item, collection, user)} />
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.id}</QueryPreservingLink> / {item.name}
        </h1>
      </header>
      <div className='bento'>
        <div id="previous">
          {previousItem && <ItemCard item={previousItem} collection={collection} user={user} triggerKey="a" altName="← previous" size='small' />}
        </div>
        <div id="model">
          <ModelViewerWrapper item={item} size='responsive-big' />
        </div>
        <div id="description" className="description"><Markdown>{item.description}</Markdown></div>
        <div id="meta">
          <DescriptionList item={item} collection={collection} user={user} />
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
          <QrCode item={item} user={user} collection={collection} context="web"/> 
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}/label`}>print label?</QueryPreservingLink>, <a href={githubManifestCodeSearchUrl}>source</a>
        </div>
        <div id="next">
          {nextItem && <ItemCard item={nextItem} collection={collection} user={user} triggerKey="d" altName="next →" size='small' />}
        </div>
      </div>
      <ItemCards collection={collection} user={user} highlighted={item.id} limit={6} />
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

import { Collection, Item, ITEM_FIELD_DESCRIPTIONS, loadItem, User } from "../manifest";
import React from "react";
import { useLoaderData } from "react-router";
import { ItemCard, ItemCards, HelmetMeta, ModelViewerWrapper, QueryPreservingLink } from "../utils";
import { metaForItem } from "../meta";
import Markdown from "react-markdown";

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
      <p className='description'><Markdown>{item.description}</Markdown></p>
      <div className='previous-next'>
      </div>
      <div className='bento'>
        {previousItem ?
          <ItemCard item={previousItem} collection={collection} user={user} triggerKey="a" altName="← previous" size='small' /> : <div />}
        <ModelViewerWrapper item={item} size='responsive-big' />
        <div>
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
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}/label`}>print label?</QueryPreservingLink>, <a href={githubManifestCodeSearchUrl}>source</a>
        </div>
        {nextItem ?
          <ItemCard item={nextItem} collection={collection} user={user} triggerKey="d" altName="next →" size='small' /> : <div />}
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
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.formalName}>formal name</abbr></dt>
      <dd>{item.formalName}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.alt}>alt</abbr></dt>
      <dd>{item.alt}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.releaseDate}>release date</abbr></dt>
      <dd>{item.releaseDate}</dd>
      <dt>manufacturer</dt>
      <dd>{item.manufacturer}</dd>
      <dt>manufacture date</dt>
      <dd>{item.manufactureDate}</dd>
      <dt>manufacture location</dt>
      <dd>{item.manufactureLocation}</dd>
      <dt>material</dt>
      <dd className='list'>{item.material?.join(", ")}</dd>
      <dt>acquisition date</dt>
      <dd>{item.acquisitionDate}</dd>
      <dt>acquisition location</dt>
      <dd>{item.acquisitionLocation}</dd>
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
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.model}>model</abbr></dt>
      <dd className='ellipsis'>
        <a href={item.model}>{item.model}</a></dd>
      {item.poster && <>
        <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.poster}>poster</abbr></dt>
        <dd className='ellipsis'><a href={item.poster}>{item.poster}</a></dd>
      </>}
    </dl>
  );
}

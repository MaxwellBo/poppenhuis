import { Collection, Item, User } from "../manifest";
import { loadItem } from "../manifest";
import React, { useRef } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import { GlobalItemCards } from '../components/ItemCards';
import { ItemCard } from '../components/ItemCard';
import { metaForItem } from "../meta";
import Markdown from "react-markdown";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { PageHeader } from "../components/PageHeader";
import { QrCode } from "../components/QrCode";
import { AFrameScene } from "../components/AFrameScene";
import { PrintToCatPrinterButton } from "../components/PrintToCatPrinterButton";
import { DescriptionList } from "../components/DescriptionList";
import * as yaml from 'js-yaml';

export const loader = loadItem

export default function ItemPage() {
  const { item, user, collection, users } = useLoaderData() as Awaited<ReturnType<typeof loadItem>>;
  const modelViewerRef = useRef<HTMLElement>(null);

  // Flatten all items across all users and collections
  type FlatItem = { item: Item; collection: Collection; user: User };
  const allItems: FlatItem[] = users.flatMap(u => 
    u.collections.flatMap(c => 
      c.items.map(i => ({ item: i, collection: c, user: u }))
    )
  );

  const currentIndex = allItems.findIndex(
    fi => fi.item.id === item.id && fi.collection.id === collection.id && fi.user.id === user.id
  );

  const previousFlatItem: FlatItem = currentIndex > 0
    ? allItems[currentIndex - 1]
    : allItems[allItems.length - 1];
  const nextFlatItem: FlatItem = currentIndex < allItems.length - 1
    ? allItems[currentIndex + 1]
    : allItems[0];

  const previousItem = previousFlatItem.item;
  const previousCollection = previousFlatItem.collection;
  const previousUser = previousFlatItem.user;

  const nextItem = nextFlatItem.item;
  const nextCollection = nextFlatItem.collection;
  const nextUser = nextFlatItem.user;

  const previousItemIsLast = currentIndex === 0;
  const nextItemIsFirst = currentIndex === allItems.length - 1;

  const [searchParams, setSearchParams] = useSearchParams();
  const vrMode = searchParams.get("vr") || "";
  const renderAFrameScene = vrMode === "auto" || vrMode === "dsstore";
  const positioningMode = vrMode === "dsstore" ? "dsstore" : "auto";

  const handleVRToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (e.target.checked) {
      newSearchParams.set("vr", "auto");
    } else {
      newSearchParams.delete("vr");
    }
    setSearchParams(newSearchParams);
  };

  const handlePositioningChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("vr", e.target.value);
    setSearchParams(newSearchParams);
  };

  return (
    <article className='item-page'>
      <HelmetMeta meta={metaForItem(item, collection, user)} />
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / {item.name} <span className='index'>({collection.items.indexOf(item) + 1})</span>
      </PageHeader>
      <div className='bento'>
        <div id="previous">
          <ItemCard
            item={previousItem}
            collection={previousCollection}
            showIndex={true}
            user={previousUser}
            triggerKey="h"
            altName={previousItemIsLast ? "↻ go to end" : "← previous"}
            size='small' />
        </div>
        <div id="model">
          {renderAFrameScene
            ? <AFrameScene users={users} startingItem={item} positioningMode={positioningMode} />
            : <ModelViewerWrapper modelViewerRef={modelViewerRef} item={item} size='responsive-big' />
          }
          <div className="vr-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="vr-toggle">
              <input
                type="checkbox"
                checked={renderAFrameScene}
                onChange={handleVRToggle}
              />
              VR?
            </label>
            {renderAFrameScene && (
              <div className="positioning-options" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>positioning:</span>
                <label>
                  <input
                    type="radio"
                    name="positioning"
                    value="auto"
                    checked={positioningMode === "auto"}
                    onChange={handlePositioningChange}
                  />
                  {' '}auto
                </label>
                <label>
                  <input
                    type="radio"
                    name="positioning"
                    value="dsstore"
                    checked={positioningMode === "dsstore"}
                    onChange={handlePositioningChange}
                  />
                  {' '}use .DS_Store locations (<a href="/map">map</a>)
                </label>
              </div>
            )}
          </div>
        </div>
        <div id="description" className="description ugc"><Markdown>{item.description}</Markdown></div>
        <div id="meta">
          <DescriptionList item={item} collection={collection} user={user} />
          <br />
          <QrCodeAndLinksAndButtons item={item} collection={collection} user={user} modelViewerRef={modelViewerRef} />
        </div>
        <div id="next">
          <ItemCard
            item={nextItem}
            collection={nextCollection}
            showIndex={true}
            user={nextUser} triggerKey="l"
            altName={nextItemIsFirst ? "back to start ↺" : "next →"}
            size='small' />
        </div>
        <div id="cards">
          <GlobalItemCards 
            allItems={allItems}
            highlighted={currentIndex}
            limit={6}
          />
        </div>
      </div>
    </article>
  );
}

function QrCodeAndLinksAndButtons(props: { item: Item; collection: Collection; user: User; modelViewerRef: React.RefObject<HTMLElement>; }) {
  const { item, collection, user, modelViewerRef } = props;

  const githubManifestCodeSearchUrl = `https://github.com/search?q=repo%3AMaxwellBo%2Fpoppenhuis+%22id%3A+%5C%22${item.id}%5C%22%22&type=code`;

  const itemYaml = yaml.dump(item);

  const editYamlUrl = `https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}&yaml-template=${encodeURIComponent(itemYaml)}`;

  return (
    <div className="qrcode-and-links-and-buttons">
      <div id="qrcode">
        <QrCode item={item} user={user} collection={collection} context="web" />
      </div>
      <div id="links">
        <QueryPreservingLink className="action-link" to={`/${user.id}/${collection.id}/${item.id}/label`}>print label</QueryPreservingLink>, <QueryPreservingLink className="action-link" to={`/${user.id}/${collection.id}/${item.id}/embed`}>embed</QueryPreservingLink>, <QuicklookLink item={item} />, <a href={githubManifestCodeSearchUrl}>source</a>{user.source === undefined && <>, <a href={editYamlUrl}>edit?</a></>}{user.source === 'firebase' && <>, <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}/edit`}>edit?</QueryPreservingLink></>}
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
        <PrintToCatPrinterButton item={item} collection={collection} user={user} modelViewerRef={modelViewerRef} />
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

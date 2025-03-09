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
          <Details item={item} />
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

// Type definitions for the table data
type FieldValue = string | string[] | undefined | null;

type TableCellData = {
  value: FieldValue;
  header?: string;
  visible?: boolean;
};

// Helper function to create location string for capture location
function createCaptureLocationStr(item: Item): string | undefined {
  const { captureLocation, captureLatLon } = item;
  if (captureLocation && captureLatLon) {
    return `${captureLocation} (${captureLatLon})`;
  } else if (captureLocation) {
    return captureLocation;
  } else if (captureLatLon) {
    return captureLatLon;
  }
  return undefined;
}

// Component for the merged cell table view
function MergedCellTable({ item }: { item: Item; }) {
  const captureLocationStr = createCaptureLocationStr(item);
  const dataMap: Record<string, Record<string, TableCellData>> = {
    'general': {
      'formal name': { value: item.formalName },
      'alt': { value: item.alt }
    },
    'release': {
      'name': { value: 'N/A', header: 'Name' },
      'date': { value: item.releaseDate, header: 'Date' },
      'location': { value: null, header: 'Location' },
      'material': { value: null, header: 'Material' }
    },
    'manufacturer': {
      'name': { value: item.manufacturer, header: 'Name' },
      'date': { value: item.manufactureDate, header: 'Date' },
      'location': { value: item.manufactureLocation, header: 'Location' },
      'material': { value: item.material?.join(", "), header: 'Material' }
    },
    'acquisition': {
      'date': { value: item.acquisitionDate, header: 'Date' },
      'location': { value: item.acquisitionLocation, header: 'Location' },
      'device': { value: null, header: 'Device' },
      'app': { value: null, header: 'App' },
      'method': { value: null, header: 'Method' }
    },
    'capture': {
      'date': { value: item.captureDate, header: 'Date' },
      'location': { value: captureLocationStr, header: 'Location' },
      'device': { value: item.captureDevice, header: 'Device' },
      'app': { value: item.captureApp, header: 'App' },
      'method': { value: item.captureMethod, header: 'Method' }
    },
    'meta': {
      'model': { value: item.model },
      'Open Graph Image': { value: item.og }
    }
  };

  // Derive categories from dataMap
  const categories = Object.keys(dataMap);

  // Derive columnGroups from dataMap
  const columnGroups: Record<string, string[]> = {};
  categories.forEach(category => {
    columnGroups[category] = Object.keys(dataMap[category]);
  });

  // Get all unique columns
  const allColumns = new Set<string>();
  Object.values(columnGroups).forEach(columns => {
    columns.forEach(col => allColumns.add(col));
  });
  const attributes = Array.from(allColumns);

  // Find cells that can be merged
  const mergedCells: Record<string, { rowspan?: number, colspan?: number, content?: TableCellData }> = {};

  // Check for horizontal merges (same row, adjacent columns)
  categories.forEach(category => {
    const visibleColumns = columnGroups[category];

    visibleColumns.forEach((attr, index) => {
      if (index < visibleColumns.length - 1) {
        const currentValue = dataMap[category][attr].value;
        const nextAttr = visibleColumns[index + 1];
        const nextValue = dataMap[category][nextAttr].value;

        if (currentValue && currentValue === nextValue && currentValue !== null && currentValue !== 'N/A') {
          const key = `${category}-${attr}`;
          mergedCells[key] = {
            colspan: 2,
            content: dataMap[category][attr]
          };
          // Mark the next cell as merged
          mergedCells[`${category}-${nextAttr}`] = { colspan: 0 };
        }
      }
    });
  });

  // Check for vertical merges (same column, adjacent rows)
  attributes.forEach(attr => {
    categories.forEach((category, index) => {
      if (index < categories.length - 1) {
        const nextCategory = categories[index + 1];

        // Only check if both categories have this column
        const currentCategoryColumns = columnGroups[category];
        const nextCategoryColumns = columnGroups[nextCategory];

        if (currentCategoryColumns.includes(attr) && nextCategoryColumns.includes(attr)) {
          const currentValue = dataMap[category][attr].value;
          const nextValue = dataMap[nextCategory][attr].value;

          if (currentValue && currentValue === nextValue && currentValue !== null && currentValue !== 'N/A') {
            const key = `${category}-${attr}`;
            // If this cell is already part of a colspan, we need to handle differently
            if (mergedCells[key] && mergedCells[key].colspan) {
              mergedCells[key] = {
                colspan: mergedCells[key].colspan,
                rowspan: 2,
                content: dataMap[category][attr]
              };
            } else {
              mergedCells[key] = {
                rowspan: 2,
                content: dataMap[category][attr]
              };
            }
            // Mark the next cell as merged
            mergedCells[`${nextCategory}-${attr}`] = { rowspan: 0 };
          }
        }
      }
    });
  });

  return (
    <table className="description-table merged-cell-table">
      <tbody>
        {categories.map(category => {
          const visibleColumns = columnGroups[category];

          return (
            <tr key={category}>
              <td className="category-cell">{category}</td>
              {visibleColumns.map(attr => {
                const key = `${category}-${attr}`;
                const mergeInfo = mergedCells[key];

                // Skip cells that are merged into others
                if (mergeInfo && (mergeInfo.rowspan === 0 || mergeInfo.colspan === 0)) {
                  return null;
                }

                const cellData = mergeInfo?.content || dataMap[category][attr];
                const value = cellData.value;
                const header = cellData.header;

                // Skip rendering if value is null (not undefined) or N/A
                if (value === null || value === 'N/A') {
                  return null;
                }

                // Special rendering for links
                if ((attr === 'model' || attr === 'Open Graph Image') &&
                  value && typeof value === 'string' &&
                  (value.startsWith('http') || value.startsWith('/'))) {
                  return (
                    <td
                      key={attr}
                      rowSpan={mergeInfo?.rowspan}
                      colSpan={mergeInfo?.colspan}
                    >
                      {header && <strong>{header}: </strong>}
                      <a href={value} className="ellipsis">{value}</a>
                    </td>
                  );
                }

                // Special rendering for undefined values
                if (value === undefined) {
                  return (
                    <td
                      key={attr}
                      rowSpan={mergeInfo?.rowspan}
                      colSpan={mergeInfo?.colspan}
                      className="undefined-cell"
                    >
                      {header && <strong>{header}: </strong>}
                      undefined
                    </td>
                  );
                }

                return (
                  <td
                    key={attr}
                    rowSpan={mergeInfo?.rowspan}
                    colSpan={mergeInfo?.colspan}
                  >
                    {header && <strong>{header}: </strong>}
                    {value}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DescriptionList({ item }: { item: Item }) {
  const captureLocationStr = createCaptureLocationStr(item);

  const customFields = item.customFields ? Object.entries(item.customFields).map(([key, value]) => {
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
      <dd>{captureLocationStr}</dd>
      <dt>capture device</dt>
      <dd>{item.captureDevice}</dd>
      <dt>capture app</dt>
      <dd>{item.captureApp}</dd>
      <dt>capture method</dt>
      <dd>{item.captureMethod}</dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.model}>model</abbr></dt>
      <dd className='ellipsis'><a href={item.model}>{item.model}</a></dd>
      <dt><abbr title={ITEM_FIELD_DESCRIPTIONS.og}>Open Graph image</abbr></dt>
      <dd className='ellipsis'><a href={item.og}>{item.og}</a></dd>
    </dl>
  );
}

function Details({ item }: { item: Item }) {
  return (
    <div className="description-container">
      <div className="wide-screen-only">
        <MergedCellTable item={item} />
      </div>
      <div className="narrow-screen-only">
        <DescriptionList item={item} />
      </div>
    </div>
  );
}

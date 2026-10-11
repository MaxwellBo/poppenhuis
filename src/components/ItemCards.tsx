import { Collection, User, Item } from '../manifest';
import { ItemCard } from './ItemCard';
import { ModelCamera } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';

export type FlatItem = { item: Item; collection: Collection; user: User };

/**
 * Displays items from a single collection with optional highlighting and limit.
 * Used on CollectionPage and UserPage.
 */
export function ItemCards(props: { 
  collection: Collection; 
  user: User; 
  highlighted?: Item['id']; 
  limit?: number;
  /** 0-based start index for displayed items (e.g. currentPage * ITEMS_PER_PAGE); makes indexes page-aware */
  startIndex?: number;
  /** Morph each model into the item page. The first item also morphs to the homepage preview. */
  modelTransition?: boolean;
  /**
   * Items with a global index below this also morph between the user-page
   * row and the collection page. Both pages have to be showing that item.
   */
  userRowLimit?: number;
  camera?: ModelCamera;
}) {
  const { highlighted, limit, collection, user, startIndex, modelTransition, userRowLimit, camera } = props;
  const { items } = collection;
  const showSeeMore = limit && items.length > limit;

  let truncatedItems: Item[] = [];
  let offset = 0;
  // if there's a both a highlight AND a limit, we use a more complex heuristic to choose which items to show
  // Assume limit=5, highlighted=4, items.length=10
  // We want to show elements 0, 1, 2, 3, 4
  // But if limit=5, highlighted=5, items.length=10
  // We want to show elements 5, 6, 7, 8, 9
  if (highlighted && limit) {
    const highlightedIndex = items.findIndex((item: Item) => item.id === highlighted);
    const start = Math.floor(highlightedIndex / limit) * limit;
    const end = start + limit;
    truncatedItems = items.slice(start, end);
    offset = start;
  } else if (limit) {
    // otherwise we just want to truncate to the limit
    truncatedItems = items.slice(0, limit);
  } else {
    truncatedItems = items;
    offset = startIndex ?? 0;
  }

  return (
    <>
      <ul className='item-cards'>
        {truncatedItems.map((item, i) => (
          <li key={item.id} className={item.id === highlighted ? 'yelling highlight-model-viewer' : undefined}>
            <ItemCard
              item={item}
              collection={collection}
              user={user}
              showIndex={true}
              index={offset + i + 1}
              selected={item.id === highlighted}
              camera={camera}
              modelTransition={modelTransition}
              transitionWithHome={Boolean(modelTransition) && offset + i === 0}
              transitionWithUserRow={userRowLimit != null && offset + i < userRowLimit}
            />
          </li>
        ))}
      </ul>
      {showSeeMore &&
        <div className='center see-more'>
          <QueryPreservingLink to={`/${user.id}/${collection.id}`} viewTransition={Boolean(modelTransition) && collection.items.length > 0}><span className="ui">See all</span> <span className='count'>({collection.items.length})</span> {collection.name} →</QueryPreservingLink>
        </div>}
    </>
  );
}

/**
 * Displays items from a flattened global view across all collections and users.
 * Shows a dotted border divider when transitioning between collections/users.
 * Used on ItemPage.
 */
export function GlobalItemCards(props: {
  allItems: FlatItem[];
  highlighted: number;
  limit: number;
  /** Morph a bottom-strip model into the item page. The highlighted item stays unnamed. */
  modelTransition?: boolean;
  /** True only for the strip copy that should carry the shared-element name. */
  nameTransition?: (itemKey: string) => boolean;
  camera?: ModelCamera;
}) {
  const { allItems, highlighted, limit, modelTransition, nameTransition, camera } = props;
  
  const start = Math.floor(highlighted / limit) * limit;
  const end = start + limit;
  const truncatedItems = allItems.slice(start, end);

  return (
    <ul className='item-cards'>
      {truncatedItems.map((flatItem, index) => {
        const { item, collection: itemCollection, user: itemUser } = flatItem;
        const globalIndex = start + index;
        const isHighlighted = globalIndex === highlighted;
        const itemKey = `${itemUser.id}/${itemCollection.id}/${item.id}`;
        
        // Check if we need a divider before this item
        const needsDivider = index > 0 && 
          (truncatedItems[index - 1].collection.id !== itemCollection.id || 
           truncatedItems[index - 1].user.id !== itemUser.id);
        
        return (
          <li 
            key={`${itemUser.id}-${itemCollection.id}-${item.id}`} 
            className={isHighlighted ? 'yelling highlight-model-viewer' : undefined}
            style={needsDivider ? { borderLeft: '1px dotted #ccc' } : undefined}
          >
            <ItemCard
              item={item}
              collection={itemCollection}
              user={itemUser}
              showIndex={true}
              selected={isHighlighted}
              camera={camera}
              modelTransition={Boolean(modelTransition) && !isHighlighted}
              nameTransition={Boolean(nameTransition?.(itemKey))}
              transitionPlace="strip"
            />
          </li>
        );
      })}
    </ul>
  );
}

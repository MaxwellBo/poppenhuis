import { Collection, User, Item } from '../manifest';
import { ItemCard } from './ItemCard';
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
}) {
  const { highlighted, limit, collection, user } = props;
  const { items } = collection;
  const showSeeMore = limit && items.length > limit;

  let truncatedItems: Item[] = [];
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
  } else if (limit) {
    // otherwise we just want to truncate to the limit
    truncatedItems = items.slice(0, limit);
  } else {
    truncatedItems = items;
  }

  return (
    <>
      <ul className='item-cards'>
        {truncatedItems.map((item) => (
          <li key={item.id} className={item.id === highlighted ? 'yelling highlight-model-viewer' : undefined}>
            <ItemCard item={item} collection={collection} user={user} showIndex={true} />
          </li>
        ))}
      </ul>
      {showSeeMore &&
        <div className='center see-more'>
          <QueryPreservingLink to={`/${user.id}/${collection.id}`}>see all <span className='count'>({collection.items.length})</span> {collection.name} →</QueryPreservingLink>
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
}) {
  const { allItems, highlighted, limit } = props;
  
  const start = Math.floor(highlighted / limit) * limit;
  const end = start + limit;
  const truncatedItems = allItems.slice(start, end);

  return (
    <ul className='item-cards'>
      {truncatedItems.map((flatItem, index) => {
        const { item, collection: itemCollection, user: itemUser } = flatItem;
        const globalIndex = start + index;
        const isHighlighted = globalIndex === highlighted;
        
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
            <ItemCard item={item} collection={itemCollection} user={itemUser} showIndex={true} />
          </li>
        );
      })}
    </ul>
  );
}

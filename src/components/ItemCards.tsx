import { Collection, User, Item } from '../manifest';
import { ItemCard } from './ItemCard';
import { QueryPreservingLink } from './QueryPreservingLink';

export function ItemCards(props: { collection: Collection; user: User; highlighted?: Item['id']; limit?: number; }) {
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
          <QueryPreservingLink to={`/${user.id}/${collection.id}`}>see all {collection.items.length} {collection.name} →</QueryPreservingLink>
        </div>}
    </>
  );
}

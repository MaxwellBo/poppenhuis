import { Item, Collection, User } from '../manifest';
import { ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';


export function ItemCard(props: { 
  item: Item; 
  collection: Collection; 
  user: User; 
  showIndex?: boolean;
  altName?: string; 
  size?: ModelSize; 
  triggerKey?: string;
  selected?: boolean;
}) {
  const { item, collection, user, altName, size, triggerKey, showIndex, selected } = props;
  const name = altName ?? item.name;
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} />
        {selected ? (
          <span>{name}</span>
        ) : (
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey}>
            {name}
          </QueryPreservingLink>
        )}
        {showIndex && <div className='index'>({collection.items.indexOf(item) + 1})</div>}
      </div>
    </div>
  );
}

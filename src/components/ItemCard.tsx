import { Item, Collection, User } from '../manifest';
import { ModelCamera, ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';


export function ItemCard(props: { 
  item: Item; 
  collection: Collection; 
  user: User; 
  showIndex?: boolean;
  /** 1-based index when pagination is used; otherwise derived from collection.items */
  index?: number;
  altName?: string; 
  size?: ModelSize;
  camera?: ModelCamera;
  triggerKey?: string;
  selected?: boolean;
}) {
  const { item, collection, user, altName, size, camera, triggerKey, showIndex, index, selected } = props;
  const name = altName ?? item.name;
  const displayIndex = index ?? collection.items.indexOf(item) + 1;
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} camera={camera} />
        {selected ? (
          <span>{name}</span>
        ) : (
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey}>
            {name}
          </QueryPreservingLink>
        )}
        {showIndex && <div className='index'>({displayIndex})</div>}
      </div>
    </div>
  );
}

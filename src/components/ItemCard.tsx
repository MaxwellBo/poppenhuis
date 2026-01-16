import { Item, Collection, User } from '../manifest';
import { ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './NextQueryPreservingLink';


export function ItemCard(props: { 
  item: Item; 
  collection: Collection; 
  user: User; 
  showIndex?: boolean;
  altName?: string; 
  size?: ModelSize; 
  triggerKey?: string; 
}) {
  const { item, collection, user, altName, size, triggerKey, showIndex } = props;
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} />
        <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey}>
          {altName ?? item.name}
        </QueryPreservingLink> 
        {showIndex && <div className='index'>({collection.items.indexOf(item) + 1})</div>}
      </div>
    </div>
  );
}

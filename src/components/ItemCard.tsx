import { Item, Collection, User } from '../manifest';
import { ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';


export function ItemCard(props: { item: Item; collection: Collection; user: User; altName?: string; size?: ModelSize; triggerKey?: string; }) {
  const { item, collection, user, altName, size, triggerKey } = props;
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} />
        <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey}>
          {altName ?? item.name}
        </QueryPreservingLink>
        {triggerKey && <kbd className='block'>{triggerKey}</kbd>}
      </div>
    </div>
  );
}

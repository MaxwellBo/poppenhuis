import { Item, Collection, User } from '../manifest';
import { ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';
import { useModelViewTransitionName } from '../modelViewTransition';


export function ItemCard(props: { 
  item: Item; 
  collection: Collection; 
  user: User; 
  showIndex?: boolean;
  /** 1-based index when pagination is used; otherwise derived from collection.items */
  index?: number;
  altName?: string; 
  size?: ModelSize; 
  triggerKey?: string;
  selected?: boolean;
  /** Grow/shrink this model when opening, leaving, or moving between item pages. */
  modelTransition?: boolean;
  /** Also share the model with the homepage preview (collection's first item). */
  transitionWithHome?: boolean;
}) {
  const { item, collection, user, altName, size, triggerKey, showIndex, index, selected, modelTransition, transitionWithHome } = props;
  const name = altName ?? item.name;
  const displayIndex = index ?? collection.items.indexOf(item) + 1;
  const viewTransitionName = useModelViewTransitionName(
    { userId: user.id, collectionId: collection.id, itemId: item.id },
    { home: Boolean(transitionWithHome) && !selected, item: Boolean(modelTransition) && !selected }
  );
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} viewTransitionName={viewTransitionName} />
        {selected ? (
          <span>{name}</span>
        ) : (
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey} viewTransition={modelTransition}>
            {name}
          </QueryPreservingLink>
        )}
        {showIndex && <div className='index'>({displayIndex})</div>}
      </div>
    </div>
  );
}

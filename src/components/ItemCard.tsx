import { Item, Collection, User } from '../manifest';
import { ModelCamera, ModelSize } from './ModelViewerWrapper';
import { ModelViewerWrapper } from './ModelViewerWrapper';
import { QueryPreservingLink } from './QueryPreservingLink';
import { ModelTransitionPlace, rememberTransitionPlace, useModelViewTransitionName } from '../modelViewTransition';


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
  /** Grow/shrink this model when opening, leaving, or moving between item pages. */
  modelTransition?: boolean;
  /**
   * Apply the shared-element name. Defaults to `modelTransition`. On the item
   * page, previous/next and the bottom strip can show the same item, and only
   * one of those copies may be named.
   */
  nameTransition?: boolean;
  /** Set when this card is the side thumbnail or the bottom strip. */
  transitionPlace?: ModelTransitionPlace;
  /** Also share the model with the homepage preview (collection's first item). */
  transitionWithHome?: boolean;
  /** Also share the model between the user-page row and the collection page. */
  transitionWithUserRow?: boolean;
}) {
  const { item, collection, user, altName, size, camera, triggerKey, showIndex, index, selected, modelTransition, nameTransition, transitionPlace, transitionWithHome, transitionWithUserRow } = props;
  const displayIndex = index ?? collection.items.indexOf(item) + 1;
  const named = (nameTransition ?? modelTransition) && !selected;
  const viewTransitionName = useModelViewTransitionName(
    { userId: user.id, collectionId: collection.id, itemId: item.id },
    {
      home: Boolean(transitionWithHome) && !selected,
      userRow: Boolean(transitionWithUserRow) && !selected,
      item: Boolean(named),
    }
  );
  const rememberPlace = () => {
    if (transitionPlace) rememberTransitionPlace(transitionPlace);
  };
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} camera={camera} viewTransitionName={viewTransitionName} />
        {selected ? (
          <span>{altName ? <span className="ui">{altName}</span> : item.name}</span>
        ) : (
          <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey} viewTransition={modelTransition} onClick={rememberPlace}>
            {altName ? <span className="ui">{altName}</span> : item.name}
          </QueryPreservingLink>
        )}
        {showIndex && <div className='index'>({displayIndex})</div>}
      </div>
    </div>
  );
}

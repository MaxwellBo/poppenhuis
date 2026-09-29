import { useViewTransitionState } from "react-router";

/**
 * Shared element name for one model. The same name on the outgoing and
 * incoming pages is what lets the View Transition API grow or shrink it.
 * Names have to be CSS custom idents, so user-supplied ids are sanitized.
 */
export function modelViewTransitionName(userId: string, collectionId: string, itemId: string): string {
  const raw = `model-${userId}-${collectionId}-${itemId}`;
  const safe = raw.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(safe) ? safe : `m_${safe}`;
}

/**
 * Active only while a view transition is running between two screens that
 * show this model, so unrelated models stay part of the page crossfade.
 *
 * `home` — homepage preview of a collection's first item, and that same item
 * on the collection page (transitions between `/` and the collection).
 * `item` — this item's URL is either side of the navigation. That covers a
 * collection card and the item page, and previous/next on the item page.
 */
export function useModelViewTransitionName(
  ids: { userId: string; collectionId: string; itemId: string },
  opts: { home?: boolean; item?: boolean }
): string | undefined {
  const collectionPath = `/${ids.userId}/${ids.collectionId}`;
  const itemPath = `/${ids.userId}/${ids.collectionId}/${ids.itemId}`;
  const homeActive = useViewTransitionState("/");
  const collectionActive = useViewTransitionState(collectionPath);
  const itemActive = useViewTransitionState(itemPath);

  const withHome = Boolean(opts.home) && homeActive && collectionActive;
  const withItem = Boolean(opts.item) && itemActive;
  if (!withHome && !withItem) return undefined;
  return modelViewTransitionName(ids.userId, ids.collectionId, ids.itemId);
}

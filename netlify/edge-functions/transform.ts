// netlify/edge-functions/transform.ts
import { Context } from "@netlify/edge-functions";
import { loadUser, loadItem, loadCollection } from "../../src/manifest.tsx";
import { DEFAULT_META, fromItem as getMetaForItem, fromCollection as getMetaForCollection, fromUser as getMetaForUser, metaToHtml } from '../../src/meta.ts'

export default async function handler(request: Request, context: Context) {
  // Only transform HTML requests
  if (!request.headers.get("accept")?.includes("text/html")) {
    return context.next();
  }
  
  // Exclude assets requests
  const assetExtensions = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".eot"];
  if (assetExtensions.some(ext => request.url.endsWith(ext))) {
    return context.next();
  }

  const url = new URL(request.url);
  const response = await context.next();
  const text = await response.text();

  // there's 3 possible paths: 
  // /:userId, /:userId/:collectionId, /:userId/:collectionId/:itemId
  const pathname = url.pathname;
  const parts = pathname.split("/").filter(Boolean);
  const userId = parts[0];
  const collectionId = parts[1];
  const itemId = parts[2];
  const params = { userId, collectionId, itemId };

  let meta = DEFAULT_META;

  try {
    if (itemId) {
      const { item, collection, user } = await loadItem({ params, request });
      meta = getMetaForItem(item, collection, user);
    } else if (collectionId) {
      const { collection, user } = await loadCollection({ params, request });
      meta = getMetaForCollection(collection, user);
    } else if (userId) {
      const user = await loadUser({ params, request });
      meta = getMetaForUser(user);
    }
  } catch (error) {
    console.error(error);
  }

  // Replace everything between the meta markers
  const modifiedHTML = text.replace(
    /<!-- OPEN META -->[\s\S]*?<!-- CLOSE META -->/,
    `<!-- OPEN META -->\n${metaToHtml(meta)}\n  <!-- CLOSE META -->`
  );
  
  return new Response(modifiedHTML, {
    headers: response.headers
  });
}

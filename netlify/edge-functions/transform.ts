// netlify/edge-functions/transform.ts
import { Context } from "@netlify/edge-functions";
import { loadUser, loadItem, loadCollection } from "../../src/manifest.tsx";
import { DEFAULT_META, metaForCollection, metaForItem, metaForUser, metaToHtml } from '../../src/meta.ts'

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);

  // Check if this request would be routed to index.html
  // This means it's not a direct file request (no extension)
  // OR it's explicitly requesting index.html
  const isIndexHtmlRoute = !url.pathname.includes('.') || url.pathname.endsWith('index.html');
  
  if (!isIndexHtmlRoute) {
    return context.next();
  }

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
      meta = metaForItem(item, collection, user);
    } else if (collectionId) {
      const { collection, user } = await loadCollection({ params, request });
      meta = metaForCollection(collection, user);
    } else if (userId) {
      const { user } = await loadUser({ params, request });
      meta = metaForUser(user);
    }
  } catch (error) {
    console.error(error);
  }

  // Replace everything between the meta markers
  const modifiedHTML = text.replace(
    /<!-- OPEN META -->[\s\S]*?<!-- CLOSE META -->/,
    `<!-- OPEN META -->\n${metaToHtml(meta)}\n <!-- CLOSE META (POST-TEMPLATE) -->`
  );
  
  return new Response(modifiedHTML, {
    headers: response.headers
  });
}

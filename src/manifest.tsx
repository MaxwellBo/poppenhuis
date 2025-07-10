import { get, ref, set } from 'firebase/database';
import { db, rtdb } from './firebase.ts';
import { collection, getDocs  } from 'firebase/firestore';

type Manifest = User[];

export interface User {
  id: string;
  name: string;
  og?: string;
  bio?: string; 
  collections: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  og?: string;
  description?: string;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: `The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.`,
  og: "This is the image that will be displayed when this item is shared on social media.",
};

export interface Item {
  // required fields
  id: string;
  name: string;
  // model-viewer fields
  model: string;
  og?: string;
  alt?: string;
  // abstract details
  formalName?: string;
  releaseDate?: string;
  description?: string;
  // material reality
  manufacturer?: string;
  manufactureDate?: string;
  manufactureLocation?: string;
  material?: string[];
  // acquisition
  acquisitionDate?: string;
  acquisitionLocation?: string;
  // post-acquisition
  storageLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
  customFields?: {
    [key: string]: string | undefined;
  };
}
// KEEP THIS IN SYNC WITH THE TYPES ABOVE PLEASE
export const MANIFEST_SCHEMA = `
type Manifest = User[];

interface User {
  id: string;
  name: string;
  bio?: string;
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: \`The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.\`
};

export interface Item {
  // required fields
  id: string;
  name: string;
  // model-viewer fields
  model: string;
  poster?: string;
  alt?: string;
  // abstract details
  formalName?: string;
  releaseDate?: string;
  description?: string;
  // material reality
  manufacturer?: string;
  manufactureDate?: string;
  manufactureLocation?: string;
  material?: string[];
  // acquisition
  acquisitionDate?: string;
  acquisitionLocation?: string;
  // post-acquisition
  storageLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
  customFields?: {
    [key: string]: string | undefined;
  };
}
`;

export const MANIFEST_URL_QUERY_PARAM = 'manifest';

let firebaseManifest: Manifest | undefined = undefined;

export async function loadUsers({ request }: { request: Request; }) {
  let thirdPartyManifest: Manifest = [];

  const manifestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  if (manifestUrl) {
    try {
      const response = await fetch(manifestUrl);
      if (response.ok) {
        thirdPartyManifest = await response.json();
      }
    } catch (e) {
      console.error(e);
    }
  }


  if (firebaseManifest === undefined) {
    const manifestRef = ref(rtdb);
    const snapshot = await get(manifestRef);
    console.log(snapshot)

    if (!snapshot.exists()) {
      throw new Error("Firebase manifest not found");
    }

    firebaseManifest = snapshot.val() as Manifest;
  }

  return [...firebaseManifest, ...thirdPartyManifest];
}

export const ARENA_PREFIX = 'arena:';

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<{
  user: User,
  users: User[]
}> {
  const hasArenaPrefix = params.userId.startsWith(ARENA_PREFIX);

  if (hasArenaPrefix) {
    const userSlug = params.userId.slice(ARENA_PREFIX.length);
    const user = await loadArenaUser({ userSlug })
    return { user, users: [user] }
  }

  const users = await loadUsers({ request });
  const user = users.find((user) => user.id === params.userId);
  if (!user) throw new Error("User not found");
  return { user, users };
}

export async function loadCollection({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; }; request: Request; }) {
  const { user, users } = await loadUser({ params, request });
  const collection = user.collections.find((collection) => collection.id === params.collectionId);
  if (!collection) throw new Error("Collection not found");
  return { collection, user, users };
}

export async function loadItem({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; itemId: Item['id']; }; request: Request; }) {
  const { collection, user, users } = await loadCollection({ params, request });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");
  return { collection, user, item, users };
}

const ARENA_USER_CACHE = new Map<string, User>();

export async function loadArenaUser({ userSlug }: { userSlug: string }): Promise<User> {
  const cached = ARENA_USER_CACHE.get(userSlug);
  if (cached) {
    return cached;
  }

  const user: ArenaUser = await fetch(`https://api.are.na/v2/users/${userSlug}`).then((res) => res.json());

  const resultChannels: ArenaChannel[] = []

  let page = 1;
  do {
    const searchResult: ArenaSearchResult = await fetch(`https://api.are.na/v2/search/users/${userSlug}?page=${page}&per=100`).then((res) => res.json());
    resultChannels.push(...searchResult.channels);

    if (searchResult.current_page === searchResult.total_pages) {
      break;
    }
  } while (page++ < 100);

  const channels: ArenaChannel[] = await Promise.all(resultChannels.map(channel => fetch(`https://api.are.na/v2/channels/${channel.id}`).then((res) => res.json())));

  const collections: Collection[] = [];
  for (const channel of channels) {
    const items: Item[] = []

    for (const content of channel.contents) {
      if (!content.source?.url?.endsWith('.glb')) {
        continue
      }

      items.push({
        id: content.id.toString(),
        name: content.title,
        model: content.source.url,
        description: content.description,
        customFields: {
          "are.na block": `[https://www.are.na/block/${content.id}](https://www.are.na/block/${content.id})`
        },
        og: content.image?.display?.url,
      })
    }

    if (items.length === 0) {
      continue
    }

    collections.push({
      id: channel.slug.toString(),
      name: channel.title,
      description: `${channel.metadata.description} 

[Are.na channel](https://www.are.na/${userSlug}/${channel.slug})`,
      items,
    })
  }

  const result: User = {
    id: ARENA_PREFIX + user.slug,
    name: user.full_name,
    bio: `[Are.na user](https://www.are.na/${user.slug})`,
    collections
  };

  ARENA_USER_CACHE.set(userSlug, result);

  return result;
}

/**
 * https://dev.are.na/documentation/channels#Block43472
 */
interface ArenaChannel {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  added_to_at: string;
  published: boolean;
  open: boolean;
  collaboration: boolean;
  collaborator_count: number;
  slug: string;
  length: number;
  kind: string;
  status: string;
  user_id: number;
  manifest: ArenaManifest;
  contents: ArenaContent[];
  base_class: string;
  page: number;
  per: number;
  collaborators: any[];
  follower_count: number;
  share_link: string | null;
  metadata: ArenaMetadata;
  class_name: string;
  can_index: boolean;
  nsfw: boolean;
  owner: ArenaUser;
  user: ArenaUser;
}

interface ArenaMetadata {
  description: string;
}

interface ArenaManifest {
  key: string;
  AWSAccessKeyId: string;
  bucket: string;
  success_action_status: string;
  policy: string;
  acl: string;
  signature: string;
  expires: string;
}

interface Provider {
  name: string;
  url: string;
}

interface Source {
  url: string;
  title: string;
  provider: Provider;
}

interface ImageVariant {
  url: string;
}

interface ArenaImage {
  filename: string;
  content_type: string;
  updated_at: string;
  thumb: ImageVariant;
  square: ImageVariant;
  display: ImageVariant;
  large: ImageVariant;
  original: {
    url: string;
    file_size: number;
    file_size_display: string;
  };
}

interface ArenaUser {
  created_at: string;
  slug: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string;
  avatar_image: {
    thumb: string;
    display: string;
  };
  channel_count: number;
  following_count: number;
  profile_id: number;
  follower_count: number;
  initials: string;
  can_index: boolean;
  metadata: {
    description: string | null;
  };
  is_premium: boolean;
  is_lifetime_premium: boolean;
  is_supporter: boolean;
  is_exceeding_connections_limit: boolean;
  is_confirmed: boolean;
  is_pending_reconfirmation: boolean;
  is_pending_confirmation: boolean;
  badge: string;
  id: number;
  base_class: string;
  class: string;
}

interface ArenaContent {
  title: string;
  updated_at: string;
  created_at: string;
  state: string;
  comment_count: number;
  generated_title: string;
  content_html: string;
  description_html: string;
  visibility: string;
  content: string;
  description: string;
  source: Source | null;
  image: ArenaImage;
  embed: any;
  attachment: any;
  metadata: any;
  id: number;
  base_class: string;
  class: string;
  user: ArenaUser;
  position: number;
  selected: boolean;
  connection_id: number;
  connected_at: string;
  connected_by_user_id: number;
  connected_by_username: string;
  connected_by_user_slug: string;
}

interface ArenaSearchResult {
  term: string;
  per: number;
  current_page: number;
  total_pages: number;
  length: number;
  authenticated: boolean;
  channels: ArenaChannel[];
  blocks: ArenaContent[];
  users: any[];
}

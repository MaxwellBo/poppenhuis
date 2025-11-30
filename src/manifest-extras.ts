import * as yaml from 'js-yaml';
import { rtdb } from './firebase';
import { ref, get } from 'firebase/database';
import type { User, Collection, Item, Manifest } from './manifest';
import { FIRST_PARTY_MANIFEST } from './manifest';

// Firebase-specific types
export interface FirebaseUser extends Omit<User, 'collections'> {
  collections: Record<FirebaseCollection['id'], FirebaseCollection>;
  source: 'firebase';
  creatorUid: string; // Firebase Auth UID for write permissions
}

export interface FirebaseCollection extends Omit<Collection, 'items'> {
  items: Record<Item['id'], Item>;
}

export type FirebaseManifest = Record<FirebaseUser['id'], FirebaseUser>;

export const MANIFEST_URL_QUERY_PARAM = 'manifest';
export const ARENA_PREFIX = 'arena:';

export function loadUsers({ request }: { request: Request; }) {
  const manifestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  let promises;

  if (manifestUrl) {
    promises = [loadManifest(manifestUrl), loadFirebaseUsers()];
  } else {
    promises = [loadFirebaseUsers()];
  }

  return {
    syncUsers: FIRST_PARTY_MANIFEST,
    asyncUsersPromise: Promise.all(promises).then(list => list.flat())
  }
}

async function loadManifest(manifestUrl: string): Promise<Manifest> {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load manifest from ${manifestUrl}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadFirebaseUsers(): Promise<User[]> {
  const usersRef = ref(rtdb, '/');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return [];
  }

  const users: FirebaseManifest = snapshot.val();
  
  return Object.values(users).map(firebaseUser => {
    // Convert collections from Record to Array format
    const collections: Collection[] = Object.values(firebaseUser.collections ?? {}).map(collection => {
      const items: Item[] = Object.values(collection.items ?? {});

      return {
        ...collection,
        items
      };
    });

    return {
      ...firebaseUser,
      id: firebaseUser.id,
      collections,
      source: 'firebase'
    };
  });
}


export async function loadFirebaseUser({ userId }: { userId: string }): Promise<User> {
  const usersRef = ref(rtdb, '/');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    throw new Error("Firebase database is empty");
  }

  const users: FirebaseManifest = snapshot.val();
  const firebaseUser: FirebaseUser = users[userId];

  if (!firebaseUser) {
    throw new Error(`User with id "${userId}" not found in Firebase`);
  }

  // Convert collections from Record to Array format
  const collections: Collection[] = Object.values(firebaseUser.collections ?? {}).map(collection => {
    const items: Item[] = Object.values(collection.items ?? {});

    return {
      ...collection,
      items
    };
  });

  const result: User = {
    ...firebaseUser,
    source: 'firebase',
    collections
  };

  return result;
}

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<{
  user: User,
  users: User[]
}> {
  const hasArenaPrefix = params.userId.startsWith(ARENA_PREFIX);
  const manifestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  if (hasArenaPrefix) {
    const slug = params.userId.slice(ARENA_PREFIX.length);
    const arenaUser = await loadArenaUser({ userSlug: slug })
    return { user: arenaUser, users: [...FIRST_PARTY_MANIFEST, arenaUser,] }
  }

  if (manifestUrl) {
    const manifest = await loadManifest(manifestUrl);
    const manifestUser = manifest.find((user: User) => user.id === params.userId);
    if (manifestUser) {
      return { user: { ...manifestUser, source: 'manifest' }, users: [...FIRST_PARTY_MANIFEST, manifestUser] }
    }
  }

  // Check FIRST_PARTY_MANIFEST first
  const firstPartyUser = FIRST_PARTY_MANIFEST.find((user: User) => user.id === params.userId);
  if (firstPartyUser) {
    return { user: { ...firstPartyUser }, users: FIRST_PARTY_MANIFEST }
  }

  // Load all firebase users and find the one we need
  const firebaseUsers = await loadFirebaseUsers();
  const firebaseUser = firebaseUsers.find(user => user.id === params.userId);
  if (!firebaseUser) {
    throw new Error(`User with id "${params.userId}" not found`);
  }
  return { user: firebaseUser, users: [...FIRST_PARTY_MANIFEST, ...firebaseUsers] }
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

      const { description, yamlFields } = parseDescriptionWithYaml(content.description);

      items.push({
        id: content.id.toString(),
        name: content.title,
        model: content.source.url,
        description,
        customFields: {
          "are.na block": `[https://www.are.na/block/${content.id}](https://www.are.na/block/${content.id})`
        },
        og: content.image?.display?.url,
        // Merge in any YAML fields, allowing them to override defaults
        ...yamlFields,
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
    collections,
    source: 'arena'
  };

  ARENA_USER_CACHE.set(userSlug, result);

  return result;
}

/**
 * Parses a description that may contain YAML frontmatter.
 * If the description contains "---" as a divider, everything after it is treated as YAML
 * that can override Item fields. The part before "---" becomes the description.
 */
function parseDescriptionWithYaml(rawDescription: string | null | undefined): {
  description?: string;
  yamlFields: Partial<Item>;
} {
  if (!rawDescription) {
    return { description: undefined, yamlFields: {} };
  }

  const dividerIndex = rawDescription.indexOf('---');

  if (dividerIndex === -1) {
    return {
      description: rawDescription.trim(),
      yamlFields: {}
    };
  }

  const description = rawDescription.substring(0, dividerIndex).trim();
  const yamlContent = rawDescription.substring(dividerIndex + 3).trim();

  let yamlFields: Partial<Item> = {};

  try {
    const parsed = yaml.load(yamlContent);
    if (parsed && typeof parsed === 'object') {
      yamlFields = parsed as Partial<Item>;
    }
  } catch (error) {
    console.warn('Failed to parse YAML in description:', error);
    // If YAML parsing fails, treat the whole thing as description
    return {
      description: rawDescription.trim(),
      yamlFields: {}
    };
  }

  return {
    description: description || undefined,
    yamlFields
  };
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

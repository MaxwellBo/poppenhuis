import { Collection, Item, User } from "./manifest";

export async function loadArenaSearchResultAsUser({ userSlug }: { userSlug: string }): Promise<User> {
  const user: ArenaUser = await fetch(`https://api.are.na/v2/users/${userSlug}`).then((res) => res.json());
  const searchResult: ArenaSearchResult = await fetch(`https://api.are.na/v2/search/users/${userSlug}`).then((res) => res.json());
  const channels: ArenaChannel[] = await Promise.all(searchResult.channels.map(channel => fetch(`https://api.are.na/v2/channels/${channel.id}`).then((res) => res.json())));

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
          backlink: <a href={`https://www.are.na/block/${content.id}`}>https://www.are.na/block/{content.id}</a>,
        },
        poster: content.image?.display?.url,
      })
    }

    if (items.length === 0) {
      continue
    }

    collections.push({
      id: channel.slug.toString(),
      name: channel.title,
      description: <p>
        {channel.metadata.description} - <a href={`https://www.are.na/${userSlug}/${channel.slug}`}>View on Are.na</a>
      </p>,
      items,
    })
  }

  return {
    id: user.slug,
    name: user.full_name,
    bio: <p>
      {user.metadata.description} - <a href={`https://www.are.na/${user.slug}`}>View on Are.na</a>
    </p>,
    collections
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

import React from "react";
import { Await, useLoaderData, useSearchParams } from "react-router";
import { loadUsers } from "../manifest-extras";
import type { User } from "../manifest";
import { MANIFEST_URL_QUERY_PARAM, MANIFEST_SCHEMA, ARENA_PREFIX } from "../manifest";
import { Size } from '../components/Size';
import { ItemCard } from '../components/ItemCard';
import { DEFAULT_META } from "../meta";
import { HelmetMeta } from "../components/HelmetMeta";
import { QueryPreservingLink } from "../components/QueryPreservingLink";

const EXAMPLE_MANIFEST_URL = 'https://raw.githubusercontent.com/MaxwellBo/maxwellbo.github.io/master/poppenhuis-manifest.json'

export const loader = loadUsers;

export default function UsersPage() {
  const { syncUsers, asyncUsersPromise, } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <article>
      <HelmetMeta meta={DEFAULT_META} />
      <header>
        <h1>
          poppenhuis /
        </h1>
      </header>
      <div id="homepage-columns">
        <section>
          The following users have collections:
          <ul>
            {syncUsers.map((user) => (
              <UserListEntry key={user.id} user={user} />
            ))}
            <React.Suspense fallback={<div>Loading more users...</div>}>
              <Await resolve={asyncUsersPromise}>
                {(asyncUsers) => <>{asyncUsers.map((user) => (
                  <UserListEntry key={user.id} user={user} />
                ))}</>}
              </Await>
            </React.Suspense>
          </ul>
          <br />
          <p>
          <a href="https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-user.yml">+ new user (permanent)</a>
          </p>
          <p>
          <a href="/new">+ new user (temporary)</a>
          </p>
        </section>
        <section className='short'>
          <p className="p-spacing">
            poppenhuis (<i>Dutch for "dollhouse"</i>) is a space for sharing collections and their 3D scans.
          </p>
          <p className="p-spacing">
            Have a collection you care about? of pottery? of sculptures? of guitars? of cars? of cakes? of plants? of dolls?
          </p>
          <p className="p-spacing">
            They're welcome to live here too. Open a GitHub PR to <a href="https://github.com/MaxwellBo/poppenhuis">the poppenhuis repo</a> and:
          </p>
          <ol>
            <li>
              Upload your <code>.gltf/.glb</code> models to <a href="https://github.com/MaxwellBo/poppenhuis/tree/master/public/models"><code>//public/models/</code></a>
            </li>
            <li>
              Add your metadata to <a href="https://github.com/MaxwellBo/poppenhuis/blob/master/src/manifest.ts"><code>//src/manifest.ts</code></a>
            </li>
          </ol>
          <br />
          <details>
            <summary>What file formats can poppenhuis render?</summary>
            <div className="explanation">
              poppenhuis uses <a href="https://modelviewer.dev/">model-viewer</a> for rendering 3D models,
              which only renders <code>.gltf/.glb</code> files.
              <br />
              <br />
              Ideally poppenhuis would also support <code>.ply</code>-based <a href="https://en.wikipedia.org/wiki/Gaussian_splatting">Gaussian splats</a>, perhaps with <a href="https://sparkjs.dev/">Spark</a>. PRs welcome.
            </div>
          </details>
          <details>
            <summary>What app should I use to scan to <code>.gltf/.glb</code> files?</summary>
            <div className="explanation">
              I personally use <a href="https://poly.cam/">Polycam</a> in LiDAR mode. The produced models, while jank and low poly, are small, compressed, easy to edit, and dimensionally accurate.
              <br />
              <br />
              I also like <a href="https://scaniverse.com/">Scaniverse</a>, but I exclusively use it for <a href="https://en.wikipedia.org/wiki/Gaussian_splatting">Gaussian splatting</a>, and have not used its LiDAR mode.
            </div>
          </details>
          <details>
            <summary>Want to load models from an <a href="https://www.are.na/">Are.na</a> user profile?</summary>
            <div className="explanation">
              <ArenaUserLoader />
            </div>
          </details>
          <details>
            <summary>Want to mount a 3rd party manifest?</summary>
            <div className="explanation">
              <ThirdPartyManfiestLoader />
            </div>
          </details>
          <details>
            <summary>Why?</summary>
            <div className="explanation">
              My partner has a large collection of dolls, so I built poppenhuis to make it easier for her to catalogue and track metadata.

              Some of the dolls are culturally sensitive and shouldn't be displayed on a public forum, so she hosts her collection privately with a 3rd party manifest.
            </div>
          </details>
          <details>
            <summary>Why should I use GitHub to add my collection?</summary>
            <div className="explanation">
              <ol>
                <li>GitHub has everything we need for authenticated bulk uploading of models and metadata.</li>
                <li><q>Baking</q> <a href="https://github.com/MaxwellBo/poppenhuis/blob/master/src/manifest.ts"><code>//src/manifest.ts</code></a> into the bundle keeps the app snappy.</li>
              </ol>
            </div>
          </details>
          <details>
            <summary>Credits and inspiration</summary>
            <div className="explanation">
              poppenhuis takes inspiration from <a href="https://www.are.na/">Are.na</a>, <a href="https://www.dayroselane.com/hydrants">The&nbsp;Hydrant&nbsp;Directory</a> and <a href="https://en.wikipedia.org/wiki/Tony_Hawk%27s_Pro_Skater_4">Tony&nbsp;Hawk's&nbsp;Pro&nbsp;Skater&nbsp;4</a>.
              <br />
              <br />
              I discovered <a href="https://x.com/samdape/status/1777986265993875950">this Sam Peitz tweet</a>, <a href="https://nathannhan.art/">nathannhan.art</a>, <a href="https://jisu.world/bag/">What's in Jisu's bag?</a>, and <a href="https://rotatingsandwiches.com/">rotating sandwiches</a> after first release, and they guided poppenhuis's development in its final stages.
            </div>
          </details>
          <details>
            <summary>Technical challenges</summary>
            <div className="explanation">
              I tried porting the app to <a href="https://nextjs.org/">Next.js</a> to get some of that sweet, sweet SSR.
              But to my <a href="https://twitter.com/_max_bo_/status/1815536378522022130">dismay</a> I discovered that clicking any link was causing a full page load and remount, which invalidated the camera state of all <a href="https://modelviewer.dev/">model-viewer</a> components.
              Alas, the app remains a <a href="https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts">Vite React SPA</a>.
              If anyone has a solution to this, please reach out to <a href="https://twitter.com/_max_bo_">me on Twitter</a>.
            </div>
          </details>
        </section>
      </div>
    </article>
  );
}

function UserListEntry(props: { user: User }) {
  const { user } = props;

  return (
    <li key={user.id}>
      <QueryPreservingLink to={user.id}>{user.name}</QueryPreservingLink> <Size ts={user.collections} t="collection" />
      <ul>
        {
          user.collections.map((collection) =>
            <li key={collection.id}>
              <QueryPreservingLink to={user.id + "/" + collection.id}>{collection.name}</QueryPreservingLink> <Size ts={collection.items} t="item" />
              {collection.items[0] && <ItemCard item={collection.items[0]} collection={collection} user={user} size='small' altName={''} />}
            </li>
          )
        }
      </ul>
    </li>
  )
}

function ThirdPartyManfiestLoader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manifestUrl, setManifestUrl] = React.useState<string>(searchParams.get(MANIFEST_URL_QUERY_PARAM) ?? '');
  const [fetchResult, setFetchResult] = React.useState<string | undefined>(undefined);
  const [fetchStatus, setFetchStatus] = React.useState<JSX.Element>(<div />);

  const loadManifest = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest: ${response.statusText}`);
      }
      setFetchResult(JSON.stringify(await response.json(), null, 2));
      setFetchStatus(<span className='green'>SUCCESS, 3rd-party manifest spliced into the 1st-party manifest</span>);
      setSearchParams({ manifest: url });
    } catch (e) {
      setFetchStatus(<span className='red'>{"ERROR: " + (e as any).message}</span>);
      setFetchResult(undefined);
    }
  }

  return (
    <>
      Your 3rd party manifest will be merged with poppenhuis's 1st party manifest, and the manifest URL will be stored in <code>?manifest=</code> query param so you can share your collections with others.
      <br />
      <br />
      <details>
        <summary>Manifest schema</summary>
        <pre>{MANIFEST_SCHEMA}</pre>
      </details>
      <input style={{ width: "80%", fontSize: 13 }} placeholder={EXAMPLE_MANIFEST_URL} value={manifestUrl} onChange={e => setManifestUrl(e.target.value)} />
      <br />
      <button disabled={!manifestUrl} onClick={() => loadManifest(manifestUrl)}>Load custom manifest</button>
      <br />
      <button onClick={() => {
        setManifestUrl(EXAMPLE_MANIFEST_URL)
        loadManifest(EXAMPLE_MANIFEST_URL)
      }}>Load placeholder manifest</button>

      <br />
      <br />
      {fetchStatus}
      <pre className='truncate border'>{fetchResult}</pre>
    </>
  )
}

const EXAMPLE_USER_SLUG = 'max-bo';

function ArenaUserLoader() {
  const [userSlug, setUserSlug] = React.useState<string>('');

  return (
    <>
      Enter an Are.na profile slug:
      <br />
      <br />
      <label>
        <span>https://www.are.na/</span>
        <input style={{ fontSize: 13 }} placeholder={EXAMPLE_USER_SLUG} value={userSlug} onChange={e => setUserSlug(e.target.value)} />
      </label>
      <br />
      <button onClick={() => {
        setUserSlug(EXAMPLE_USER_SLUG)
      }}>Load placeholder user</button>
      <br />
      <br />
      The following (shareable!) link will only display channels that contain blocks uploaded as <code>.glb</code> files:
      <br />
      <QueryPreservingLink to={`/${ARENA_PREFIX}${userSlug}`}>
        {window.location.origin}/{ARENA_PREFIX}{userSlug}
      </QueryPreservingLink>
      <br />
      <br />
      You can add structured metadata to your Are.na blocks by including YAML in the description.
      Everything after a <code>---</code> divider will be parsed as YAML and used
      to set item metadata fields, for example:
      <br />
      <br />
      <pre style={{ padding: '8px' }}>
        {`My beautiful ceramic vase, hand-thrown on the wheel.
---
formalName: "Ceramic Vase #42"
releaseDate: "2023-10-15"
manufacturer: "Jane Smith"
material: 
  - "stoneware clay"
  - "celadon glaze"
acquisitionDate: "2023-11-01"
captureDevice: "iPhone 15 Pro"
captureMethod: "LiDAR"`}
      </pre>
    </>
  )
}

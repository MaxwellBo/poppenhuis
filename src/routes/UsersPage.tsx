import React from "react";
import { Await, useLoaderData, useSearchParams, NavLink } from "react-router";
import { loadUsers, sortUsers } from "../manifest";
import type { User } from "../manifest";
import { MANIFEST_URL_QUERY_PARAM, MANIFEST_SCHEMA, ARENA_USER_QUERY_PARAM } from "../manifest";
import { Size } from '../components/Size';
import { DEFAULT_META } from "../meta";
import { HelmetMeta } from "../components/HelmetMeta";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";

const EXAMPLE_MANIFEST_URL = 'https://raw.githubusercontent.com/MaxwellBo/maxwellbo.github.io/master/poppenhuis-manifest.json'

export const loader = loadUsers;

export default function UsersPage() {
  const { syncUsers, asyncUsersPromise, } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <article>
      <HelmetMeta meta={DEFAULT_META} />
      <PageHeader>
        poppenhuis / <span>⌂</span>
      </PageHeader>
      <div id="homepage-columns">
        <section>
          <div className="short">
            <p className="p-spacing">
              poppenhuis (<i>Dutch for "dollhouse"</i>) is a space for sharing collections and their 3D scans.
            </p>
            <p className="p-spacing">
              Have a collection you care about? of pottery? of sculptures? of guitars? of cars? of cakes? of plants? of dolls?
            </p>
            <p className="p-spacing">
              They're welcome to live here too.
            </p>
          </div>
          <p>
            The following <React.Suspense fallback={<Size ts={syncUsers} t="user" />}>
              <Await resolve={asyncUsersPromise}>
                {(asyncUsers) => <Size ts={[...syncUsers, ...asyncUsers]} t="user" />}
              </Await>
            </React.Suspense> have collections:
          </p>
          <ul>
            {syncUsers.map((user) => (
              <UserListEntry key={user.id} user={user} />
            ))}
            <React.Suspense fallback={<div>Loading more users...</div>}>
              <Await resolve={asyncUsersPromise}>
                {(asyncUsers) => <>{sortUsers(asyncUsers).map((user) => (
                  <UserListEntry key={user.id} user={user} />
                ))}</>}
              </Await>
            </React.Suspense>
          </ul>
        </section>
        <section className='short'>
          <details open>
            <summary>Why?</summary>
            {/* <div className="explanation">
              My partner has a large collection of dolls, so I built poppenhuis to make it easier for her to catalogue and track metadata.

              Some of the dolls are culturally sensitive and shouldn't be displayed on a public forum, so she hosts her collection privately with a 3rd party manifest.
            </div> */}
            <div className="explanation">
              <p className="p-spacing">
                When I was a kid, I used to watch an Australian TV show called <i>Collectors</i>. Each week a hobbyist collector would get 15 minutes to show off. Sadly, the show ended in 2011.
              </p>
              <p className="p-spacing">
                I think we are deprived of a good medium to share the stories of our cherished possessions clearly and easily. Photos alone are insufficient, and long form video is hard to make and maintain.
              </p>
              <p className="p-spacing">
                I believe that recent developments in photogrammetry and VR offer us a better medium, and I have sought to bring them to poppenhuis.
              </p>
              <p className="p-spacing">
                I hope some collections find a home here.
              </p>
            </div>
          </details>
          <details>
            <summary>What file formats can poppenhuis render?</summary>
            <div className="explanation">
              <p className="p-spacing">
                poppenhuis uses <a href="https://modelviewer.dev/">model-viewer</a> for rendering 3D models,
                which only renders <code>.gltf/.glb</code> files.
              </p>
              <p className="p-spacing">
                Ideally poppenhuis would also support <code>.ply</code>-based <a href="https://en.wikipedia.org/wiki/Gaussian_splatting">Gaussian splats</a>, perhaps with <a href="https://sparkjs.dev/">Spark</a>. PRs welcome.
              </p>
            </div>
          </details>
          <details>
            <summary>What app should I use to scan to <code>.gltf/.glb</code> files?</summary>
            <div className="explanation">
              <p className="p-spacing">
                I personally use <a href="https://poly.cam/">Polycam</a> in LiDAR mode. The produced models, while jank and low poly, are small, compressed, easy to edit, and dimensionally accurate.
              </p>
              <p className="p-spacing">
                I also like <a href="https://scaniverse.com/">Scaniverse</a>, but I exclusively use it for <a href="https://en.wikipedia.org/wiki/Gaussian_splatting">Gaussian splatting</a>, and have not used its LiDAR mode.
              </p>
            </div>
          </details>
          <br />
          <details>
            <summary>Want to upload your collections to poppenhuis?</summary>
            <div className="explanation">
              <p className="p-spacing">
                Go to <QueryPreservingLink to="/auth">/auth</QueryPreservingLink> and create an account. Then you can create a user profile, and your first collection.
              </p>
            </div>
          </details>
          <details>
            <summary>Want to load your collections from an <a href="https://www.are.na/">Are.na</a> user profile?</summary>
            <div className="explanation">
              <ArenaUserLoader />
            </div>
          </details>
          <details>
            <summary>Want to load your collections from a 3rd party manifest?</summary>
            <div className="explanation">
              <ThirdPartyManifestLoader />
            </div>
          </details>
          <details>
            <summary>Want to bake your collections into the bundle?</summary>
            <div className="explanation">
              <p>
                GitHub has everything we need for authenticated bulk uploading of models and metadata.
                Open a GitHub PR to <a href="https://github.com/MaxwellBo/poppenhuis">the poppenhuis repo</a> and:
              </p>
              <ol>
                <li>
                  Upload your <code>.gltf</code>/<code>.glb</code> models to <a href="https://github.com/MaxwellBo/poppenhuis/tree/master/public/models"><code>//public/models/</code></a>
                </li>
                <li>
                  Add your metadata to <a href="https://github.com/MaxwellBo/poppenhuis/blob/master/src/manifest.ts"><code>//src/manifest.ts</code></a>. Baking the metadata into the bundle keeps the app snappy.
                </li>
              </ol>
            </div>
          </details>
          <br />
          <details>
            <summary>Credits and inspiration</summary>
            <div className="explanation">
              <p className="p-spacing">
                poppenhuis is a collage of presentational motifs and design elements, sometimes copied entirely unchanged from other projects, including, but not limited to:
              </p>
              <InspirationGallery />
            </div>
          </details>
          <details>
            <summary>Technical challenges</summary>
            <div className="explanation">
              <p className="p-spacing">
                A lot of this app was actually really annoying to build. Particularly frustrating components were:
                <ul>
                  <li>Loading and interleaving data from 4 different backends (Firebase, 3rd party manifest, Are.na, and bundle)</li>
                  <li>
                    Layout stability when changing between screens
                  </li>
                  <li>
                    Laying out the VR scene
                  </li>
                  <li>
                    Laying out the <a href="og.png">Open Graph preview images</a>
                  </li>
                  <li>
                    The Kitty printer integration and its various printing bugs
                  </li>
                </ul>
              </p>
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
              <QueryPreservingLink to={`${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> <Size ts={collection.items} t="item" />
              <div>
                {collection.items[0] && <ModelViewerWrapper item={collection.items[0]} size="small" />}
              </div>
            </li>
          )
        }
      </ul>
    </li>
  )
}

function ThirdPartyManifestLoader() {
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
      <p className="p-spacing">
        Your 3rd party manifest will be merged with poppenhuis's 1st party manifest, and the manifest URL will be stored in <code>?manifest=</code> query param so you can share your collections with others.
      </p>
      <details className="p-spacing">
        <summary>Manifest schema</summary>
        <pre>{MANIFEST_SCHEMA}</pre>
      </details>
      <p className="p-spacing">
        <input
          style={{ width: "80%", fontSize: 13 }}
          placeholder={EXAMPLE_MANIFEST_URL}
          value={manifestUrl}
          onChange={e => setManifestUrl(e.target.value)}
        />
        <button disabled={!manifestUrl} onClick={() => loadManifest(manifestUrl)}>
          Load custom manifest
        </button>
        <button
          onClick={() => {
            setManifestUrl(EXAMPLE_MANIFEST_URL);
            loadManifest(EXAMPLE_MANIFEST_URL);
          }}
        >
          Load placeholder manifest
        </button>
      </p>
      <p className="p-spacing">{fetchStatus}</p>
      <pre className='truncate border'>{fetchResult}</pre>
    </>
  )
}

const EXAMPLE_USER_SLUG = 'max-bo';

function ArenaUserLoader() {
  const [userSlug, setUserSlug] = React.useState<string>('');

  return (
    <>
      <p className="p-spacing">
        Enter an Are.na profile slug. Only channels whose description includes <code>poppenhu.is</code> will be loaded, and only blocks uploaded as <code>.glb</code> files within those channels will be displayed.
      </p>
      <p className="p-spacing">
        <label>
          <span>https://www.are.na/</span>
          <input style={{ fontSize: 13 }} placeholder={EXAMPLE_USER_SLUG} value={userSlug} onChange={e => setUserSlug(e.target.value)} />
        </label>
        <button onClick={() => {
          setUserSlug(EXAMPLE_USER_SLUG)
        }}>Load placeholder user</button>
      </p>
      <p className="p-spacing">
        {userSlug ? (
          <NavLink to={{ pathname: `/${userSlug}`, search: `${ARENA_USER_QUERY_PARAM}=${userSlug}` }}>
            {window.location.origin}/{userSlug}?{ARENA_USER_QUERY_PARAM}={userSlug}
          </NavLink>
        ) : (
          <i>ENTER SLUG ABOVE</i>
        )}
      </p>
      <p className="p-spacing">
        You can add structured metadata to your Are.na blocks by including YAML in the description.
      </p>
      <p className="p-spacing">
        Everything after a <code>---</code> divider will be parsed as YAML and used
        to set item metadata fields, for example:
      </p>
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

function InspirationGallery() {
  return (
    <div className="inspiration-gallery">
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://www.dayroselane.com/hydrants">
            <img loading="lazy" src="/inspo/hydrant_directory.webp" alt="The Hydrant Directory" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://www.dayroselane.com/hydrants"><cite>The Hydrant Directory</cite></a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://www.are.na/">
            <img loading="lazy" src="/inspo/arena.webp" alt="Are.na" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://www.are.na/">Are.na</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://youtu.be/AIcuALGM1TI?t=40">
            <img loading="lazy" src="/inspo/ps2memorycard.webp" alt="the PS2 memory card screen" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://youtu.be/AIcuALGM1TI?t=40">the PS2 memory card screen</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://usgraphics.com/">
            <img loading="lazy" src="/inspo/usgraphics.webp" alt="U.S. Graphics Company" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://usgraphics.com/">U.S. Graphics Company</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://en.wikipedia.org/wiki/Tony_Hawk%27s_Pro_Skater_4">
            <img loading="lazy" src="/inspo/thps4.webp" alt="Tony Hawk's Pro Skater 4" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://en.wikipedia.org/wiki/Tony_Hawk%27s_Pro_Skater_4">the <cite>Tony Hawk's Pro Skater 4</cite> character selection screen</a>
        </div>
      </div>
      {/* <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://x.com/samdape/status/1777986265993875950">
            <img loading="lazy" src="/inspo/sampietz.webp" alt="this Sam Peitz tweet" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://x.com/samdape/status/1777986265993875950">this Sam Peitz tweet</a>
        </div>
      </div> */}
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://nathannhan.art/">
            <img loading="lazy" src="/inspo/nathanart.webp" alt="nathannhan.art" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://nathannhan.art/">nathannhan.art</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://jisu.world/bag/">
            <img loading="lazy" src="/inspo/jisusbag.webp" alt="What's in Jisu's bag?" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://jisu.world/bag/"><cite>What's in Jisu's bag?</cite></a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://rotatingsandwiches.com/">
            <img loading="lazy" src="/inspo/rotatingsandwiches.webp" alt="rotating sandwiches" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://rotatingsandwiches.com/"><cite>rotating sandwiches</cite></a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://rateyourmusic.com/release/album/sweet-trip/velocity-design-comfort/">
            <img loading="lazy" src="/inspo/sweet-trip-velocity-design-comfort-Cover-Art.webp" alt="velocity : design : comfort" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://rateyourmusic.com/release/album/sweet-trip/velocity-design-comfort/">the <cite>velocity : design : comfort.</cite> album art</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://commitmono.com/">
            <img loading="lazy" src="/inspo/commitmono.webp" alt="Commit Mono" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://commitmono.com/">Commit Mono</a>
        </div>
      </div>
      <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://kevin.garden/">
            <img loading="lazy" src="/inspo/kevingarden.webp" alt="kevin.garden" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://kevin.garden/">kevin.garden</a>
        </div>
      </div>
      {/* <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://beepybella.world/collections/rings">
            <img loading="lazy" src="/inspo/beepybella.webp" alt="Beepy Bella" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://beepybella.world/collections/rings">Beepy Bella</a>
        </div>
      </div> */}
      {/* <div className="inspiration-item">
        <div className="inspiration-image">
          <a href="https://hardwarearchive.org/Overview">
            <img loading="lazy" src="/inspo/hardwarearchive.webp" alt="Hardware Archive" />
          </a>
        </div>
        <div className="inspiration-label">
          <a href="https://hardwarearchive.org/Overview">Hardware Archive</a>
        </div>
      </div> */}
    </div>
  );
}

import React, { useEffect } from 'react';
import { Helmet } from "react-helmet";
import './App.css'
import {
  useLoaderData,
  useRouteError,
  Outlet,
  Link,
  useSearchParams,
  useLocation
} from "react-router-dom";

type Manifest = User[];

interface User {
  id: string;
  name: string;
  bio: JSX.Element | string;
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  model: string;
  description?: string;
  poster?: string;
  modelDate?: string;
  manufactureDate?: string;
  dateAcquired?: string;
  captureDate?: string;
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  captureLatLong?: string;
  captureLocation?: string;
  vertices?: string
}

const MANIFEST_SCHEMA = `
type Manifest = User[];

interface User {
  id: string;
  name: string;
  bio: JSX.Element | string;
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  model: string;
  description?: string;
  poster?: string;
  modelDate?: string;
  manufactureDate?: string;
  dateAcquired?: string;
  captureDate?: string;
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  captureLatLong?: string;
  captureLocation?: string;
  vertices?: string;
}
`


const FIRST_PARTY_MANIFEST: Manifest = [
  {
    id: "mbo",
    name: "Max Bo",
    bio: <p>
      <a href="https://maxbo.me">maxbo.me</a>, <a href="https://twitter.com/_max_bo_">twitter</a>
    </p>,
    collections: [
      {
        id: "pedals",
        name: "Pedals",
        items: [
          {
            id: "plumes",
            name: "Plumes",
            model: "/models/plumes.glb",
            description: "EarthQuaker Devices Plumes Small Signal Shredder",
            modelDate: "2019",
            dateAcquired: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "elcap",
            name: "El Capistan",
            model: "/models/elcap.glb",
            description: "Strymon El Capistan dTape Echo",
            dateAcquired: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "multistomp",
            name: "MS-70CDR",
            model: "/models/multistomp.glb",
            description: "Zoom MS-70CDR MultiStomp",
            dateAcquired: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "avrun",
            name: "Avalanche Run",
            model: "/models/avrun.glb",
            description: "EarthQuaker Devices Avalanche Run V2 Stereo Delay & Reverb",
            modelDate: "2017",
            dateAcquired: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
        ]
      },
      {
        id: "friends",
        name: "Friends",
        items: [
          {
            id: "hamish",
            name: "Hamish",
            model: "/models/Hamish.glb",
            captureApp: "Polycam",
            captureDate: "2023 August 26 4:43PM",
            captureMethod: "LiDAR",
            captureLatLong: "35.29 S, 149.12 E",
            captureDevice: "Apple iPhone 13 Pro"
          },
          {
            id: "dragan",
            description: "A man sitting and playing the accordion with partial surroundings included.",
            name: "Dragan",
            model: "/models/Dragan.glb",
            captureApp: "Polycam",
            captureMethod: "Photo mode",
            captureDate: "2024 May 22, 10:22PM",
            captureDevice: "Apple iPhone 11 Pro Max",
            vertices: "25.4k",
          },
          {
            id: "issy",
            name: "Islwyn",
            captureApp: "Polycam",
            model: "/models/Issy.glb",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "West End",
            captureLatLong: "27.48 S, 153.01 E",
            captureDate: "2023 April 26 9:00PM"
          },
          {
            id: "lou-nathan",
            name: "Lou & Nathan",
            description: "We were at the park",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/LouNathan.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 9 3:55 PM",
            captureLatLong: "33.89 S, 151.18 E",
            captureLocation: "Newtown"
          },
          {
            id: "jack",
            name: "Jack",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Jack.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 8 10:16 PM",
            captureLocation: "Sydney",
            captureLatLong: "33.88 S, 151.21 E"
          },
          {
            id: "jackie",
            name: "Jackie",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Jackie.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 21 8:00 PM",
            captureLocation: "Darlinghurst",
          },
          {
            id: "casey",
            name: "Casey",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Casey.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills"
          },
          {
            id: "fran",
            name: "Fran",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Fran.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale",
            captureDate: "2023 April 18 9:09 PM"
          },
          {
            id: "roman",
            name: "Roman",
            description: "The Thinker",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Roman.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills"
          }
        ]
      }
    ]
  }
]

export async function loadUsers({ request }: { request: Request }) {
  let thirdPartyManifest: Manifest = [];

  const manfiestUrl = new URL(request.url).searchParams.get('manifest');
  if (manfiestUrl) {
    try {
      const response = await fetch(manfiestUrl);
      if (response.ok) {
        thirdPartyManifest = await response.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  return [...FIRST_PARTY_MANIFEST, ...thirdPartyManifest];
}

export async function loadUser({ params, request }: { params: { userId: User['id'] }, request: Request }) {

  const users = await loadUsers({ request });
  const user = users.find((user) => user.id === params.userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function loadCollection({ params, request }: { params: { userId: User['id'], collectionId: Collection['id'] }, request: Request }) {
  const user = await loadUser({ params, request });

  const collection = user.collections.find((collection) => collection.id === params.collectionId);
  if (!collection) throw new Error("Collection not found");

  return { collection, user };
}

export async function loadItem({ params, request }: { params: { userId: User['id'], collectionId: Collection['id'], itemId: Item['id'] }, request: Request }) {
  const { collection, user } = await loadCollection({ params, request });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");

  return { collection, user, item };
}

export function User() {
  const user = useLoaderData() as User;

  return (
    <article>
      <Helmet>
        <title>{user.name} - poppenhuis</title>
        <meta name="description" content={`Collections of 3D models by ${user.name}`} />
      </Helmet>
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {user.name}
        </h1>
        <div className='padding-bottom-1rem'>{user.bio}</div>
      </header>
      {user.collections.map((collection) =>
        <CollectionRow key={collection.id} collection={collection} user={user} />)}
    </article>
  );
}

export function Collection() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loadCollection>>;

  return <article>
    <Helmet>
      <title>{collection.name} - poppenhuis</title>
      <meta name="description" content={`Collection of 3D models by ${user.name}`} />
    </Helmet>
    <header>
      <h1>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.name}
      </h1>
    </header>
    <Items collection={collection} user={user} />
  </article>
}

export function CollectionRow(props: { collection: Collection, user: User }) {
  return (
    <article>
      <h3>
        <QueryPreservingLink to={`/${props.user.id}/${props.collection.id}`}>{props.collection.name}</QueryPreservingLink>
      </h3>
      <Items {...props} />
    </article>
  );
}

export function Items(props: { collection: Collection, user: User }) {
  return (
    <ul className='card-grid'>
      {props.collection.items.map((item) => (
        <li key={item.id}>
          <ItemCard item={item} collection={props.collection} user={props.user} />
        </li>
      ))}
    </ul>
  );
}

type ModelSize = 'small' | 'normal' | 'big';

function getStyleForModelSize(size: ModelSize | undefined) {
  switch (size) {
    case 'small':
      return { height: "6rem", width: "6rem" };
    case 'big':
      return { height: '30rem', width: "40rem" };
    case 'normal':
    default:
      return { height: "20rem", width: "20rem" };
  }
}

function Model(props: { item: Item, size?: ModelSize }) {
  return (
    // @ts-ignore
    <model-viewer
      key={props.item.model}
      style={getStyleForModelSize(props.size)}
      alt={props.item.description}
      src={props.item.model}
      environment-image="/environments/moon_1k.hdr"
      interaction-prompt=""
      progress-bar=""
      loading="eager"
      poster={props.item.poster}
      shadow-intensity="1"
      auto-rotate-delay="0"
      rotation-per-second="30deg"
      camera-controls
      auto-rotate
      touch-action="pan-y"
    />
  );
}

export function Item() {
  const { item, user, collection } = useLoaderData() as Awaited<ReturnType<typeof loadItem>>;

  const previousItem: Item | undefined = collection.items.find((_, index) => collection.items[index + 1]?.id === item.id);
  const nextItem: Item | undefined = collection.items.find((_, index) => collection.items[index - 1]?.id === item.id);

  return (
    <article>
      <Helmet>
        <title>{item.name} - poppenhuis</title>
        <meta name="description" content={item.description} />
      </Helmet>
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / {item.name}
        </h1>
      </header>
      <div className='previous-next'>
      </div>
      <div className='item-hero'>
        {previousItem ?
          <ItemCard item={previousItem} collection={collection} user={user} altName="← previous" size='small' /> : <div />}
        <Model item={item} size='big' />
        <ItemDescriptionList item={item} collection={collection} user={user} />
        {nextItem ?
          <ItemCard item={nextItem} collection={collection} user={user} altName="next →" size='small' /> : <div />}
      </div>
      <Items collection={collection} user={user} />
    </article>
  );
}


function ItemCard(props: { item: Item, collection: Collection, user: User, altName?: string, size?: ModelSize }) {
  return (
    <div className="card">
      <div className='center thumbnail'>
        {/* <img src={props.item.poster} alt={props.item.alt} /> */}
        <Model item={props.item} size={props.size ?? 'normal'} />
      </div>
      <QueryPreservingLink to={`/${props.user.id}/${props.collection.id}/${props.item.id}`}>
        {props.altName ?? props.item.name}
      </QueryPreservingLink>
    </div>
  );
}

function QueryPreservingLink(props: { to: string, children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  return <Link to={{ pathname: props.to, search: searchParams.toString() }}>{props.children}</Link>
}

function ItemDescriptionList(props: { item: Item, collection: Collection, user: User }) {
  return (
    <dl>
      <dt>User ID</dt>
      <dd>{props.user.id}</dd>
      <dt>Collection ID</dt>
      <dd>{props.collection.id}</dd>
      <dt>Item ID</dt>
      <dd>{props.item.id}</dd>

      <dt>Description</dt>
      <dd>{props.item.description}</dd>

      <dt>Date manufactured</dt>
      <dd>{props.item.manufactureDate}</dd>
      <dt>Date acquired</dt>
      <dd>{props.item.dateAcquired}</dd>
      <dt>Date captured</dt>
      <dd>{props.item.captureDate}</dd>

      <dt>Capture location</dt>
      <dd>{props.item.captureLocation}</dd>
      <dt>Capture lat/long</dt>
      <dd>{props.item.captureLatLong}</dd>
      <dt>Capture device</dt>
      <dd>{props.item.captureDevice}</dd>
      <dt>Capture method</dt>
      <dd>{props.item.captureMethod}</dd>
      <dt>Model</dt>
      <dd>{props.item.model}</dd>
      <dt>Vertices</dt>
      <dd>{props.item.vertices}</dd>
      <dt>Poster</dt>
      <dd>{props.item.poster}</dd>

    </dl>
  );
}

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {

  return (
    <div>
      <ScrollToTop />
      <main>
        <Outlet />
      </main>
      <footer></footer>
    </div>
  )
}

const EXAMPLE_MANIFEST_URL = 'https://raw.githubusercontent.com/MaxwellBo/maxwellbo.github.io/master/poppenhuis-manifest.json'

export function Users() {
  const users = useLoaderData() as Awaited<ReturnType<typeof loadUsers>>;

  return (
    <article>
      <Helmet>
        <title>poppenhuis</title>
        <meta name="description" content={`a dollhouse`} />
      </Helmet>
      <header>
        <h1>
          poppenhuis
        </h1>
      </header>
      <p className="short">
        poppenhuis (<i>Dutch for "dollhouse"</i>) is a site for displaying collections of 3D models.
        <br />
        <br />
        It was inspired by <a href="https://www.are.na/">are.na</a> and the wonderful <a href="https://www.dayroselane.com/hydrants">Hydrant&nbsp;Directory</a>.
        <br />
        <br />
        The following users have collections:
      </p>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <QueryPreservingLink to={user.id}>{user.name}</QueryPreservingLink>
          </li>
        ))}
      </ul>
      <br />
      <details>
        <summary>Want to host your own content here?</summary>
        <ThirdPartyManifests />
      </details>
    </article>
  );
}

function ThirdPartyManifests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manifest, setManifest] = React.useState<string>(searchParams.get('manifest') ?? '');
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
      <h3>1st party manifest</h3>
      This site is a <a href="https://www.robinsloan.com/notes/home-cooked-app/">homecooked meal</a>, built primarily for my friends and family.
      Reach out to <a href="https://twitter.com/_max_bo_">me on Twitter</a> if you'd like me to host your collection.
      <br />
      <br />
      <h3>3rd party manifests</h3>
      You can view and share your own content on this site with manifest files.
      <br />
      <br />
      Your 3rd party manifest will be merged with the site's 1st party manifest, and the manifest URL will be stored in <code>?manifest=</code> query param so you can share your collections with others.
      <br />
      <br />
      <details>
        <summary>Manifest schema</summary>
        <pre>{MANIFEST_SCHEMA}</pre>
      </details>
      <input style={{ width: "80%", fontSize: 13 }} placeholder={EXAMPLE_MANIFEST_URL} value={manifest} onChange={e => setManifest(e.target.value)} />
      <br />
      <button disabled={!manifest} onClick={() => loadManifest(manifest)}>Load custom manifest</button>
      <br />
      <button onClick={() => {
        setManifest(EXAMPLE_MANIFEST_URL)
        loadManifest(EXAMPLE_MANIFEST_URL)
      }}>Load placeholder manifest</button>

      <br />
      <br />
      {fetchStatus}
      <pre className='truncate border'>{fetchResult}</pre>
    </>
  )
}

export function ErrorPage() {
  const error: any = useRouteError();

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}
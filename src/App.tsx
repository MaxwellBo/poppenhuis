import './App.css'
import {
  useLoaderData,
  useRouteError,
  Outlet,
  Link
} from "react-router-dom";

interface User {
  id: string;
  name: string;
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  items: Item[];
}

interface Item {
  id: string;
  itemDescription?: string;
  name: string;
  model: string;
  poster?: string;
  manufacturedDate?: string;
  dateAcquired?: string;
  captureDate?: string;
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  captureLatLong?: string;
  captureLocation?: string;
}


const DATABASE: User[] = [
  { 
    id: "mbo",
    name: "Max Bo",
    collections: [
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
            itemDescription: "We were at the park",
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
            itemDescription: "The Thinker",
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

export async function loadUsers() {
  return DATABASE;
}

export async function loadUser( { params }: { params: { userId: User['id'] } }) {
  const user = DATABASE.find((user) => user.id === params.userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function loadCollection( { params }: { params: { userId: User['id'], collectionId: Collection['id'] } }) {
  const user = await loadUser({ params });

  const collection = user.collections.find((collection) => collection.id === params.collectionId);
  if (!collection) throw new Error("Collection not found");

  return { collection, user };
}

export async function loadItem( { params }: { params: { userId: User['id'], collectionId: Collection['id'], itemId: Item['id'] } }) {
  const { collection, user } = await loadCollection({ params });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");

  return { collection, user, item };
}

export function User() {
  const user = useLoaderData() as User;

  return (
    <article>
      <h2>{user.name}</h2>
      {user.collections.map((collection) =>
        <CollectionRow key={collection.id} collection={collection} user={user} />)}
    </article>
  );
}

export function Collection() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loadCollection>>;

  return <article>
    <h2>
      <Link to={`/${user.id}`}>{user.name}</Link> / {collection.name}
    </h2>
    <Items collection={collection} user={user} />
  </article>
}

export function CollectionRow(props: { collection: Collection, user: User }) {
  return (
    <article>
      <h3>
        <Link to={`/${props.user.id}/${props.collection.id}`}>{props.collection.name}</Link>
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

function Model(props: { item: Item, big: boolean }) {
  return (
    // @ts-ignore
    <model-viewer 
      style={ props.big ? { height: '40rem', width: "40rem", margin: 'auto' } : { height: "20rem", width: "20rem" } }
      alt={props.item.itemDescription}
      src={props.item.model} 
      environment-image="/environments/moon_1k.hdr" 
      interaction-prompt=""
      progress-bar=""
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

  const collectionWithoutThisItem = {
    ...collection,
    items: collection.items.filter((i) => i.id !== item.id)
  }

  return (
    <article className='item-page'>
      <h2>
        <Link to={`/${user.id}`}>{user.name}</Link> / <Link to={`/${user.id}/${collection.id}`}>{collection.name}</Link> / {item.name}
      </h2>
      <div className='flex-wrap-row'>
        <Model item={item} big />
        <ItemDescriptionList item={item} collection={collection} user={user} />
      </div>
      <Items collection={collectionWithoutThisItem} user={user} />
    </article>
  );
}


function ItemCard(props: { item: Item, collection: Collection, user: User }) {
  return (
    <div className="card">
      <div className='center thumbnail'>
        {/* <img src={props.item.poster} alt={props.item.alt} /> */}
        <Model item={props.item} big={false}  />
      </div>
      <a href={`/${props.user.id}/${props.collection.id}/${props.item.id}`}>
        {props.item.name}
      </a>
    </div>
  );
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
      <dd>{props.item.itemDescription}</dd>

      <dt>Date manufactured</dt>
      <dd>{props.item.manufacturedDate}</dd>
      <dt>Date acquired</dt>
      <dd>{props.item.dateAcquired}</dd>
      <dt>Date captured</dt>
      <dd>{props.item.captureDate}</dd>

      <dt>Location</dt>
      <dd>{props.item.captureLocation}</dd>
      <dt>Capture Lat/Long</dt>
      <dd>{props.item.captureLatLong}</dd>
      <dt>Capture device</dt>
      <dd>{props.item.captureDevice}</dd>
      <dt>Capture method</dt>
      <dd>{props.item.captureMethod}</dd>

      <dt>Model</dt>
      <dd>{props.item.model}</dd>
      <dt>Poster</dt>
      <dd>{props.item.poster}</dd>

    </dl>
  );
}

export function App() {

  return (
    <div>
      <header>
        <h1>
          <Link to="/">dollhouse</Link>
        </h1>
      </header>
      <main>
        <Outlet />
      </main>
      {/* <footer>Footer Content</footer> */}
    </div>
  )
}

export function Users() {
  const users = useLoaderData() as Awaited<ReturnType<typeof loadUsers>>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <Link to={user.id}>{user.name}</Link>
        </li>
      ))}
    </ul>
  );
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
import './App.css'
import {
  useLoaderData,
  Outlet
} from "react-router-dom";

export function App() {
  return (
    <main>
      <h1>App</h1>
      <Outlet />
    </main>
  )
}

interface Doll {
  id: string;
  alt: string;
  name: string;
  model: string;
  poster: string;
}

export async function loadDolls(): Promise<Doll[]> {
  return [
    { 
      id: "neil-armstrong", 
      alt: "Alt text for Barbie doll",
      name: "Neil Armstrong", 
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
    },
  ]
}

export async function loadDoll({ params }: { params: { id: string } }): Promise<Doll> {
  const dolls = await loadDolls();
  return dolls.filter((doll) => doll.id === params.id)[0];
}


export function Doll() {
  const doll = useLoaderData() as Doll;

  return (
    <article>
      <h2>Doll</h2>
      {JSON.stringify(doll)}
      {/* @ts-ignore */}
      <model-viewer 
        alt={doll.alt}
        src={doll.model} 
        ar 
        environment-image="/environments/moon_1k.hdr" 
        poster={doll.poster}
        shadow-intensity="1" 
        camera-controls touch-action="pan-y" />
    </article>
  );
}

export function DollsListing() {
  const dolls = useLoaderData() as Doll[];

  return (
    <section>
      <h2>Dolls</h2>
      <ul>
        {dolls.map((doll) => (
          <li key={doll.id}>
            <a href={`/dolls/${doll.id}`}>
              {doll.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// @ts-nocheck

import React, { KeyboardEvent, useEffect, useRef } from 'react';
import '@google/model-viewer'
import './App.css'
import {
  Link,
  useSearchParams} from "react-router";
import { User, Collection, Item } from './manifest';
import { Helmet } from 'react-helmet';
import { Meta } from './meta';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { SplatMesh } from "./components/spark/SplatMesh";
import { SparkRenderer } from "./components/spark/SparkRenderer";
import { CameraControls } from "@react-three/drei";
import { useMemo } from "react";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";

export function Size(props: { ts: unknown[], t: string }) {
  const { ts, t } = props;
  const plural = t && ts && ts.length > 1 ? "s" : "";

  return <span className='size'>({ts.length} {t}{plural})</span>;
}

export function ItemCards(props: { collection: Collection, user: User, highlighted?: Item['id'], limit?: number }) {
  const { highlighted, limit, collection, user } = props;
  const { items } = collection;
  const showSeeMore = limit && items.length > limit;

  let truncatedItems: Item[] = [];
  // if there's a both a highlight AND a limit, we use a more complex heuristic to choose which items to show
  // Assume limit=5, highlighted=4, items.length=10
  // We want to show elements 0, 1, 2, 3, 4
  // But if limit=5, highlighted=5, items.length=10
  // We want to show elements 5, 6, 7, 8, 9
  if (highlighted && limit) {
    const highlightedIndex = items.findIndex((item: Item) => item.id === highlighted);
    const start = Math.floor(highlightedIndex / limit) * limit;
    const end = start + limit;
    truncatedItems = items.slice(start, end);
  } else if (limit) {
    // otherwise we just want to truncate to the limit
    truncatedItems = items.slice(0, limit);
  } else {
    truncatedItems = items;
  }

  return (
    <>
      <ul className='item-cards'>
        {truncatedItems.map((item) => (
          <li key={item.id} className={item.id === highlighted ? 'yelling highlight-model-viewer' : undefined}>
            <ItemCard item={item} collection={collection} user={user} />
          </li>
        ))}
      </ul>
      {showSeeMore &&
        <div className='center see-more'>
          <QueryPreservingLink to={`/${user.id}/${collection.id}`}>see all {collection.name} →</QueryPreservingLink>
        </div>}
    </>
  );
}

export function ItemCard(props: { item: Item, collection: Collection, user: User, altName?: string, size?: ModelSize, triggerKey?: string }) {
  const { item, collection, user, altName, size, triggerKey } = props;
  return (
    <div className="card">
      <div className='center'>
        <ModelViewerWrapper item={item} size={size ?? 'normal'} />
        <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`} triggerKey={triggerKey}>
          {altName ?? item.name}
        </QueryPreservingLink>
        {triggerKey && <kbd className='block'>{triggerKey}</kbd>}
      </div>
    </div>
  );
}


type ModelSize = 'small' | 'normal' | 'responsive-big';

function getStyleForModelSize(size: ModelSize | undefined) {
  switch (size) {
    case 'small':
      return { height: "6rem", width: "6rem" };
    case 'responsive-big':
      return { height: '30rem', width: "30rem", maxWidth: "95vw", maxHeight: "95vw" };
    case 'normal':
    default:
      return { height: "16rem", width: "16rem" };
  }
}

export function ModelViewerWrapper(props: { item: Item, size?: ModelSize }) {
  const { item, size } = props;
  const modelUrl = item.model;
  const fileExtension = modelUrl.substring(modelUrl.lastIndexOf('.') + 1).toLowerCase();
  
  // Determine if this is a Gaussian splat or PLY file
  const isGaussianSplat = fileExtension === 'splat' || fileExtension === 'ply';
  
  return (
    <div className='model-viewer-wrapper'>
      {size !== 'small' && <div className='camera-keys'>
        <kbd>SHIFT</kbd> <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>
      </div>}
      
      {isGaussianSplat ? (
        <SplatViewer  />
      ) : (
        // @ts-ignore
        <model-viewer
          key={modelUrl}
          style={getStyleForModelSize(size)}
          alt={item.alt ?? item.description}
          src={modelUrl}
          interaction-prompt=""
          progress-bar=""
          loading="auto"
          // poster={size !== 'responsive-big' ? item.poster : undefined}
          auto-rotate-delay="0"
          rotation-per-second="20deg"
          camera-controls
          auto-rotate
          touch-action="pan-y"
        />
      )}
    </div>
  );
}


export function QueryPreservingLink(props: { to: string, children: React.ReactNode, triggerKey?: string }) {
  const [searchParams] = useSearchParams();
  const linkRef = useRef<HTMLAnchorElement>(null);

  // we want to register a key to trigger the link click on keydown
  useEffect(() => {
    if (!props.triggerKey) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === props.triggerKey) {
        if (linkRef.current) {
          linkRef.current.click();
        }
      }
    };

    // @ts-ignore
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      // @ts-ignore
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <Link ref={linkRef} to={{ pathname: props.to, search: searchParams.toString() }}>{props.children}</Link>
}

export function HelmetMeta(props: { meta: Meta }) {
  const { meta } = props;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:url" content={meta.url} />
      <meta property="twitter:title" content={meta.title} />
      <meta property="twitter:description" content={meta.description} />
      <meta property="twitter:image" content={meta.image} />
      <meta property="twitter:url" content={meta.url} />
    </Helmet>
  );
}

function SplatViewer() {
  return (
    <div>
      <Canvas gl={{ antialias: false }}>
        <Scene />
      </Canvas>
    </div>
  );
}

/**
 * Separate `Scene` component to be used in the React Three Fiber `Canvas` component so that we can use React Three Fiber hooks like `useThree`
 */
const Scene = () => {
  const renderer = useThree((state) => state.gl);
  const meshRef = useRef<SparkSplatMesh>(null);

  // Memoize the elements inside the `<SparkRenderer />` `args` prop so that we don't re-create the `<SparkRenderer />` on every render
  const sparkRendererArgs = useMemo(() => {
    return { renderer };
  }, [renderer]);

  // Memoize the `SplatMesh` `args` prop so that we don't re-create the `SplatMesh` on every render
  const splatMeshArgs = useMemo(
    () =>
      ({
        url: "/assets/splats/butterfly.spz",
      }) as const,
    [],
  );

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.5 * delta;
    }
  });

  return (
    <>
      <CameraControls />
      <SparkRenderer args={[sparkRendererArgs]}>
        {/* This particular splat mesh is upside down */}
        <group rotation={[Math.PI, 0, 0]}>
          <SplatMesh ref={meshRef} args={[splatMeshArgs]} />
        </group>
      </SparkRenderer>
    </>
  );
};
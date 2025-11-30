import React, { useEffect, useState } from 'react';
import { Collection, Item, User } from '../manifest';
// @ts-ignore
import AFRAME from 'aframe';
import { getStyleForModelSize } from './ModelViewerWrapper';
import 'aframe-extras';
import "aframe-extras/controls/index.js";
import { loadDSStorePositionMap, extractFilename, DSStorePositionMap } from '../utils/dsstore-position-map';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-sky': any;
      'a-assets': any;
      'a-asset-item': any;
      'a-gltf-model': any;
      'a-link': any;
      'a-entity': any;
      'a-plane': any;
      'a-text': any;
    }
  }
}

interface AFrameSceneProps {
  users: User[];
  startingItem: Item;
  positioningMode: string;
}

const computePosition = ({ col, level, depth }: { col: number; level: number; depth: number; }): string => {
  return `${depth * 2} ${level} ${-col * 4} `;
}

AFRAME

export const AFrameScene: React.FC<AFrameSceneProps> = ({ users, startingItem, positioningMode }) => {
  const [dsStoreMap, setDsStoreMap] = useState<DSStorePositionMap>({});
  const [isLoadingDSStore, setIsLoadingDSStore] = useState(false);

  useEffect(() => {
    if (positioningMode === 'dsstore') {
      setIsLoadingDSStore(true);
      loadDSStorePositionMap().then(map => {
        setDsStoreMap(map);
        setIsLoadingDSStore(false);
      });
    }
  }, [positioningMode]);

  const layout: {
    position: { col: number; level: number; depth: number; };
    user?: User;
    collection?: Collection;
    item?: Item;
    flip: boolean;
  }[] = [];

  let collectionCount = 0;
  
  // When using .DS_Store positioning, we need a different layout
  if (positioningMode === 'dsstore') {
    // Only add items that have positions in .DS_Store
    for (const user of users) {
      for (const collection of user.collections) {
        for (const item of collection.items) {
          const filename = extractFilename(item.model);
          const position = dsStoreMap[filename];
          
          if (position) {
            // Use .DS_Store coordinates - we'll convert them to 3D positions
            // Scale down the coordinates and use them for x and z
            // y will be at ground level (0)
            layout.push({
              position: { 
                col: position.x / 100,  // Scale down x coordinate
                level: 0,                // Keep at ground level
                depth: position.y / 100  // Scale down y coordinate (becomes z in 3D)
              },
              item: item,
              flip: false,
            });
          }
        }
      }
    }
  } else {
    // Auto positioning mode - original layout logic
  for (const user of users) {
    layout.push({
      position: { col: collectionCount, level: 3, depth: 0 },
      user: user,
      flip: false,
    });

    for (const collection of user.collections) {
      layout.push({
        position: { col: collectionCount, level: 2, depth: 0 },
        collection: collection,
        flip: false,
      });

      let itemCount = 0;
      for (const item of collection.items) {
        layout.push({
          position: { col: collectionCount, level: 0, depth: itemCount },
          item: item,
          flip: false,
        });

        itemCount++;
      }

      layout.push({
        position: { col: collectionCount, level: 2, depth: 0 },
        collection: collection,
        flip: true,
      });

      collectionCount++;
    }

    layout.push({
      position: { col: collectionCount - 1, level: 3, depth: 0 },
      user: user,
      flip: true,
    });
  }
  }

  let startingPosition: string = computePosition({ col: 2, level: 0, depth: 6 });

  if (startingItem) {
    const found = layout.find(entity => entity.item && entity.item.id === startingItem.id);
    if (found) {
      startingPosition = computePosition({ ...found.position, col: found.position.col - 0.3 });
    }
  }

  const items = layout.filter(entity => entity.item).map(item => item.item!);

  if (positioningMode === 'dsstore' && isLoadingDSStore) {
    return (
      <div className='a-scene-wrapper' style={{ ...getStyleForModelSize('responsive-big'), display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf5e6' }}>
        <p>Loading .DS_Store positions...</p>
      </div>
    );
  }

  return (
    <div className='a-scene-wrapper'>
      <div className='camera-keys'>
        <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>
      </div>
      <a-scene 
        embedded 
        style={getStyleForModelSize('responsive-big')}
        xr-mode-ui="XRMode: xr"
        >
        <a-entity id="rig"
          movement-controls>
        <a-entity 
          camera 
          fly={true} 
          look-controls 
          position={startingPosition}></a-entity>
        </a-entity>
        <a-sky color="#fdf5e6"></a-sky>
        <a-assets>
          {items.map((item) => (
                <a-asset-item key={item.id} id={item.id} src={item.model}></a-asset-item>
            )
          )}
          {/* <img id="sky" src="clouds.webp"></img> */}
        </a-assets>
        {layout.map(({ position, item, user, collection, flip }) => {
          if (user) {
            if (flip) {
              return (
                <a-text 
                  value={user.name} 
                  color="#000" 
                  width="10"
                  rotation="0 -180 0"
                  position={computePosition(position)}
                ></a-text>
            ) } else {
              return (
                <a-text 
                  key={"flipped-user-" + user.id} 
                  value={user.name} 
                  color="#000" 
                  width="10"
                  rotation="0 0 0"
                  position={computePosition(position)}
                ></a-text>
              )
            }
          }

          if (collection) {
            if (flip) {
              return (
                <a-text
                  key={"flipped-collection-" + collection.id}
                  value={collection.name}
                  color="#000" 
                  width="5"
                  rotation="0 -180 0"
                  position={computePosition(position)}
                ></a-text>
              );
            } else {
              return (
                <a-text
                  key={"collection-" + collection.id}
                  value={collection.name}
                  color="#000" 
                  width="5"
                  rotation="0 0 0"
                  position={computePosition(position)}
                ></a-text>
              );
            }
          }

          if (item) {
            return <>
              <a-gltf-model
                key={"model-" + item.id}
                animation="property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true"
                src={`#${item.id}`}
                rotation="0 0 0"
                position={computePosition(position)}
              ></a-gltf-model>
              <a-text
                key={"item-" + item.id}
                value={item.name}
                color="#000"
                width="2"
                rotation="0 -180 0"
                position={computePosition({ ...position, level: position.level + 1 })}
              ></a-text>
              <a-text
                key={"item-" + item.id}
                value={item.name}
                color="#000"
                width="2"
                rotation="0 0 0"
                position={computePosition({ ...position, level: position.level + 1 })}
              ></a-text>
            </>
          }

        })}
        {/* <a-sky src="#sky"></a-sky> */}
      </a-scene>
    </div>
  );
};
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

const computePositionDirect = ({ x, y, z }: { x: number; y: number; z: number; }): string => {
  return `${x} ${y} ${z}`;
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
    } else {
      // Clear the map when switching back to auto mode
      setDsStoreMap({});
    }
  }, [positioningMode]);

  const layout: {
    position: { col: number; level: number; depth: number; } | { x: number; y: number; z: number; };
    user?: User;
    collection?: Collection;
    item?: Item;
    flip: boolean;
    isDirect?: boolean;
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
            // Use .DS_Store coordinates directly
            // Scale down the coordinates to reasonable 3D space
            layout.push({
              position: { 
                x: position.x / 50,    // x coordinate (scaled down less for more spacing)
                y: 0,                  // Keep at ground level
                z: -position.y / 50    // z coordinate (scaled down less for more spacing, negated to match orientation)
              },
              item: item,
              flip: false,
              isDirect: true,
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
      if (found.isDirect && 'x' in found.position && 'y' in found.position && 'z' in found.position) {
        startingPosition = computePositionDirect({ x: found.position.x - 1.5, y: found.position.y, z: found.position.z });
      } else if ('col' in found.position && 'level' in found.position && 'depth' in found.position) {
        startingPosition = computePosition({ ...found.position, col: found.position.col - 0.3 });
      }
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
          key={`camera-${startingItem.id}`}
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
        {layout.map(({ position, item, user, collection, flip, isDirect }) => {
          // Helper to get position string
          const getPosition = (pos: any, levelOffset = 0) => {
            if (isDirect && 'x' in pos && 'y' in pos && 'z' in pos) {
              return computePositionDirect({ x: pos.x, y: pos.y + levelOffset, z: pos.z });
            } else {
              return computePosition({ ...pos, level: pos.level + levelOffset });
            }
          };

          if (user) {
            if (flip) {
              return (
                <a-text 
                  value={user.name} 
                  color="#000" 
                  width="10"
                  rotation="0 -180 0"
                  position={getPosition(position)}
                ></a-text>
            ) } else {
              return (
                <a-text 
                  key={"flipped-user-" + user.id} 
                  value={user.name} 
                  color="#000" 
                  width="10"
                  rotation="0 0 0"
                  position={getPosition(position)}
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
                  position={getPosition(position)}
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
                  position={getPosition(position)}
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
                position={getPosition(position)}
              ></a-gltf-model>
              <a-text
                key={"item-" + item.id}
                value={item.name}
                color="#000"
                width="2"
                rotation="0 -180 0"
                position={getPosition(position, 1)}
              ></a-text>
              <a-text
                key={"item-" + item.id + "-flip"}
                value={item.name}
                color="#000"
                width="2"
                rotation="0 0 0"
                position={getPosition(position, 1)}
              ></a-text>
            </>
          }

        })}
        {/* <a-sky src="#sky"></a-sky> */}
      </a-scene>
    </div>
  );
};
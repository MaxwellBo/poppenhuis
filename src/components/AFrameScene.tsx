import React from 'react';
import { Collection, Item, User } from '../manifest';
// @ts-ignore
import AFRAME from 'aframe';

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
  initialItem?: Item
}

const computePosition = ({ col, level, depth }: { col: number; level: number; depth: number; }): string => {
  return `${col * 2} ${0.7 + level} ${depth * 1.2} `;
}

AFRAME

export const AFrameScene: React.FC<AFrameSceneProps> = ({ users, initialItem }) => {
  const layout: {
    position: { col: number; level: number; depth: number; };
    user?: User;
    collection?: Collection;
    item?: Item;
    flip: boolean;
  }[] = [];

  let collectionCount = 0;
  for (const user of users) {
    layout.push({
      position: { col: collectionCount, level: 2, depth: 0 },
      user: user,
      flip: false,
    });

    for (const collection of user.collections) {
      layout.push({
        position: { col: collectionCount, level: 1, depth: 0 },
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
        position: { col: collectionCount, level: 1, depth: 0 },
        collection: collection,
        flip: true,
      });

      collectionCount++;
    }

    layout.push({
      position: { col: collectionCount - 1, level: 2, depth: 0 },
      user: user,
      flip: true,
    });

  }

  const startingRotation = "0 90 0";
  let startingPosition: string = computePosition({ col: 2, level: 0, depth: 6 });

  if (initialItem) {
    const found = layout.find(entity => entity.item && entity.item.id === initialItem.id);
    if (found) {
      startingPosition = computePosition(found.position);
    }
  }

  const items = layout.filter(entity => entity.item).map(item => item.item!);

  return (
    <a-scene embedded style={{ minHeight: "600px" }}>
      <a-entity camera fly={true} look-controls wasd-controls="acceleration:100" rotation={startingRotation} position={startingPosition}></a-entity>
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
                rotation="0 90 0"
                position={computePosition(position)}
              ></a-text>
          ) } else {
            return (
              <a-text 
                key={"flipped-user-" + user.id} 
                value={user.name} 
                color="#000" 
                width="10"
                rotation="0 -90 0"
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
                rotation="0 90 0"
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
                rotation="0 -90 0"
                position={computePosition(position)}
              ></a-text>
            );
          }
        }

        if (item) {
          return <>
            <a-gltf-model
              key={"model-" + item.id}
              src={`#${item.id}`}
              position={computePosition(position)}
            ></a-gltf-model>
            <a-text
              key={"item-" + item.id}
              value={item.name}
              color="#000"
              width="2"
              rotation="0 -90 0"
              position={computePosition({ ...position, level: position.level + 1 })}
            ></a-text>
          </>
        }

      })}
       {/* <a-sky src="#sky"></a-sky> */}
    </a-scene>
  );
};
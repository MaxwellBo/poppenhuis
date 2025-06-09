import React from 'react';
import { User } from './manifest';
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
    }
  }
}

interface AFrameSceneProps {
  users: User[];
}

const computePosition = (x: number, y: number, z: number): string => {
  const spacing = 2; // adjust this value for more or less space between items
  return `${-5 + (z) + x * spacing} 1 ${-6 + y * spacing} `;
}

AFRAME

export const AFrameScene: React.FC<AFrameSceneProps> = ({ users }) => {
  return (
    <a-scene embedded style={{ minHeight: "300px" }}>
      <a-sky color="#fdf5e6"></a-sky>
      <a-assets>
        {users.flatMap((user) =>
          user.collections.flatMap((collection) =>
            collection.items.map((item) => (
              <a-asset-item key={item.id} id={item.id} src={item.model}></a-asset-item>
            ))
          )
        )}
      </a-assets>

      {users.flatMap((user, z) =>
        user.collections.flatMap((collection, y) =>
          collection.items.map((item, x) => (
            <>
            <a-gltf-model key={"model-" + item.id} src={`#${item.id}`} position={computePosition(x, y, z)}></a-gltf-model>
          </>
          ))
        )
      )}
    </a-scene>
  );
};
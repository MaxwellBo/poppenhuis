import { useEffect, useRef } from 'react';
import { Item } from '../data/manifest';
import { ModelSize  } from './ModelViewerWrapper';
// @ts-ignore
import AFRAME from 'aframe';
import { SplatMesh, SparkRenderer } from "@sparkjsdev/spark";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': any;
      'a-entity': any;
    }
  }
}

let sparkInitialized = false;

// @ts-ignore
export function SplatRenderer(props: { item: Item; size?: ModelSize; }) {
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sparkInitialized) {
      // Register the splat component for A-Frame
      AFRAME.registerComponent('splat', {
        schema: {
          src: { default: '' },
        },
        init: function () {
          try {
            const splat = new SplatMesh({ url: this.data.src });
            splat.quaternion.set(1, 0, 0, 0);
            this.el.setObject3D('mesh', splat);
          } catch (error) {
            console.error('Error loading splat:', error);
          }
        }
      });

      // Register the splat system for A-Frame
      AFRAME.registerSystem('splat', {
        init: function () {
          try {
            // @ts-ignore - A-Frame typing is incomplete
            const sparkRenderer = new SparkRenderer({ renderer: this.sceneEl.renderer });
            // @ts-ignore - A-Frame typing is incomplete
            this.sceneEl.object3D.add(sparkRenderer);
          } catch (error) {
            console.error('Error initializing Spark renderer:', error);
          }
        }
      });

      sparkInitialized = true;
    }
  }, []);

  return (
    <a-scene ref={sceneRef}>
    <a-entity camera wasd-controls position="0 1.6 0"></a-entity>
    <a-entity
      splat="src: https://sparkjs.dev/assets/splats/butterfly.spz"
      position="0 1.6 -2"
      animation="property: rotation; to: 0 360 0; loop: true; dur: 10000; easing: linear;"
      ></a-entity>
    </a-scene>
  );
}
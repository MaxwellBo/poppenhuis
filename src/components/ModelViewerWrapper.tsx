import { Item } from '../manifest';
import '@google/model-viewer'
import React from 'react';

/**
 * model-viewer orbit: azimuth, polar angle, radius.
 * Polar 0° is straight down and 90° is level. Azimuth 0° faces the front.
 */
export type ModelCamera = {
  orbit: string;
  autoRotate: boolean;
};

/** Memory-card browser: look down the front at 45°, and hold still. */
export const PS2_BROWSER_CAMERA: ModelCamera = {
  orbit: '0deg 45deg auto',
  autoRotate: false,
};

type ModelViewerElement = HTMLElement & {
  cameraOrbit: string;
  jumpCameraToGoal: () => void;
  loaded: boolean;
};

export function ModelViewerWrapper(props: { item: Item; size?: ModelSize; modelViewerRef?: { current: HTMLElement | null }; camera?: ModelCamera; }) {
  const spin = props.camera?.autoRotate !== false;
  const viewerRef = React.useRef<ModelViewerElement | null>(null);

  const setViewer = (node: HTMLElement | null) => {
    viewerRef.current = node as ModelViewerElement | null;
    if (props.modelViewerRef) {
      props.modelViewerRef.current = node;
    }
  };

  React.useEffect(() => {
    const viewer = viewerRef.current;
    const camera = props.camera;
    if (!viewer || !camera) return;
    // Framing on load keeps the current polar angle and only updates distance,
    // which leaves the camera level. Reapply the orbit once the model is in.
    const apply = () => {
      viewer.cameraOrbit = camera.orbit;
      viewer.jumpCameraToGoal();
    };
    viewer.addEventListener('load', apply);
    if (viewer.loaded) apply();
    return () => viewer.removeEventListener('load', apply);
  }, [props.camera, props.item.model]);

  return (
    <div className='model-viewer-wrapper'>
      {props.size !== 'small' && <div className='camera-keys'>
        <kbd>SHIFT</kbd> <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>
      </div>}
      {/* @ts-ignore */}
      <model-viewer
        ref={setViewer}
        key={props.item.model}
        style={getStyleForModelSize(props.size)}
        alt={props.item.alt}
        src={props.item.model}
        interaction-prompt=""
        progress-bar=""
        loading="auto"
        // poster={props.size !== 'responsive-big' ? props.item.poster : undefined}
        camera-orbit={props.camera?.orbit}
        interpolation-decay={props.camera && !spin ? 0 : undefined}
        auto-rotate-delay={spin ? '0' : undefined}
        rotation-per-second={spin ? '20deg' : undefined}
        camera-controls
        auto-rotate={spin ? true : undefined}
        autoplay
        touch-action="pan-y" />
    </div>
  );
}

export type ModelSize = 'small' | 'normal' | 'responsive-big';

export function getStyleForModelSize(size: ModelSize | undefined) {
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

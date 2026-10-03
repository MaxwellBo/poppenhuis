import { Item } from '../manifest';
import '@google/model-viewer'
import React from 'react';
import { applyModelPose, ModelPoseTarget, peekModelPose } from '../modelViewTransition';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

/**
 * model-viewer orbit: azimuth, polar angle, radius.
 * Polar 0° is straight down and 90° is level. Azimuth 0° is model-viewer's front.
 */
export type ModelCamera = {
  orbit: string;
  autoRotate: boolean;
};

/** Memory-card browser: look down the front at 45°, and hold still. */
export const PS2_BROWSER_CAMERA: ModelCamera = {
  orbit: '180deg 45deg auto',
  autoRotate: false,
};

/** Open save: same facing, free to spin. */
export const PS2_ITEM_CAMERA: ModelCamera = {
  orbit: '180deg 75deg auto',
  autoRotate: true,
};

type ViewerEl = HTMLElement & ModelPoseTarget & { loaded: boolean };

export function ModelViewerWrapper(props: { item: Item; size?: ModelSize; modelViewerRef?: React.RefObject<HTMLElement>; viewTransitionName?: string; camera?: ModelCamera; }) {
  const viewerRef = React.useRef<ViewerEl | null>(null);
  const [holdPose, setHoldPose] = React.useState(false);
  const spin = props.camera?.autoRotate !== false;
  const transitionStyle = props.viewTransitionName
    ? ({
        viewTransitionName: props.viewTransitionName,
        viewTransitionClass: "model",
      } as React.CSSProperties)
    : undefined;

  const setViewerRef = React.useCallback((node: HTMLElement | null) => {
    viewerRef.current = node as ViewerEl | null;
    if (props.modelViewerRef) {
      (props.modelViewerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [props.modelViewerRef]);

  React.useLayoutEffect(() => {
    const el = viewerRef.current;
    const name = props.viewTransitionName;
    if (!el || !name) {
      setHoldPose(false);
      return;
    }
    // Poses are captured just after the old snapshot, before this incoming
    // viewer exists. No pose yet means this is the outgoing viewer.
    const pose = peekModelPose(name);
    if (!pose) return;

    let alive = true;
    const apply = () => {
      if (!alive) return;
      if (applyModelPose(el, pose)) setHoldPose(true);
      // An explicit camera (the PS2 browser) owns the orbit. The pose copy
      // would otherwise put the previous page's camera back on top of it.
      if (props.camera) {
        el.cameraOrbit = props.camera.orbit;
        el.jumpCameraToGoal?.();
      }
    };
    apply();
    // model-viewer applies its default orbit when the model finishes loading,
    // which is after this effect. Put the captured pose back once that happens.
    queueMicrotask(apply);
    el.addEventListener("load", apply);
    return () => {
      alive = false;
      el.removeEventListener("load", apply);
      if (el.isConnected) applyModelPose(el, pose);
    };
  }, [props.viewTransitionName, props.camera]);

  React.useEffect(() => {
    const viewer = viewerRef.current;
    const camera = props.camera;
    if (!viewer || !camera) return;
    // Framing on load keeps the current polar angle and only updates distance,
    // which leaves the camera level. Reapply the orbit once the model is in.
    const apply = () => {
      viewer.cameraOrbit = camera.orbit;
      viewer.jumpCameraToGoal?.();
    };
    viewer.addEventListener('load', apply);
    if (viewer.loaded) apply();
    return () => viewer.removeEventListener('load', apply);
  }, [props.camera, props.item.model]);

  return (
    <div className='model-viewer-wrapper' style={transitionStyle}>
      {props.size !== 'small' && <div className='camera-keys'>
        <kbd>SHIFT</kbd> <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>
      </div>}
      <model-viewer
        ref={setViewerRef}
        key={props.item.model}
        style={getStyleForModelSize(props.size)}
        alt={props.item.alt}
        src={props.item.model}
        interaction-prompt=""
        loading="auto"
        // poster={props.size !== 'responsive-big' ? props.item.poster : undefined}
        camera-orbit={props.camera?.orbit}
        interpolation-decay={props.camera && !spin ? 0 : undefined}
        auto-rotate-delay={spin ? '0' : undefined}
        rotation-per-second={spin ? '20deg' : undefined}
        camera-controls
        {...(holdPose || !spin ? {} : { "auto-rotate": true })}
        autoplay
        touch-action="pan-y">
        <div slot="progress-bar" />
      </model-viewer>
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

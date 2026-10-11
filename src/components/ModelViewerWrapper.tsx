import { Item } from '../manifest';
import '@google/model-viewer'
import React from 'react';
import { applyModelPose, draggedCameraOrbit, ModelPoseTarget, peekModelPose, settleAndBlitModelViewer } from '../modelViewTransition';

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
  // A drag replaces the page's preset orbit for the life of this viewer.
  // React would otherwise write the preset back into the attribute.
  const [orbitHold, setOrbitHold] = React.useState<string | undefined>();
  const orbitHoldRef = React.useRef<string | undefined>();
  // A dragged camera stays where the user left it. The item preset only spins
  // when they opened the model without moving it.
  const spin = props.camera?.autoRotate !== false && !orbitHold;
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
      const ready = applyModelPose(el, pose);
      if (alive && ready) setHoldPose(true);
      // A dragged orbit is the one in the photograph. The page preset only
      // applies when the user left the camera where the page put it.
      const dragged = draggedCameraOrbit(pose);
      if (dragged) {
        orbitHoldRef.current = dragged;
        el.cameraOrbit = dragged;
        el.jumpCameraToGoal?.();
        if (alive) setOrbitHold(dragged);
      } else if (props.camera) {
        orbitHoldRef.current = undefined;
        el.cameraOrbit = props.camera.orbit;
        el.jumpCameraToGoal?.();
        if (alive) setOrbitHold(undefined);
      }
      // The photographed canvas has to already be this pose when the morph ends.
      // The orbit goal lands in a microtask, so paint again after that.
      settleAndBlitModelViewer(el);
      queueMicrotask(() => {
        settleAndBlitModelViewer(el);
        requestAnimationFrame(() => settleAndBlitModelViewer(el));
      });
    };
    apply();
    // model-viewer applies its default orbit when the model finishes loading,
    // which is after this effect. Put the captured pose back once that happens.
    queueMicrotask(apply);
    el.addEventListener("load", apply);
    return () => {
      alive = false;
      el.removeEventListener("load", apply);
      if (el.isConnected) apply();
    };
  }, [props.viewTransitionName, props.camera]);

  React.useLayoutEffect(() => {
    const el = viewerRef.current;
    if (!el || !orbitHold) return;
    el.cameraOrbit = orbitHold;
    el.jumpCameraToGoal?.();
  }, [orbitHold]);

  React.useEffect(() => {
    const viewer = viewerRef.current;
    const camera = props.camera;
    if (!viewer || !camera || orbitHoldRef.current) return;
    // Framing on load keeps the current polar angle and only updates distance,
    // which leaves the camera level. Reapply the orbit once the model is in.
    const apply = () => {
      if (orbitHoldRef.current) return;
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
        camera-orbit={orbitHold ?? props.camera?.orbit}
        interpolation-decay={orbitHold || (props.camera && !spin) ? 0 : undefined}
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

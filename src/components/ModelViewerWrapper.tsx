import { Item } from '../manifest';
import '@google/model-viewer'
import React from 'react';
import { applyModelPose, ModelPoseTarget, peekModelPose } from '../modelViewTransition';

export function ModelViewerWrapper(props: { item: Item; size?: ModelSize; modelViewerRef?: React.RefObject<HTMLElement>; viewTransitionName?: string; }) {
  const viewerRef = React.useRef<HTMLElement | null>(null);
  const [holdPose, setHoldPose] = React.useState(false);
  const transitionStyle = props.viewTransitionName
    ? ({
        viewTransitionName: props.viewTransitionName,
        viewTransitionClass: "model",
      } as React.CSSProperties)
    : undefined;

  const setViewerRef = React.useCallback((node: HTMLElement | null) => {
    viewerRef.current = node;
    if (props.modelViewerRef) {
      (props.modelViewerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  }, [props.modelViewerRef]);

  React.useLayoutEffect(() => {
    const el = viewerRef.current as (HTMLElement & ModelPoseTarget) | null;
    const name = props.viewTransitionName;
    if (!el || !name) {
      setHoldPose(false);
      return;
    }
    // Poses are captured at the start of startViewTransition, before this
    // incoming viewer exists. No pose yet means this is the outgoing viewer.
    const pose = peekModelPose(name);
    if (!pose) return;

    let alive = true;
    const apply = () => {
      if (!alive) return;
      if (applyModelPose(el, pose)) setHoldPose(true);
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
  }, [props.viewTransitionName]);

  return (
    <div className='model-viewer-wrapper' style={transitionStyle}>
      {props.size !== 'small' && <div className='camera-keys'>
        <kbd>SHIFT</kbd> <kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd>
      </div>}
      {/* @ts-ignore */}
      <model-viewer
        ref={setViewerRef}
        key={props.item.model}
        style={getStyleForModelSize(props.size)}
        alt={props.item.alt}
        src={props.item.model}
        interaction-prompt=""
        progress-bar=""
        loading="auto"
        // poster={props.size !== 'responsive-big' ? props.item.poster : undefined}
        auto-rotate-delay="0"
        rotation-per-second="20deg"
        camera-controls
        {...(holdPose ? {} : { "auto-rotate": true })}
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

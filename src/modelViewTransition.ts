import { useViewTransitionState } from "react-router";

/**
 * Camera and turntable pose of a model-viewer. Auto-rotate spins the model's
 * yaw (`turntableRotation`) independently of `camera-orbit`, and a freshly
 * mounted viewer starts both at their defaults. The view transition shows a
 * snapshot of the old canvas, then reveals the new viewer — so without this
 * handoff the model snaps back to its starting angle.
 */
export type ModelPose = {
  theta: number;
  phi: number;
  radius: number;
  fov: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  yaw: number;
  /** Goal string already on the outgoing viewer, when it has one. */
  cameraOrbit?: string;
};

export type ModelPoseTarget = {
  cameraOrbit?: string;
  fieldOfView?: string;
  cameraTarget?: string;
  autoRotate?: boolean;
  turntableRotation?: number;
  resetTurntableRotation?: (theta?: number) => void;
  jumpCameraToGoal?: () => void;
  getCameraOrbit?: () => { theta: number; phi: number; radius: number };
  getFieldOfView?: () => number;
  getCameraTarget?: () => { x: number; y: number; z: number };
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

const DEFAULT_CAMERA_ORBIT = "0deg 75deg 105%";
const DEFAULT_PHI = 75 * Math.PI / 180;

const poses = new Map<string, ModelPose>();
let poseGeneration = 0;

const PATCHED = Symbol.for("poppenhuis.modelPoseHandoff");

function transitionNameOf(wrapper: HTMLElement): string {
  const inline = wrapper.style.viewTransitionName;
  if (inline && inline !== "none") return inline;
  const prop = wrapper.style.getPropertyValue("view-transition-name");
  if (prop && prop !== "none") return prop.trim();
  return "";
}

export function readModelPose(el: ModelPoseTarget): ModelPose | undefined {
  if (typeof el.getCameraOrbit !== "function" || typeof el.resetTurntableRotation !== "function") {
    return undefined;
  }
  const orbit = el.getCameraOrbit();
  const target = el.getCameraTarget?.();
  return {
    theta: orbit.theta,
    phi: orbit.phi,
    radius: orbit.radius,
    fov: el.getFieldOfView?.() ?? 0,
    targetX: target?.x ?? 0,
    targetY: target?.y ?? 0,
    targetZ: target?.z ?? 0,
    yaw: el.turntableRotation ?? 0,
    cameraOrbit: el.cameraOrbit,
  };
}

/** Snapshot every model that is participating in the transition about to start. */
export function captureModelPoses(root: ParentNode): number {
  const generation = ++poseGeneration;
  poses.clear();
  root.querySelectorAll<HTMLElement>(".model-viewer-wrapper").forEach((wrapper) => {
    const name = transitionNameOf(wrapper);
    if (!name) return;
    const el = wrapper.querySelector("model-viewer");
    if (!el) return;
    const pose = readModelPose(el as ModelPoseTarget);
    if (!pose) return;
    poses.set(name, pose);
  });
  return generation;
}

export function peekModelPose(name: string): ModelPose | undefined {
  const pose = poses.get(name);
  return pose ? { ...pose } : undefined;
}

export function clearModelPoses(generation?: number): void {
  if (generation != null && generation !== poseGeneration) return;
  poses.clear();
}

const ORBIT_ANGLE = /^(-?[\d.]+)(deg|rad)$/i;

function parseAngle(term: string): number | undefined {
  const match = ORBIT_ANGLE.exec(term);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return undefined;
  return match[2].toLowerCase() === "deg" ? value * Math.PI / 180 : value;
}

/** Azimuth and polar from an orbit goal such as `180deg 45deg auto`. */
export function parseCameraOrbitAngles(orbit: string): { theta: number; phi: number } | undefined {
  const parts = orbit.trim().split(/\s+/);
  if (parts.length < 2) return undefined;
  const theta = parseAngle(parts[0]);
  const phi = parseAngle(parts[1]);
  if (theta == null || phi == null) return undefined;
  return { theta, phi };
}

function angleDelta(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function liveOrbit(pose: ModelPose): string {
  return `${pose.theta}rad ${pose.phi}rad ${pose.radius}m`;
}

/**
 * The orbit the user dragged to, when it no longer matches the goal attribute.
 * Dragging updates getCameraOrbit() and leaves an explicit goal (the PS2
 * preset, or model-viewer's default) unchanged. Radius is left out of the
 * comparison: framing fills in `auto` without the user moving the camera.
 */
export function draggedCameraOrbit(pose: ModelPose): string | undefined {
  const liveReady = Number.isFinite(pose.theta) && Number.isFinite(pose.phi) && pose.radius > 0;
  if (!liveReady) return undefined;
  const goal = pose.cameraOrbit ? parseCameraOrbitAngles(pose.cameraOrbit) : undefined;
  if (goal) {
    const dragged = angleDelta(pose.theta, goal.theta) > 0.02 || angleDelta(pose.phi, goal.phi) > 0.02;
    return dragged ? liveOrbit(pose) : undefined;
  }
  const moved = Math.abs(pose.theta) > 0.02 || angleDelta(pose.phi, DEFAULT_PHI) > 0.02;
  return moved ? liveOrbit(pose) : undefined;
}

/**
 * Orbit string to copy. A dragged camera wins over the goal attribute. An
 * explicit goal (set by the app) is kept when the live spherical is not ready
 * yet, or when the user has not moved it.
 */
export function modelPoseOrbit(pose: ModelPose): string | undefined {
  const dragged = draggedCameraOrbit(pose);
  if (dragged) return dragged;
  const goal = pose.cameraOrbit;
  if (goal && goal !== DEFAULT_CAMERA_ORBIT) return goal;
  return undefined;
}

/**
 * Put `pose` on `el` and stop auto-rotate so the revealed model matches the
 * frozen snapshot. Returns false if the custom element is not ready yet.
 */
export function applyModelPose(el: ModelPoseTarget, pose: ModelPose): boolean {
  if (typeof el.resetTurntableRotation !== "function") return false;
  el.autoRotate = false;
  el.resetTurntableRotation(pose.yaw);
  const orbit = modelPoseOrbit(pose);
  if (orbit) el.cameraOrbit = orbit;
  if (Number.isFinite(pose.fov) && pose.fov > 0) {
    el.fieldOfView = `${pose.fov}deg`;
  }
  if ([pose.targetX, pose.targetY, pose.targetZ].every(Number.isFinite)) {
    el.cameraTarget = `${pose.targetX}m ${pose.targetY}m ${pose.targetZ}m`;
  }
  el.jumpCameraToGoal?.();
  return true;
}

type PatchedStart = NonNullable<Document["startViewTransition"]> & { [PATCHED]?: boolean };

type BlitScene = {
  camera?: object;
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  scaleStep?: number;
  renderShadow?: (renderer: object) => void;
};

type BlitRenderer = {
  threeRenderer?: {
    autoClear: boolean;
    setRenderTarget: (target: null) => void;
    setViewport: (x: number, y: number, width: number, height: number) => void;
    render: (scene: object, camera: object) => void;
  };
  height?: number;
  dpr?: number;
  sceneSize?: (scene: BlitScene) => { width: number; height: number };
  copyPixels?: (scene: BlitScene, width: number, height: number) => void;
};

type CameraControls = { jumpToGoal?: () => void; spherical?: unknown };

function symbolValues(el: object): unknown[] {
  const values: unknown[] = [];
  const seen = new Set<symbol>();
  let current: object | null = el;
  // model-viewer mixes eight features onto its base class, so the renderer
  // getter lives further down the chain than the scene.
  for (let depth = 0; depth < 16 && current; depth++) {
    for (const key of Object.getOwnPropertySymbols(current)) {
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        const desc = Object.getOwnPropertyDescriptor(current, key);
        if (!desc) continue;
        values.push(desc.get ? desc.get.call(el) : desc.value);
      } catch {
        // Some model-viewer getters throw before the scene exists.
      }
    }
    current = Object.getPrototypeOf(current);
  }
  return values;
}

function findScene(el: HTMLElement): BlitScene | undefined {
  for (const value of symbolValues(el)) {
    if (!value || typeof value !== "object") continue;
    const scene = value as BlitScene & { element?: unknown };
    if (scene.element === el && scene.canvas && scene.camera) return scene;
  }
  return undefined;
}

function findRenderer(el: HTMLElement): BlitRenderer | undefined {
  for (const value of symbolValues(el)) {
    if (!value || typeof value !== "object") continue;
    const renderer = value as BlitRenderer;
    if (renderer.threeRenderer && typeof renderer.copyPixels === "function" && typeof renderer.sceneSize === "function") {
      return renderer;
    }
  }
  return undefined;
}

function findControls(el: HTMLElement): CameraControls | undefined {
  for (const value of symbolValues(el)) {
    if (!value || typeof value !== "object") continue;
    const controls = value as CameraControls;
    if (typeof controls.jumpToGoal === "function" && controls.spherical) return controls;
  }
  return undefined;
}

/**
 * Draw this viewer's current Three.js camera into its own canvas.
 *
 * model-viewer keeps one WebGL canvas for every model on the page. A card the
 * user has dragged shows that live frame, while the canvas that belongs to the
 * element can still be an earlier preset. The view transition photographs the
 * element's canvas, so the morph starts from the preset and the model snaps.
 */
export function blitModelViewer(el: HTMLElement): boolean {
  const scene = findScene(el);
  const renderer = findRenderer(el);
  const three = renderer?.threeRenderer;
  if (!scene?.camera || !renderer?.sceneSize || !renderer.copyPixels || !three) return false;
  const { width, height } = renderer.sceneSize(scene);
  if (width < 1 || height < 1) return false;
  try {
    scene.renderShadow?.(three);
    three.autoClear = true;
    three.setRenderTarget(null);
    const y = Math.ceil((renderer.height ?? 0) * (renderer.dpr ?? 1)) - height;
    three.setViewport(0, y, width, height);
    three.render(scene, scene.camera);
    renderer.copyPixels(scene, width, height);
    return true;
  } catch {
    return false;
  }
}

/** Jump the dampers to the goal orbit, then paint that frame into the canvas. */
export function settleAndBlitModelViewer(el: HTMLElement & { loaded?: boolean }): boolean {
  if (!el.loaded) return false;
  const scene = findScene(el) as { jumpToGoal?: () => void } | undefined;
  findControls(el)?.jumpToGoal?.();
  scene?.jumpToGoal?.();
  return blitModelViewer(el);
}

function paintNamedModelViewers(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>(".model-viewer-wrapper").forEach((wrapper) => {
    if (!transitionNameOf(wrapper)) return;
    const el = wrapper.querySelector("model-viewer");
    if (el) blitModelViewer(el);
  });
}

/**
 * Read poses in the instant the browser snapshots the old page, and drop them
 * when that transition finishes — unless a newer one has started.
 *
 * `startViewTransition` returns before that snapshot. Auto-rotate keeps
 * spinning until the browser actually photographs the page, which on a busy
 * frame can be long enough for a visible jump if the pose was read at the call.
 * The update callback runs immediately after the old snapshot, while the
 * outgoing page is still in the DOM.
 *
 * Named models are repainted before that snapshot. Otherwise the photograph is
 * the stale element canvas rather than the frame on screen.
 */
export function installModelPoseHandoff(doc: Document): void {
  const start = doc.startViewTransition as PatchedStart | undefined;
  if (typeof start !== "function" || start[PATCHED]) return;
  const original = start.bind(doc);
  const patched: PatchedStart = (callback) => {
    paintNamedModelViewers(doc);
    let generation = 0;
    const transition = original(() => {
      generation = captureModelPoses(doc);
      if (typeof callback === "function") return callback();
    });
    transition.finished.finally(() => {
      clearModelPoses(generation);
    });
    return transition;
  };
  patched[PATCHED] = true;
  doc.startViewTransition = patched;
}

if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
  installModelPoseHandoff(document);
}

/** Where a copy of an item sits on the item page, aside from the large viewer. */
export type ModelTransitionPlace = "adjacent" | "strip";

let transitionPlaceHint: ModelTransitionPlace | null = null;
let viewTransitionExpected = false;

/** The next navigation was started from a view-transition link or browser back. */
export function expectViewTransition() {
  viewTransitionExpected = true;
}

export function clearViewTransitionExpectation() {
  viewTransitionExpected = false;
}

export function isViewTransitionExpected() {
  return viewTransitionExpected;
}

/**
 * On a normal navigation the loading state ends before the browser paints,
 * so this badge never shows. A view transition holds that loading state until
 * the snapshot, which is long enough to paint it. The morph doesn't need it.
 */
export function shouldShowRouteSpinner(loading: boolean, viewTransition: boolean) {
  return loading && !viewTransition;
}

/** Remember which copy was clicked so only that element is named. */
export function rememberTransitionPlace(place: ModelTransitionPlace) {
  transitionPlaceHint = place;
}

export function preferredTransitionPlace(): ModelTransitionPlace {
  return transitionPlaceHint ?? "adjacent";
}

/**
 * One view-transition-name per item. The large viewer wins for the open item.
 * Previous/next and the bottom strip can show the same other item; the place
 * that was clicked gets the name, and the other copy of the open item uses
 * that same place so the model shrinks back into it.
 */
export function resolveModelTransitionPlace(
  itemKey: string,
  opts: {
    heroKey: string;
    inStrip: boolean;
    inAdjacent: boolean;
    preferred: ModelTransitionPlace;
  }
): ModelTransitionPlace | null {
  if (itemKey === opts.heroKey) return null;
  if (!opts.inStrip && !opts.inAdjacent) return null;
  if (opts.preferred === "strip" && opts.inStrip) return "strip";
  if (opts.preferred === "adjacent" && opts.inAdjacent) return "adjacent";
  if (opts.inStrip) return "strip";
  return "adjacent";
}

/**
 * Shared element name for one model. The same name on the outgoing and
 * incoming pages is what lets the View Transition API grow or shrink it.
 * Names have to be CSS custom idents, so user-supplied ids are sanitized.
 */
export function modelViewTransitionName(userId: string, collectionId: string, itemId: string): string {
  const raw = `model-${userId}-${collectionId}-${itemId}`;
  const safe = raw.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(safe) ? safe : `m_${safe}`;
}

/**
 * Whether this model should be a shared element for the transition that is
 * running. Each flag is the role this copy can play; the `*Active` flags are
 * which URLs are the two ends of the current transition.
 *
 * `home` — homepage preview of a collection's first item, and that same item
 * on the collection page.
 * `userRow` — a preview in the user-page collection row, and the same item on
 * that collection's first page. Every such pair is named, so they move together.
 * `item` — this item's own URL is either end. That covers a collection card,
 * a user-page preview, the item page, previous/next, and the bottom strip.
 */
export function sharedModelTransitionActive(opts: {
  home?: boolean;
  userRow?: boolean;
  item?: boolean;
  homeActive: boolean;
  userActive: boolean;
  collectionActive: boolean;
  itemActive: boolean;
}): boolean {
  const withHome = Boolean(opts.home) && opts.homeActive && opts.collectionActive;
  const withUserRow = Boolean(opts.userRow) && opts.userActive && opts.collectionActive;
  const withItem = Boolean(opts.item) && opts.itemActive;
  return withHome || withUserRow || withItem;
}

export function useModelViewTransitionName(
  ids: { userId: string; collectionId: string; itemId: string },
  opts: { home?: boolean; userRow?: boolean; item?: boolean }
): string | undefined {
  const userPath = `/${ids.userId}`;
  const collectionPath = `/${ids.userId}/${ids.collectionId}`;
  const itemPath = `/${ids.userId}/${ids.collectionId}/${ids.itemId}`;
  const active = sharedModelTransitionActive({
    ...opts,
    homeActive: useViewTransitionState("/"),
    userActive: useViewTransitionState(userPath),
    collectionActive: useViewTransitionState(collectionPath),
    itemActive: useViewTransitionState(itemPath),
  });
  if (!active) return undefined;
  return modelViewTransitionName(ids.userId, ids.collectionId, ids.itemId);
}

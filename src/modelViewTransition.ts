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

/**
 * Orbit string to copy. Auto-rotate does not move the camera, and a dragged
 * camera updates getCameraOrbit() without updating the goal attribute, which
 * stays at model-viewer's default. An explicit goal (set by the app) wins
 * when the live spherical is not ready yet.
 */
export function modelPoseOrbit(pose: ModelPose): string | undefined {
  const goal = pose.cameraOrbit;
  if (goal && goal !== DEFAULT_CAMERA_ORBIT) return goal;
  const liveReady = Number.isFinite(pose.theta) && Number.isFinite(pose.phi) && pose.radius > 0;
  const moved = liveReady && (Math.abs(pose.theta) > 0.02 || Math.abs(pose.phi - DEFAULT_PHI) > 0.02);
  if (moved) return `${pose.theta}rad ${pose.phi}rad ${pose.radius}m`;
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

/**
 * Read poses in the instant before the browser snapshots the old page, and
 * drop them when that transition finishes — unless a newer one has started.
 */
export function installModelPoseHandoff(doc: Document): void {
  const start = doc.startViewTransition as PatchedStart | undefined;
  if (typeof start !== "function" || start[PATCHED]) return;
  const original = start.bind(doc);
  const patched: PatchedStart = (callback) => {
    const generation = captureModelPoses(doc);
    const transition = original(callback);
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
 * Active only while a view transition is running between two screens that
 * show this model, so unrelated models stay part of the page crossfade.
 *
 * `home` — homepage preview of a collection's first item, and that same item
 * on the collection page (transitions between `/` and the collection).
 * `item` — this item's URL is either side of the navigation. That covers a
 * collection card and the item page, and previous/next on the item page.
 */
export function useModelViewTransitionName(
  ids: { userId: string; collectionId: string; itemId: string },
  opts: { home?: boolean; item?: boolean }
): string | undefined {
  const collectionPath = `/${ids.userId}/${ids.collectionId}`;
  const itemPath = `/${ids.userId}/${ids.collectionId}/${ids.itemId}`;
  const homeActive = useViewTransitionState("/");
  const collectionActive = useViewTransitionState(collectionPath);
  const itemActive = useViewTransitionState(itemPath);

  const withHome = Boolean(opts.home) && homeActive && collectionActive;
  const withItem = Boolean(opts.item) && itemActive;
  if (!withHome && !withItem) return undefined;
  return modelViewTransitionName(ids.userId, ids.collectionId, ids.itemId);
}

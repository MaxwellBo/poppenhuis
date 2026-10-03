import { afterEach, describe, expect, it } from "vitest";
import {
  applyModelPose,
  captureModelPoses,
  clearModelPoses,
  installModelPoseHandoff,
  ModelPose,
  ModelPoseTarget,
  peekModelPose,
  readModelPose,
  resolveModelTransitionPlace,
  sharedModelTransitionActive,
  shouldShowRouteSpinner,
} from "./modelViewTransition";

const SPINNING: ModelPose = {
  theta: 0.4,
  phi: 1.2,
  radius: 1.5,
  fov: 30,
  targetX: 0.1,
  targetY: 0.2,
  targetZ: 0.3,
  yaw: 2.2,
};

function fakeViewer(pose: ModelPose): ModelPoseTarget & { jumpCount: number } {
  return {
    turntableRotation: pose.yaw,
    cameraOrbit: "",
    fieldOfView: "",
    cameraTarget: "",
    autoRotate: true,
    jumpCount: 0,
    getCameraOrbit: () => ({ theta: pose.theta, phi: pose.phi, radius: pose.radius }),
    getFieldOfView: () => pose.fov,
    getCameraTarget: () => ({ x: pose.targetX, y: pose.targetY, z: pose.targetZ }),
    resetTurntableRotation(theta = 0) {
      this.turntableRotation = theta;
    },
    jumpCameraToGoal() {
      this.jumpCount += 1;
    },
  };
}

function wrapper(name: string, viewer: ModelPoseTarget): HTMLElement {
  return {
    style: { viewTransitionName: name, getPropertyValue: () => "" },
    querySelector: (selector: string) => (selector === "model-viewer" ? viewer : null),
  } as unknown as HTMLElement;
}

function rootOf(...wrappers: HTMLElement[]): ParentNode {
  return {
    querySelectorAll: () => wrappers,
  } as unknown as ParentNode;
}

describe("route spinner", () => {
  it("stays hidden during a view transition", () => {
    expect(shouldShowRouteSpinner(true, true)).toBe(false);
  });

  it("still shows for a normal load", () => {
    expect(shouldShowRouteSpinner(true, false)).toBe(true);
  });

  it("hides once navigation is idle", () => {
    expect(shouldShowRouteSpinner(false, false)).toBe(false);
  });
});

describe("shared models on a user-to-collection transition", () => {
  const ends = { homeActive: false, userActive: true, collectionActive: true, itemActive: false };

  it("names every preview that is on both pages", () => {
    expect(sharedModelTransitionActive({ ...ends, userRow: true })).toBe(true);
  });

  it("leaves other collections out of that transition", () => {
    expect(sharedModelTransitionActive({ ...ends, collectionActive: false, userRow: true })).toBe(false);
  });

  it("names only the opened item when leaving the user page for an item", () => {
    expect(sharedModelTransitionActive({
      homeActive: false,
      userActive: true,
      collectionActive: false,
      itemActive: false,
      userRow: true,
      item: true,
    })).toBe(false);
    expect(sharedModelTransitionActive({
      homeActive: false,
      userActive: true,
      collectionActive: false,
      itemActive: true,
      userRow: true,
      item: true,
    })).toBe(true);
  });
});

describe("item page transition place", () => {
  const hero = "jackie/cakes/brat";
  const other = "jackie/cakes/meringue-stack";

  it("names the bottom strip when that copy was clicked", () => {
    expect(resolveModelTransitionPlace(other, {
      heroKey: hero,
      inStrip: true,
      inAdjacent: true,
      preferred: "strip",
    })).toBe("strip");
  });

  it("names the side thumbnail when that copy was clicked", () => {
    expect(resolveModelTransitionPlace(other, {
      heroKey: hero,
      inStrip: true,
      inAdjacent: true,
      preferred: "adjacent",
    })).toBe("adjacent");
  });

  it("falls back when the preferred copy is not on the page", () => {
    expect(resolveModelTransitionPlace(other, {
      heroKey: hero,
      inStrip: false,
      inAdjacent: true,
      preferred: "strip",
    })).toBe("adjacent");
  });

  it("does not name the open item's extra copies", () => {
    expect(resolveModelTransitionPlace(hero, {
      heroKey: hero,
      inStrip: true,
      inAdjacent: false,
      preferred: "strip",
    })).toBeNull();
  });
});

describe("model pose handoff", () => {
  afterEach(() => {
    clearModelPoses();
  });

  it("reads the turntable yaw separately from the camera orbit", () => {
    const viewer = fakeViewer(SPINNING);
    expect(readModelPose(viewer)?.yaw).toBe(2.2);
    expect(readModelPose({})).toBeUndefined();
  });

  it("copies the outgoing pose onto the incoming viewer and stops auto-rotate", () => {
    const outgoing = fakeViewer(SPINNING);
    captureModelPoses(rootOf(wrapper("model-jackie-cakes-brat", outgoing)));

    const incoming = fakeViewer({ ...SPINNING, yaw: 0, theta: 0, phi: 1, radius: 2, fov: 45, targetX: 0, targetY: 0, targetZ: 0 });
    const pose = peekModelPose("model-jackie-cakes-brat");
    expect(pose?.yaw).toBe(2.2);
    expect(applyModelPose(incoming, pose!)).toBe(true);
    expect(incoming.turntableRotation).toBe(2.2);
    expect(incoming.autoRotate).toBe(false);
    expect(incoming.cameraOrbit).toBe("0.4rad 1.2rad 1.5m");
    expect(incoming.fieldOfView).toBe("30deg");
    expect(incoming.cameraTarget).toBe("0.1m 0.2m 0.3m");
    expect(incoming.jumpCount).toBe(1);
  });

  it("keeps an explicit camera-orbit goal when the live radius is not ready", () => {
    const outgoing = fakeViewer({ ...SPINNING, radius: 0, theta: 0, phi: 0 });
    outgoing.cameraOrbit = "1.7rad 0.9rad 2m";
    captureModelPoses(rootOf(wrapper("model-a", outgoing)));
    const incoming = fakeViewer({ ...SPINNING, yaw: 0, radius: 0, theta: 0, phi: 0 });
    const pose = peekModelPose("model-a");
    expect(applyModelPose(incoming, pose!)).toBe(true);
    expect(incoming.turntableRotation).toBe(2.2);
    expect(incoming.cameraOrbit).toBe("1.7rad 0.9rad 2m");
  });

  it("does not apply a pose captured for a different model", () => {
    captureModelPoses(rootOf(wrapper("model-a", fakeViewer(SPINNING))));
    expect(peekModelPose("model-b")).toBeUndefined();
  });

  it("reads the pose when the old page is snapshotted, after startViewTransition returns", () => {
    const viewer = fakeViewer(SPINNING);
    let snapshot = () => {};
    const doc = {
      querySelectorAll: () => [wrapper("model-a", viewer)],
      startViewTransition: (callback: () => void) => {
        snapshot = callback;
        return { finished: new Promise(() => {}) };
      },
    } as unknown as Document;

    installModelPoseHandoff(doc);
    doc.startViewTransition(() => {});
    expect(peekModelPose("model-a")).toBeUndefined();

    viewer.turntableRotation = 4;
    snapshot();
    expect(peekModelPose("model-a")?.yaw).toBe(4);
  });

  it("ignores a finished transition that is older than the current capture", async () => {
    const first = deferred();
    const second = deferred();
    const doc = {
      querySelectorAll: () => [wrapper("model-a", fakeViewer(SPINNING))],
      startViewTransition: (callback: () => void) => {
        callback();
        return { finished: first.promise };
      },
    } as unknown as Document;

    installModelPoseHandoff(doc);
    doc.startViewTransition(() => {});
    expect(peekModelPose("model-a")?.yaw).toBe(2.2);

    const later = fakeViewer({ ...SPINNING, yaw: 4 });
    (doc as unknown as { querySelectorAll: () => HTMLElement[] }).querySelectorAll = () => [wrapper("model-a", later)];
    const secondStart = Object.assign(
      (callback: () => void) => {
        callback();
        return { finished: second.promise };
      },
      {}
    );
    const nextDoc = {
      querySelectorAll: () => [wrapper("model-a", later)],
      startViewTransition: secondStart,
    } as unknown as Document;
    installModelPoseHandoff(nextDoc);
    nextDoc.startViewTransition(() => {});
    expect(peekModelPose("model-a")?.yaw).toBe(4);

    first.resolve();
    await first.promise;
    await Promise.resolve();
    expect(peekModelPose("model-a")?.yaw).toBe(4);

    second.resolve();
    await second.promise;
    await Promise.resolve();
    expect(peekModelPose("model-a")).toBeUndefined();
  });
});

function deferred() {
  let resolve: () => void = () => {};
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

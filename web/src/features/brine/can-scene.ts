import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { CanPose, TiltBlend } from './can-choreography';

export interface CanTextures {
  wrap: string;
  lid: string;
}

/** Additive offsets layered on top of the scroll pose. */
export interface CanOffsets {
  /** pointer, -1..1 */
  px: number;
  py: number;
  /** smoothed scroll velocity, -1..1 */
  vel: number;
  /** extra yaw from dragging, radians */
  spin: number;
  /** idle float phase amount, 0..1 */
  bob: number;
}

export interface CanSceneOptions {
  compact: boolean;
  onProgress: (loaded: number) => void;
  onContextLost: () => void;
}

export interface CanScene {
  ready: Promise<void>;
  pose: CanPose;
  offsets: CanOffsets;
  setPose: (pose: CanPose, blend?: TiltBlend) => void;
  render: (immediate?: boolean) => void;
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

/** theta 0 of the cylinder faces the camera; this turn puts wrap u≈0.8 (Persian front) there. */
const LABEL_TURN = -Math.PI * 2 * 0.8;
const RADIUS = 1;
const HEIGHT = RADIUS * 2 * 0.482;
const FOV = 22;
const CAMERA_Z = 14;
const FALLBACK_BYTES = 400_000;

function shadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(4,30,45,0.6)');
    gradient.addColorStop(0.4, 'rgba(4,30,45,0.25)');
    gradient.addColorStop(1, 'rgba(4,30,45,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

async function fetchTexture(url: string, loader: THREE.TextureLoader, progress: (loaded: number, total: number) => void) {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`Texture request failed: ${response.status}`);
  const total = Number(response.headers.get('content-length')) || FALLBACK_BYTES;
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    progress(Math.min(loaded, total), total);
  }
  progress(total, total);
  const objectUrl = URL.createObjectURL(new Blob(chunks, { type: response.headers.get('content-type') ?? 'image/jpeg' }));
  try {
    return await loader.loadAsync(objectUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function createCanScene(host: HTMLElement, assets: CanTextures, options: CanSceneOptions): CanScene {
  const { compact } = options;
  const maxRatio = compact ? 1.75 : 1.5;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.03);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xf4fbfe, 0x123a55, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-4, 6, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe9fb, 0.6);
  fill.position.set(6, -1, 6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4);
  rim.position.set(3, 3, -6);
  scene.add(rim);

  /** placement (screen position, scale) → tilt → spin */
  const placement = new THREE.Group();
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  const tiltEuler = new THREE.Euler(0, 0, 0, 'XYZ');
  const fromTilt = new THREE.Quaternion();
  const toTilt = new THREE.Quaternion();
  placement.add(tilt);
  tilt.add(spin);
  scene.add(placement);

  const shadowMap = shadowTexture();
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.55), shadowMaterial);
  shadow.renderOrder = -1;
  placement.add(shadow);

  const pose: CanPose = { x: 0, y: 0, d: 300, yaw: 0, pitch: 0.4, roll: 0, alpha: 1, shadow: 1 };
  const offsets: CanOffsets = { px: 0, py: 0, vel: 0, spin: 0, bob: 0 };
  let tiltBlend: TiltBlend | undefined;
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [shadowMaterial];
  let disposed = false;
  let visible = true;
  let loaded = false;
  let frame = 0;
  let width = 1;
  let height = 1;

  function apply() {
    const viewHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const worldPerPx = viewHeight / height;
    const time = performance.now() / 1000;
    const bob = offsets.bob;
    const floatY = Math.sin(time * 1.1) * 0.012 * pose.d * bob;
    const x = pose.x + offsets.px * pose.d * 0.025;
    const y = pose.y + floatY;
    placement.position.set((x - width / 2) * worldPerPx, (height / 2 - y) * worldPerPx, 0);
    placement.scale.setScalar(Math.max(0.0001, (pose.d / 2) * worldPerPx));
    const vel = offsets.vel;
    const pitchOffset = offsets.py * 0.08 + vel * 0.12 + Math.sin(time * 0.8) * 0.02 * bob;
    const rollOffset = vel * 0.1 + Math.sin(time * 0.6) * 0.025 * bob;
    if (tiltBlend) {
      const { from, to, progress } = tiltBlend;
      fromTilt.setFromEuler(tiltEuler.set(from.pitch + pitchOffset, 0, from.roll + rollOffset));
      toTilt.setFromEuler(tiltEuler.set(to.pitch + pitchOffset, 0, to.roll + rollOffset));
      tilt.quaternion.slerpQuaternions(fromTilt, toTilt, progress);
    } else {
      tilt.rotation.set(pose.pitch + pitchOffset, 0, pose.roll + rollOffset, 'XYZ');
    }
    spin.rotation.y = pose.yaw + offsets.px * 0.18 + offsets.spin + vel * 0.35;
    renderer.domElement.style.opacity = String(THREE.MathUtils.clamp(pose.alpha, 0, 1));
    const lean = Math.min(1, Math.abs(pose.pitch) / 1.2);
    shadowMaterial.opacity = THREE.MathUtils.clamp(pose.shadow, 0, 1) * 0.9 * (1 - lean * 0.6);
    shadow.position.set(0, -HEIGHT / 2 - 0.4 - pose.pitch * 0.25, -1.2);
  }

  function draw() {
    frame = 0;
    if (disposed || !visible || !loaded || document.hidden) return;
    apply();
    renderer.render(scene, camera);
  }

  function render(immediate = false) {
    if (disposed || !visible || !loaded) return;
    if (immediate) {
      cancelAnimationFrame(frame);
      draw();
    } else if (!frame) frame = requestAnimationFrame(draw);
  }

  function resize() {
    if (disposed) return;
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibilityChanged = () => render();
  document.addEventListener('visibilitychange', visibilityChanged);
  const lost = (event: Event) => {
    event.preventDefault();
    visible = false;
    options.onContextLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);

  const loader = new THREE.TextureLoader();
  const sources = [assets.wrap, assets.lid];
  const totals = sources.map(() => FALLBACK_BYTES);
  const progress = sources.map(() => 0);
  const report = (index: number) => (loadedBytes: number, total: number) => {
    totals[index] = total;
    progress[index] = loadedBytes;
    const sum = totals.reduce((a, b) => a + b, 0);
    options.onProgress(progress.reduce((a, b) => a + b, 0) / sum);
  };

  const ready = Promise.all(sources.map((url, index) => fetchTexture(url, loader, report(index)))).then(([wrap, lid]) => {
    textures.push(wrap, lid);
    if (disposed) return;
    const anisotropy = Math.min(compact ? 4 : 12, renderer.capabilities.getMaxAnisotropy());
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
    }
    wrap.wrapS = THREE.RepeatWrapping;
    lid.center.set(0.5, 0.5);
    lid.repeat.set(0.94, 0.94);
    lid.offset.set(0.03, 0.03);

    const segments = compact ? 96 : 160;
    const label = new THREE.MeshPhysicalMaterial({ map: wrap, roughness: 0.4, metalness: 0.06, clearcoat: 0.8, clearcoatRoughness: 0.25 });
    const steel = new THREE.MeshPhysicalMaterial({ color: 0xdfe6ea, metalness: 1, roughness: 0.22, clearcoat: 0.3, side: THREE.DoubleSide });
    /* unlit so the lid reads exactly like the loader artwork at the top-view handoff */
    const lidPrint = new THREE.MeshBasicMaterial({ map: lid, toneMapped: false });
    materials.push(label, steel, lidPrint);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, segments, 1, true), label);
    body.rotation.y = LABEL_TURN;
    spin.add(body);

    const rimProfile = (y: number, flip: number) => {
      const points = [
        new THREE.Vector2(RADIUS - 0.002, y - flip * 0.012),
        new THREE.Vector2(RADIUS + 0.028, y + flip * 0.004),
        new THREE.Vector2(RADIUS + 0.034, y + flip * 0.03),
        new THREE.Vector2(RADIUS + 0.012, y + flip * 0.052),
        new THREE.Vector2(RADIUS - 0.05, y + flip * 0.048),
        new THREE.Vector2(RADIUS - 0.07, y + flip * 0.02),
      ];
      return new THREE.LatheGeometry(flip > 0 ? points : points.reverse(), segments);
    };
    spin.add(new THREE.Mesh(rimProfile(HEIGHT / 2, 1), steel));
    spin.add(new THREE.Mesh(rimProfile(-HEIGHT / 2, -1), steel));

    const top = new THREE.Mesh(new THREE.CircleGeometry(RADIUS - 0.07, segments), lidPrint);
    top.rotation.x = -Math.PI / 2;
    top.position.y = HEIGHT / 2 + 0.022;
    spin.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RADIUS - 0.16, 0.012, 10, segments), steel);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = HEIGHT / 2 + 0.026;
    spin.add(ring);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(RADIUS - 0.07, 64), steel);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.y = -HEIGHT / 2 - 0.02;
    spin.add(bottom);

    loaded = true;
    resize();
    apply();
    renderer.compile(scene, camera);
    draw();
  }).catch((error: unknown) => {
    textures.forEach((texture) => texture.dispose());
    textures.length = 0;
    throw error;
  });

  return {
    ready,
    pose,
    offsets,
    setPose(next, blend) {
      Object.assign(pose, next);
      tiltBlend = blend;
    },
    render,
    setVisible(value) {
      visible = value;
      if (value) render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      shadowMap.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

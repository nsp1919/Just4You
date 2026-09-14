import * as THREE from "three";

export interface RevealScene {
  setOpen: (opened: boolean, instant: boolean) => void;
  dispose: () => void;
}

export function createRevealScene(host: HTMLDivElement, kind: "gift" | "envelope", onLost: () => void): RevealScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  camera.position.set(0, 1.25, 7.8);
  camera.lookAt(0, 0.4, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb0788b, 2.8));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 5, 5);
  scene.add(light);
  const root = new THREE.Group();
  root.rotation.y = kind === "gift" ? -0.4 : -0.1;
  scene.add(root);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let disposed = false;
  let frame = 0;
  let progress = 0;

  function surface(color: string, metalness = 0) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness, side: THREE.DoubleSide });
    materials.push(material);
    return material;
  }
  function mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Group, position: [number, number, number], metalness = 0) {
    geometries.push(geometry);
    const object = new THREE.Mesh(geometry, surface(color, metalness));
    object.position.set(...position);
    parent.add(object);
    return object;
  }
  function box(size: [number, number, number], color: string, parent: THREE.Group, position: [number, number, number], metalness = 0) {
    return mesh(new THREE.BoxGeometry(...size), color, parent, position, metalness);
  }
  const moving = new THREE.Group();
  const paper = new THREE.Group();
  root.add(moving, paper);
  if (kind === "gift") {
    box([1.9, 0.12, 1.65], "#b8325c", root, [0, -0.68, 0]);
    box([1.9, 1.3, 0.09], "#d54d74", root, [0, 0, 0.78]);
    box([1.9, 1.3, 0.09], "#d54d74", root, [0, 0, -0.78]);
    box([0.09, 1.3, 1.65], "#bf3863", root, [-0.905, 0, 0]);
    box([0.09, 1.3, 1.65], "#bf3863", root, [0.905, 0, 0]);
    box([0.24, 1.3, 0.012], "#f9d484", root, [0, 0, 0.831], 0.5);
    box([2.03, 0.2, 1.78], "#ed7893", moving, [0, 0, 0]);
    box([0.25, 0.21, 1.8], "#f9d484", moving, [0, 0.005, 0], 0.5);
    box([2.05, 0.212, 0.22], "#f9d484", moving, [0, 0.006, 0], 0.5);
    for (const direction of [-1, 1]) {
      const bow = mesh(new THREE.TorusGeometry(0.26, 0.065, 8, 32), "#f9d484", moving, [direction * 0.25, 0.25, 0], 0.4);
      bow.scale.set(1.25, 0.7, 1);
      bow.rotation.z = direction * 0.35;
    }
    box([0.92, 0.64, 0.04], "#fff8ee", paper, [0, 0, 0]);
    box([0.35, 0.035, 0.01], "#c95d7d", paper, [0, 0.02, 0.025]);
    box([0.52, 0.025, 0.01], "#d9a9b6", paper, [0, -0.08, 0.025]);
  } else {
    box([2.65, 1.56, 0.1], "#dc7893", root, [0, 0, -0.08]);
    box([2.30, 1.30, 0.03], "#fff8ed", paper, [0, 0, 0]);
    for (let line = 0; line < 4; line++) box([1.4 - line * 0.13, 0.028, 0.01], "#d0a5a9", paper, [-0.15, 0.3 - line * 0.15, 0.03]);
    const flap = new THREE.Shape();
    flap.moveTo(-1.325, 0);
    flap.lineTo(1.325, 0);
    flap.lineTo(0, -0.87);
    flap.closePath();
    mesh(new THREE.ShapeGeometry(flap), "#ed9aaf", moving, [0, 0, 0]);
    const pocket = new THREE.Shape();
    pocket.moveTo(-1.325, -0.78);
    pocket.lineTo(1.325, -0.78);
    pocket.lineTo(1.325, 0.58);
    pocket.lineTo(0, -0.28);
    pocket.lineTo(-1.325, 0.58);
    pocket.closePath();
    mesh(new THREE.ShapeGeometry(pocket), "#ce6385", root, [0, 0, 0.10]);
    const seal = mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 40), "#a7244c", moving, [0, -0.72, 0.04], 0.25);
    seal.rotation.x = Math.PI / 2;
  }

  function draw(value: number) {
    progress = value;
    if (kind === "gift") {
      moving.position.set(value * -0.2, 0.72 + value * 1.2, -value * 0.5);
      moving.rotation.set(-value * 0.35, 0, -value * 0.16);
      paper.position.set(0, -0.25 + value * 1.32, 0);
      paper.rotation.z = value * 0.12;
      paper.visible = value > 0.12;
    } else {
      moving.position.set(0, 0.78, 0.12);
      moving.rotation.x = -Math.min(1, value * 1.8) * Math.PI;
      paper.position.set(0, Math.max(0, value - 0.35) * 1.15, 0.02);
    }
    renderer.render(scene, camera);
  }
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.z = Math.max(7.8, 4.4 / camera.aspect);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw(progress);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  function lost(event: Event) { event.preventDefault(); cancelAnimationFrame(frame); onLost(); }
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  return {
    setOpen(opened, instant) {
      cancelAnimationFrame(frame);
      const destination = opened ? 1 : 0;
      if (instant) { draw(destination); return; }
      const from = progress;
      const start = performance.now();
      function tick(now: number) {
        if (disposed) return;
        const time = Math.min(1, (now - start) / 1100);
        const eased = time * time * (3 - 2 * time);
        draw(from + (destination - from) * eased);
        if (time < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
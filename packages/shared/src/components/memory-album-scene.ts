import * as THREE from "three";

export interface AlbumScene {
  show: (index: number) => void;
  dispose: () => void;
}

export function createAlbumScene(host: HTMLDivElement, sources: string[], cover: string, onReady: (ready: boolean) => void): AlbumScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2.5, 2.5, 1.7, -1.7, 0.1, 30);
  camera.position.set(0, 0, 9);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb4adac, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 5, 8);
  scene.add(light);
  const book = new THREE.Group();
  scene.add(book);
  const pages = new THREE.Group();
  book.add(pages);
  const loader = new THREE.TextureLoader();
  const textures = new Map<string, THREE.Texture>();
  const pending = new Map<string, Promise<THREE.Texture>>();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let disposed = false;
  let frame = 0;
  let current = -1;
  let request = 0;
  let compact = false;
  let stopTurn: (() => void) | null = null;

  function render() {
    if (!disposed) renderer.render(scene, camera);
  }

  function material(color: string) {
    const result = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
    materials.push(result);
    return result;
  }

  function box(width: number, height: number, depth: number, color: string, parent: THREE.Group, centerX: number, depthZ: number) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(centerX, 0, depthZ);
    parent.add(mesh);
    return mesh;
  }

  box(4.22, 2.91, 0.1, cover, book, 0, -0.17);
  for (let layer = 0; layer < 5; layer++) {
    box(2.01, 2.73, 0.017, layer % 2 ? "#d8d7d2" : "#fffefa", book, -1.025, -0.10 + layer * 0.019);
    box(2.01, 2.73, 0.017, layer % 2 ? "#d8d7d2" : "#fffefa", book, 1.025, -0.10 + layer * 0.019);
  }
  box(0.045, 2.78, 0.035, cover, book, 0, 0.01);

  function load(source: string): Promise<THREE.Texture> {
    const cached = textures.get(source);
    if (cached) return Promise.resolve(cached);
    const inFlight = pending.get(source);
    if (inFlight) return inFlight;
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(source, (texture) => {
        pending.delete(source);
        if (disposed) { texture.dispose(); reject(new Error("Album disposed")); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
        textures.set(source, texture);
        resolve(texture);
      }, undefined, (error) => { pending.delete(source); reject(error); });
    });
    pending.set(source, promise);
    return promise;
  }

  function page(photoIndex: number, side: number): THREE.Group {
    const group = new THREE.Group();
    const paper = new THREE.PlaneGeometry(2, 2.7, 28, 1);
    paper.translate(1.025, 0, 0);
    geometries.push(paper);
    const paperMaterial = material("#fffefa");
    paperMaterial.side = THREE.DoubleSide;
    group.add(new THREE.Mesh(paper, paperMaterial));
    const texture = textures.get(sources[photoIndex]);
    if (texture) {
      const image = texture.image as { width: number; height: number };
      const ratio = image.width / image.height;
      const width = Math.min(1.72, 2.27 * ratio);
      const height = width / ratio;
      const geometry = new THREE.PlaneGeometry(width, height, 28, 1);
      geometry.translate(1.025, 0.025, 0.008);
      geometries.push(geometry);
      const photoMaterial = new THREE.MeshBasicMaterial({ map: texture });
      materials.push(photoMaterial);
      group.add(new THREE.Mesh(geometry, photoMaterial));
    }
    if (side < 0) {
      group.position.x = -2.05;
    }
    group.position.z = 0.04;
    return group;
  }

  function clearPages() {
    for (const child of [...pages.children]) {
      child.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const index = geometries.indexOf(object.geometry);
          if (index >= 0) geometries.splice(index, 1);
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
          for (const meshMaterial of meshMaterials) {
            meshMaterial.dispose();
            const materialIndex = materials.indexOf(meshMaterial);
            if (materialIndex >= 0) materials.splice(materialIndex, 1);
          }
        }
      });
      pages.remove(child);
    }
  }

  function settle(index: number) {
    clearPages();
    pages.add(page(index - 1, -1), page(index, 1));
    render();
  }

  function turn(previous: number, next: number) {
    clearPages();
    const forward = next > previous;
    pages.add(page(forward ? next - 1 : previous - 1, -1), page(forward ? next : previous, 1));
    const leaf = page(forward ? previous : next, 1);
    leaf.position.z = 0.09;
    pages.add(leaf);
    const start = performance.now();
    const duration = 650;
    const finish = () => {
      cancelAnimationFrame(frame);
      stopTurn = null;
      settle(next);
    };
    stopTurn = finish;
    function tick(now: number) {
      if (disposed) return;
      const progress = Math.min(1, (now - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      leaf.rotation.y = -Math.PI * (forward ? eased : 1 - eased);
      leaf.position.z = 0.09 + Math.sin(progress * Math.PI) * 0.06;
      for (const child of leaf.children) {
        if (!(child instanceof THREE.Mesh)) continue;
        const positions = child.geometry.attributes.position;
        for (let vertex = 0; vertex < positions.count; vertex++) {
          const coordinateX = positions.getX(vertex);
          const base = child.material instanceof THREE.MeshBasicMaterial ? 0.008 : 0;
          positions.setZ(vertex, base + Math.sin(coordinateX / 2.05 * Math.PI) * Math.sin(progress * Math.PI) * 0.16);
        }
        positions.needsUpdate = true;
        child.geometry.computeVertexNormals();
      }
      render();
      if (progress < 1) frame = requestAnimationFrame(tick);
      else finish();
    }
    frame = requestAnimationFrame(tick);
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    compact = window.matchMedia("(max-width: 600px)").matches;
    renderer.clippingPlanes = compact ? [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)] : [];
    const ratio = width / height;
    const viewHeight = Math.max(3.2, (compact ? 2.38 : 4.65) / ratio);
    camera.left = -viewHeight * ratio / 2;
    camera.right = viewHeight * ratio / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.position.x = compact ? 1.025 : 0;
    book.rotation.set(compact ? 0 : -0.07, compact ? 0 : -0.04, compact ? 0 : -0.025);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }

  function contextLost(event: Event) {
    event.preventDefault();
    onReady(false);
    cancelAnimationFrame(frame);
  }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  return {
    show(index: number) {
      if (disposed || index < 0 || index >= sources.length || index === current) return;
      const token = ++request;
      onReady(false);
      const needed: Promise<THREE.Texture | null>[] = [load(sources[index])];
      if (index > 0) needed.push(load(sources[index - 1]).catch(() => null));
      void Promise.all(needed).then(() => {
        if (disposed || token !== request) return;
        stopTurn?.();
        const previous = current;
        current = index;
        if (previous >= 0 && Math.abs(index - previous) === 1) turn(previous, index);
        else settle(index);
        onReady(true);
        if (index + 1 < sources.length) void load(sources[index + 1]).catch(() => {});
      }).catch(() => {
        if (!disposed && token === request) onReady(false);
      });
    },
    dispose() {
      disposed = true;
      request++;
      observer.disconnect();
      cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      for (const geometry of geometries) geometry.dispose();
      for (const meshMaterial of materials) meshMaterial.dispose();
      for (const texture of textures.values()) texture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
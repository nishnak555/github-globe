"use client";

import { useEffect, useRef, useState } from "react";
import {
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  CylinderGeometry,
  SphereGeometry,
  PerspectiveCamera,
  Vector3,
  Raycaster,
  Vector2,
  Object3D,
} from "three";

import ThreeGlobe from "three-globe";
import { Canvas, extend, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import countries from "@/data/globe.json";

extend({ ThreeGlobe });

/* -------------------------------------------------------------------------- */
/*                               TYPES                                         */
/* -------------------------------------------------------------------------- */

export interface PlayerInfo {
  name: string;
  team: string;
  country: string;
  image: string;
  lat: number;
  lng: number;
  color: string;
}

interface WorldProps {
  globeConfig: any;
  data: PlayerInfo[];
  onPinClick?: (
    info: PlayerInfo | null,
    headPos: Vector3 | null,
    camera: PerspectiveCamera | null
  ) => void;
}

interface GlobeProps {
  globeConfig: any;
  data: PlayerInfo[];
  addPinToScene: (pin: Object3D) => void;
}

/* -------------------------------------------------------------------------- */
/*                         HELPERS / ANIMATIONS                               */
/* -------------------------------------------------------------------------- */

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function tweenScale(mesh: Object3D, target: number, duration = 180) {
  const start = mesh.scale.x;
  const end = target;
  let startTime: number | null = null;

  function animate(time: number) {
    if (startTime === null) startTime = time;

    const progress = Math.min((time - startTime) / duration, 1);
    const eased = start + (end - start) * easeOutCubic(progress);

    mesh.scale.set(eased, eased, eased);

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function latLngToXYZ(lat: number, lng: number, radius = 100) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  return new Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * (Math.sin(phi) * Math.sin(theta))
  );
}

/* -------------------------------------------------------------------------- */
/*                              CREATE PIN HEAD + STEM                         */
/* -------------------------------------------------------------------------- */

function createPin(color: string): Group {
  const group = new Group();

  const head = new Mesh(
    new SphereGeometry(4.4, 48, 48),
    new MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.28,
      emissive: color,
      emissiveIntensity: 0.25,
    })
  );
  head.position.y = 10;

  const stem = new Mesh(
    new CylinderGeometry(0.28, 0.28, 16, 32),
    new MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.15,
    })
  );
  stem.position.y = 2;

  group.add(head);
  group.add(stem);

  (group.userData as any).head = head;

  return group;
}

/* -------------------------------------------------------------------------- */
/*                             PIN HOVER HANDLER                               */
/* -------------------------------------------------------------------------- */

function PinHoverHandler({
  pinsRef,
  camera,
  onPinHover,
}: {
  pinsRef: React.MutableRefObject<Object3D[]>;
  camera: PerspectiveCamera;
  onPinHover?: (
    info: PlayerInfo | null,
    headPos: Vector3 | null,
    camera: PerspectiveCamera | null
  ) => void;
}) {
  const { gl } = useThree();
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  let lastHoveredPin: Object3D | null = null;
  let shrinkTimeout: number | null = null;

  useEffect(() => {
    const handleMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();

      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinsRef.current, true);

      // No pin hovered
      if (!hits.length) {
        if (lastHoveredPin) {
          const head = (lastHoveredPin.userData as any).head;
          if (head) tweenScale(head, 1.0, 180);

          lastHoveredPin = null;
        }

        onPinHover?.(null, null, null);
        return;
      }

      // Hover IN - find the pin group
      let obj: Object3D | null = hits[0].object;
      while (obj && !pinsRef.current.includes(obj)) obj = obj.parent;
      if (!obj) return;

      const pin = obj;

      if (pin === lastHoveredPin) return;

      // Reset previous pin
      if (lastHoveredPin) {
        const prev = (lastHoveredPin.userData as any).head;
        if (prev) tweenScale(prev, 1.0, 180);
      }

      lastHoveredPin = pin;

      const head = (pin.userData as any).head;
      if (head) {
        tweenScale(head, 2, 0.2);

        shrinkTimeout = window.setTimeout(() => {
          tweenScale(head, 1.0, 200);
        }, 1000);
      }

      // Correct player info
      const info = (pin.userData as any).player as PlayerInfo;

      const headLocal = new Vector3(0, 10, 0);
      const headWorld = pin.localToWorld(headLocal.clone());

      onPinHover?.(info, headWorld, camera);
    };

    gl.domElement.addEventListener("pointermove", handleMove);
    return () => gl.domElement.removeEventListener("pointermove", handleMove);
  }, [gl, camera, onPinHover]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                  WORLD                                      */
/* -------------------------------------------------------------------------- */

export function World({ globeConfig, data, onPinClick }: WorldProps) {
  const [camera] = useState(() => new PerspectiveCamera(45, 1.2, 0.1, 1000));
  const pinsRef = useRef<Object3D[]>([]);

  useEffect(() => {
    camera.position.set(0, 0, 330);
  }, [camera]);

  const addPinToScene = (pin: Object3D) => {
    pinsRef.current.push(pin);
  };

  return (
    <Canvas camera={camera} gl={{ antialias: true, alpha: true }}>
      <ambientLight
        intensity={globeConfig.ambientLightIntensity}
        color={globeConfig.ambientLight}
      />

      <directionalLight
        position={[0, 400, 300]}
        intensity={globeConfig.pointLightIntensity}
        color={globeConfig.pointLightColor}
      />

      <Globe
        globeConfig={globeConfig}
        data={data}
        addPinToScene={addPinToScene}
      />

      <PinHoverHandler
        pinsRef={pinsRef}
        camera={camera}
        onPinHover={onPinClick}
      />

      <OrbitControls
        enableZoom={false}
        enableRotate={false}
        enablePan={false}
      />
    </Canvas>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  GLOBE                                      */
/* -------------------------------------------------------------------------- */

export function Globe({ globeConfig, data, addPinToScene }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const groupRef = useRef<Group | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize ThreeGlobe
  useEffect(() => {
    if (groupRef.current && !globeRef.current) {
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current);
      setReady(true);
    }
  }, []);

  // Material settings
  useEffect(() => {
    if (!ready) return;

    const mat = globeRef.current.globeMaterial();
    mat.color = new Color(globeConfig.globeColor);
    mat.emissive = new Color(globeConfig.emissive);
    mat.emissiveIntensity = globeConfig.emissiveIntensity;
    mat.shininess = globeConfig.shininess;
    mat.specular = new Color("#ffffff");
  }, [ready, globeConfig]);

  // Add polygons & pins
  useEffect(() => {
    if (!ready) return;

    globeRef.current
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.5)
      .showAtmosphere(true)
      .atmosphereColor(globeConfig.atmosphereColor)
      .atmosphereAltitude(globeConfig.atmosphereAltitude)
      .hexPolygonColor(() => globeConfig.polygonColor);

    data.forEach((p) => {
      const pin = createPin(p.color);
      const pos = latLngToXYZ(p.lat, p.lng, 100);

      pin.position.copy(pos);

      // Store player & head on the pin
      (pin.userData as any).player = p;
      (pin.userData as any).head = pin.children[0];

      addPinToScene(pin);
      groupRef.current!.add(pin);
    });
  }, [ready, data, globeConfig]);

  return <group ref={groupRef} />;
}

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
/*                                   TYPES                                    */
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
    info: PlayerInfo,
    headPos: Vector3,
    camera: PerspectiveCamera
  ) => void;
}

interface GlobeProps {
  globeConfig: any;
  data: PlayerInfo[];
  addPinToScene: (pin: Object3D) => void;
}

/* -------------------------------------------------------------------------- */
/*                                CREATE PIN                                   */
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

  return group;
}

/* -------------------------------------------------------------------------- */
/*                           LAT/LNG → XYZ                                   */
/* -------------------------------------------------------------------------- */

function latLngToXYZ(lat: number, lng: number, radius = 100): Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  return new Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* -------------------------------------------------------------------------- */
/*                             PIN CLICK HANDLER                               */
/* -------------------------------------------------------------------------- */

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
    info: PlayerInfo,
    headPos: Vector3,
    camera: PerspectiveCamera
  ) => void;
}) {
  const { gl } = useThree();
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  let lastHovered: Object3D | null = null;

  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pinsRef.current, true);

      if (!hits.length) {
        lastHovered = null;
        return;
      }

      const hit = hits[0].object;

      if (hit === lastHovered) return; // prevent firing repeatedly
      lastHovered = hit;

      const headLocal = new Vector3(0, 10, 0);
      const headWorld = hit.localToWorld(headLocal.clone());

      const info = hit.userData as PlayerInfo;

      onPinHover?.(info, headWorld, camera);
    };

    gl.domElement.addEventListener("pointermove", onMove);
    return () => gl.domElement.removeEventListener("pointermove", onMove);
  }, [gl, camera, onPinHover]);

  return null;
}


/* -------------------------------------------------------------------------- */
/*                                   WORLD                                    */
/* -------------------------------------------------------------------------- */

export function World({ globeConfig, data, onPinClick }: WorldProps) {
  const [camera] = useState(() => new PerspectiveCamera(45, 1.2, 0.1, 2000));
  const pinsRef = useRef<Object3D[]>([]);

  useEffect(() => {
    camera.position.set(0, 0, 330);
  }, [camera]);

  const addPinToScene = (pin: Object3D) => pinsRef.current.push(pin);

  return (
    <Canvas camera={camera} gl={{ antialias: true, alpha: true }}>
      {/* Ambient fill → bright glossy top */}
      <ambientLight
        intensity={globeConfig.ambientLightIntensity}
        color={globeConfig.ambientLight}
      />

      {/* Main top light → glossy silver highlight */}
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
/*                                   GLOBE                                     */
/* -------------------------------------------------------------------------- */

export function Globe({ globeConfig, data, addPinToScene }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const groupRef = useRef<Group | null>(null);
  const [ready, setReady] = useState(false);

  /* Init ThreeGlobe */
  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current);
      setReady(true);
    }
  }, []);

  /* Material updates */
  useEffect(() => {
    if (!ready) return;

    const mat = globeRef.current.globeMaterial();

    mat.color = new Color(globeConfig.globeColor);
    mat.emissive = new Color(globeConfig.emissive);
    mat.emissiveIntensity = globeConfig.emissiveIntensity;
    mat.shininess = globeConfig.shininess;
    mat.specular = new Color("#ffffff"); // glossy white highlight
  }, [ready, globeConfig]);

  /* Atmosphere + polygons + pins */
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

    /* Add pins */
    data.forEach((p) => {
      const pin = createPin(p.color);
      const pos = latLngToXYZ(p.lat, p.lng, 100);

      pin.position.copy(pos);
      pin.userData = p;
      pin.children.forEach((child) => (child.userData = p));

      groupRef.current!.add(pin);
      addPinToScene(pin);
    });
  }, [ready, data, globeConfig]);

  return <group ref={groupRef} />;
}

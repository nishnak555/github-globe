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
/*                                TYPES SETUP                                 */
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
/*                           LAT / LNG TO XYZ                                 */
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
/*                         PIN CLICK HANDLER COMPONENT                        */
/* -------------------------------------------------------------------------- */

function PinClickHandler({
  pinsRef,
  camera,
  onPinClick,
}: {
  pinsRef: React.MutableRefObject<Object3D[]>;
  camera: PerspectiveCamera;
  onPinClick?: (
    info: PlayerInfo,
    headPos: Vector3,
    camera: PerspectiveCamera
  ) => void;
}) {
  const { gl } = useThree();
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  useEffect(() => {
    function handleClick(ev: PointerEvent) {
      if (typeof window === "undefined") return;

      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(pinsRef.current, true);
      if (!hits.length) return;

      const hit = hits[0];
      const pin = hit.object;

      const headLocal = new Vector3(0, 10, 0);
      const headWorld = pin.localToWorld(headLocal.clone());

      const info = pin.userData as PlayerInfo;

      onPinClick?.(info, headWorld, camera);
    }

    gl.domElement.addEventListener("pointerdown", handleClick);
    return () => gl.domElement.removeEventListener("pointerdown", handleClick);
  }, [gl, camera, onPinClick]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                 WORLD                                      */
/* -------------------------------------------------------------------------- */

const aspect = 1.2;
const cameraZ = 330;

export function World({ globeConfig, data, onPinClick }: WorldProps) {
  const [camera] = useState(() => new PerspectiveCamera(45, aspect, 0.1, 2000));
  const pinsRef = useRef<Object3D[]>([]);

  useEffect(() => {
    camera.position.set(0, 0, cameraZ);
  }, [camera]);

  function addPin(pin: Object3D) {
    pinsRef.current.push(pin);
  }

  return (
    <Canvas camera={camera} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[-400, 200, 300]} />
      <directionalLight position={[300, 500, 300]} />

      <Globe globeConfig={globeConfig} data={data} addPinToScene={addPin} />

      <PinClickHandler
        pinsRef={pinsRef}
        camera={camera}
        onPinClick={onPinClick}
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </Canvas>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  GLOBE                                     */
/* -------------------------------------------------------------------------- */

export function Globe({ globeConfig, data, addPinToScene }: GlobeProps) {
  const globeRef = useRef<any>(null);
  const groupRef = useRef<Group | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      groupRef.current.add(globeRef.current);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    const mat = globeRef.current.globeMaterial();
    mat.color = new Color(globeConfig.globeColor);
    mat.emissiveIntensity = 0.1;
  }, [ready, globeConfig]);

  useEffect(() => {
    if (!ready) return;

    globeRef.current
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(3)
      .hexPolygonMargin(0.5)
      .showAtmosphere(true)
      .atmosphereColor("#ffffff")
      .atmosphereAltitude(0.25)
      .hexPolygonColor(() => "rgba(255,255,255,0.15)");

    data.forEach((p) => {
      const pin = createPin(p.color);
      const pos = latLngToXYZ(p.lat, p.lng, 100);

      pin.position.copy(pos);

      pin.userData = p;
      pin.children.forEach((child) => (child.userData = p));

      groupRef.current!.add(pin);
      addPinToScene(pin);
    });
  }, [ready, data]);

  return <group ref={groupRef} />;
}

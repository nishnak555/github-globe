"use client";
import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { Vector3, PerspectiveCamera } from "three";

export interface PlayerInfo {
  name: string;
  team: string;
  country: string;
  image: string;
  lat: number;
  lng: number;
  color: string;
}

interface PlayerCardProps {
  data: PlayerInfo | null;
  pinPosition: Vector3 | null;
  camera: PerspectiveCamera | null;
  onClose: () => void;
}

export default function PlayerCard({
  data,
  pinPosition,
  camera,
  onClose,
}: PlayerCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Fixed sizes
  const CARD_WIDTH = 260;
  const CARD_HEIGHT = 340;

  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  /* ---------------------------------------------------------- */
  /*        Calculate card rotation + position in screen        */
  /* ---------------------------------------------------------- */
  useEffect(() => {
    if (!data || !pinPosition || !camera) return;

    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    // Calculate globe surface position (globe radius = 100)
    const GLOBE_RADIUS = 100;
    const pinDir = pinPosition.clone().normalize();
    const globeSurfacePos = pinDir.multiplyScalar(GLOBE_RADIUS);
    
    // Pin head position is already in world space
    const pinHeadWorld = pinPosition.clone();

    // Project both globe surface and pin head to screen coordinates
    const surfaceProjected = globeSurfacePos.project(camera);
    const pinHeadProjected = pinHeadWorld.project(camera);
    const rect = canvas.getBoundingClientRect();

    // Screen positions
    const surfaceScreenX = rect.left + (surfaceProjected.x + 1) * 0.5 * rect.width;
    const surfaceScreenY = rect.top + (1 - surfaceProjected.y) * 0.5 * rect.height;
    const pinHeadScreenX = rect.left + (pinHeadProjected.x + 1) * 0.5 * rect.width;
    const pinHeadScreenY = rect.top + (1 - pinHeadProjected.y) * 0.5 * rect.height;

    // Tilt effect based on camera direction relative to globe surface
    const camDir = globeSurfacePos.clone().sub(camera.position).normalize();
    setTilt({
      rx: camDir.y * -18,
      ry: camDir.x * 25,
    });

    // Position card on globe surface, with bottom-right corner near pin head
    // Card appears on globe surface, pin head is in front (rendered by canvas above)
    const CORNER_OFFSET_X = CARD_WIDTH - 30;
    const CORNER_OFFSET_Y = CARD_HEIGHT - 26;
    
    // Position card so its bottom-right corner aligns with pin head position
    // This makes it appear the card is pinned to the globe surface
    const sx = pinHeadScreenX - CORNER_OFFSET_X;
    const sy = pinHeadScreenY - CORNER_OFFSET_Y;

    setScreenPos({ x: sx, y: sy });
  }, [data, pinPosition, camera]);

  if (!data) return null;

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        left: screenPos.x,
        top: screenPos.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(-8deg)`,
        transformOrigin: "bottom right",
        transition: "all .25s ease-out",
        zIndex: 5,
        pointerEvents: "auto",
      }}
      className="
        relative flex flex-col rounded-[28px]
        bg-[#0c0c0c]/95
        border border-white/8
        shadow-[0_45px_90px_rgba(0,0,0,.85)]
        text-white overflow-hidden
        backdrop-blur-md
      "
    >
      <div className="relative h-[195px] overflow-hidden">
        <img
          src={data.image}
          className="absolute inset-0 h-full w-full object-cover scale-[1.05]"
          alt={data.name}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/15 to-black/75" />

        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">
            {data.team}
          </p>
          <h2 className="text-2xl font-semibold leading-tight">{data.name}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between px-6 py-5 gap-4 bg-gradient-to-b from-[#111111]/80 to-black">
        <div>
          <p className="text-sm text-white/70">{data.team}</p>
          <h3 className="text-xl font-semibold">{data.name}</h3>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/80">
          <Globe size={16} className="opacity-80" />
          {data.country}
        </div>

        <button
          onClick={onClose}
          className="
            self-start rounded-full border border-white/15
            bg-white/10 px-4 py-1.5 text-xs font-medium text-white/90
            transition hover:bg-white/20
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

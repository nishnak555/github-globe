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

    // Tilt effect based on camera direction
    const camDir = pinPosition.clone().sub(camera.position).normalize();
    setTilt({
      rx: camDir.y * -22,
      ry: camDir.x * 30,
    });

    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    // Offset pin slightly downward (so card attaches to top of pin)
    const PIN_HEAD_RADIUS = 4.4;
    const head = pinPosition.clone();
    head.y -= PIN_HEAD_RADIUS;

    // Convert head position to 2D screen
    const projected = head.project(camera);
    const rect = canvas.getBoundingClientRect();

    let sx = rect.left + (projected.x + 1) * 0.5 * rect.width;
    let sy = rect.top + (1 - projected.y) * 0.5 * rect.height;

    // Offset card for cleaner visibility
    const OFFSET = 22;
    sx -= CARD_WIDTH - OFFSET;
    sy -= CARD_HEIGHT - OFFSET;

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
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformOrigin: "bottom right",
        transition: "all .25s ease-out",
        zIndex: 999,
      }}
      className="
        rounded-[22px]
        bg-[#1d1d1d]/95 backdrop-blur
        border border-[#2a2a2a]
        shadow-[0_30px_80px_rgba(0,0,0,.7)]
        text-white overflow-hidden
      "
    >
      <img
        src={data.image}
        className="w-full h-40 object-cover opacity-95"
        alt={data.name}
      />

      <div className="p-4">
        <h2 className="text-lg font-semibold text-white">{data.name}</h2>
        <p className="text-sm text-gray-300">{data.team}</p>

        <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
          <Globe size={14} className="opacity-80" /> {data.country}
        </div>

        <button
          onClick={onClose}
          className="
            mt-4 text-xs px-3 py-1.5
            bg-white/20 hover:bg-white/30
            rounded text-white
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

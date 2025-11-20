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

  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [cardSize, setCardSize] = useState({ w: 260, h: 330 });

  useEffect(() => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setCardSize({ w: r.width, h: r.height });
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!data || !pinPosition || !camera) return;

    const camPos = camera.position.clone();
    const dir = pinPosition.clone().sub(camPos).normalize();
    setTilt({ rx: dir.y * -25, ry: dir.x * 35 });

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const PIN_HEAD_RADIUS = 4.4;
    const head = pinPosition.clone();
    head.y -= PIN_HEAD_RADIUS;

    const projected = head.project(camera);
    const rect = canvas.getBoundingClientRect();

    let sx = rect.left + (projected.x + 1) * 0.5 * rect.width;
    let sy = rect.top + (1 - projected.y) * 0.5 * rect.height;

    const R = 22;
    const { w: W, h: H } = cardSize;

    sx -= W - R;
    sy -= H - R;

    setScreenPos({ x: sx, y: sy });
  }, [data, pinPosition, camera, cardSize]);

  if (!data) return null;

  return (
    <div
      ref={cardRef}
      style={{
        position: "absolute",
        left: screenPos.x,
        top: screenPos.y,
        transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transformOrigin: "bottom right",
        transition: "all .25s ease-out",
        zIndex: 999,
      }}
      className="w-[260px] rounded-[22px] bg-[#0b0b0b] border border-[#1a1a1a]
                 shadow-[0_30px_80px_rgba(0,0,0,.7)] overflow-hidden"
    >
      <img src={data.image} className="w-full h-40 object-cover" />

      <div className="p-4">
        <h2 className="text-lg font-semibold">{data.name}</h2>
        <p className="text-sm opacity-80">{data.team}</p>

        <div className="mt-3 flex items-center gap-2 opacity-80 text-sm">
          <Globe size={14} /> {data.country}
        </div>

        <button
          onClick={onClose}
          className="mt-3 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import PlayerCard from "@/components/ui/PlayerCard";
import { World } from "@/components/ui/globe";
import { Vector3, PerspectiveCamera } from "three";

type PlayerInfo = {
  name: string;
  team: string;
  country: string;
  image: string;
  lat: number;
  lng: number;
  color: string;
};

export default function ClientHome() {
  const [selected, setSelected] = useState<PlayerInfo | null>(null);
  const [pinPos, setPinPos] = useState<Vector3 | null>(null);
  const [camera, setCamera] = useState<PerspectiveCamera | null>(null);

  const sampleData: PlayerInfo[] = [
    {
      name: "Killian Hayes",
      team: "Detroit Pistons",
      country: "USA",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 42.3314,
      lng: -83.0458,
      color: "#FF6A00",
    },
    {
      name: "Stephen Curry",
      team: "Golden State Warriors",
      country: "USA",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 37.7749,
      lng: -122.4194,
      color: "#FF6A00",
    },
    {
      name: "LeBron James",
      team: "Los Angeles Lakers",
      country: "USA",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 34.0522,
      lng: -118.2437,
      color: "#FF6A00",
    },
    {
      name: "Giannis Antetokounmpo",
      team: "Milwaukee Bucks",
      country: "Greece",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 37.9838,
      lng: 23.7275,
      color: "#FF6A00",
    },
    {
      name: "Nikola Jokić",
      team: "Denver Nuggets",
      country: "Serbia",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 44.7866,
      lng: 20.4489,
      color: "#FF6A00",
    },
    {
      name: "Luka Dončić",
      team: "Dallas Mavericks",
      country: "Slovenia",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 46.0569,
      lng: 14.5058,
      color: "#FF6A00",
    },
    {
      name: "Shai Gilgeous-Alexander",
      team: "OKC Thunder",
      country: "Canada",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 43.6532,
      lng: -79.3832,
      color: "#FF6A00",
    },
    {
      name: "Joel Embiid",
      team: "Philadelphia 76ers",
      country: "Cameroon",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 3.848,
      lng: 11.5021,
      color: "#FF6A00",
    },
    {
      name: "Kristaps Porziņģis",
      team: "Boston Celtics",
      country: "Latvia",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 56.9496,
      lng: 24.1052,
      color: "#FF6A00",
    },
    {
      name: "Victor Wembanyama",
      team: "San Antonio Spurs",
      country: "France",
      image:
        "https://images.unsplash.com/photo-1565787113569-be8aa6f5da41?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      lat: 48.8566,
      lng: 2.3522,
      color: "#FF6A00",
    },
  ];

  const globeConfig = {
    globeColor: "#1A1A1A",
    atmosphereColor: "#FFFFFF",
    atmosphereAltitude: 0.12,
    emissive: "#0A0A0A",
    emissiveIntensity: 0.05,
    polygonColor: "rgba(255, 255, 255, 0.55)",
    ambientLight: "#FFFFFF",
    ambientLightIntensity: 0.85,
    pointLightColor: "#FFFFFF",
    pointLightIntensity: 2.8,
    shininess: 0.9,
    diffuse: "#C0C0C0",
    diffuseIntensity: 1.2,
  };

return (
  <div className="w-screen h-screen bg-black relative overflow-hidden">
    {/* Globe pushed DOWN */}
    <div className="w-full h-full flex items-end justify-center pb-20">
      <div className="w-[550px] h-[550px]">
        <World
          globeConfig={globeConfig}
          data={sampleData}
          onPinClick={(info, headPos, cam) => {
            setSelected(info);
            setPinPos(headPos);
            setCamera(cam);
          }}
        />
      </div>
    </div>

    {/* Player Card */}
    <PlayerCard
      data={selected}
      pinPosition={pinPos}
      camera={camera}
      onClose={() => setSelected(null)}
    />
  </div>
);


}

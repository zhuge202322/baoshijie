"use client";

import { Canvas } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useState } from "react";
import type { Group } from "three";

const models = [
  {
    label: "2019 GT3 RS",
    url: "/models/porsche-911-2019-gt3-rs.glb"
  },
  {
    label: "2017 GT3 RS",
    url: "/models/porsche-911-2017-gt3-rs.glb"
  }
];

function VehicleModel({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true) as Group, [gltf.scene]);

  return (
    <Center>
      <primitive object={scene} rotation={[0, -0.28, 0]} scale={140} />
    </Center>
  );
}

function LoadingPlate() {
  return (
    <Html center>
      <div className="mono" style={{ color: "#ffb3ac", fontSize: 12, textTransform: "uppercase" }}>
        Loading atelier model
      </div>
    </Html>
  );
}

export function CarShowcase() {
  const [active, setActive] = useState(0);

  return (
    <div
      aria-label="Interactive 3D Porsche model viewer"
      className="car-showcase"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        minHeight: "100%",
        opacity: 1
      }}
    >
      <Canvas
        camera={{ position: [6.2, 2.35, 7.6], fov: 30 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows
      >
        <fog attach="fog" args={["#050505", 11, 26]} />
        <ambientLight intensity={1.08} />
        <hemisphereLight args={["#ffffff", "#1a1010", 1.2]} />
        <directionalLight position={[7, 9, 6]} intensity={3.2} color="#ffffff" />
        <directionalLight position={[0, 3, 8]} intensity={1.4} color="#ffffff" />
        <pointLight position={[-4, 2, 6]} intensity={8} color="#d5001c" distance={14} />
        <pointLight position={[5, 2, -5]} intensity={4.2} color="#ffb3ac" distance={14} />
        <Suspense fallback={<LoadingPlate />}>
          <Bounds key={models[active].url} fit clip margin={0.92}>
            <VehicleModel url={models[active].url} />
          </Bounds>
          <ContactShadows
            position={[0, -1.08, 0]}
            opacity={0.48}
            scale={14}
            blur={2.2}
            far={5}
            color="#000000"
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.68}
          zoomSpeed={0.7}
          minDistance={4.2}
          maxDistance={12}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI - 0.05}
          autoRotate={false}
          makeDefault
        />
      </Canvas>

      <div
        className="model-switcher"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(84px, 10vh, 128px)",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
          zIndex: 3
        }}
      >
        {models.map((model, index) => (
          <button
            key={model.url}
            type="button"
            className={`button ${active === index ? "primary" : "ghost"} mono`}
            style={{ minHeight: 42, paddingInline: 14, fontSize: 12 }}
            onClick={() => setActive(index)}
          >
            {model.label}
          </button>
        ))}
      </div>
    </div>
  );
}

useGLTF.preload("/models/porsche-911-2019-gt3-rs.glb");
useGLTF.preload("/models/porsche-911-2017-gt3-rs.glb");

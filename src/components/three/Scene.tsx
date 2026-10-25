import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PromiseStatus } from "../../lib/types";
import { STATUS_COLORS, orbitSlot } from "../../lib/seals";

export interface SceneProps {
  tokens: PromiseStatus[];
  active: boolean;
  dark: boolean;
  onHover: (info: { index: number; status: PromiseStatus } | null) => void;
}

const dummy = new THREE.Object3D();
const ring = new THREE.Object3D();

function Tokens({ tokens, onHover }: Pick<SceneProps, "tokens" | "onHover">) {
  const body = useRef<THREE.InstancedMesh>(null);
  const emboss = useRef<THREE.InstancedMesh>(null);
  const hovered = useRef(-1);
  const slots = useMemo(() => tokens.map((_, i) => orbitSlot(i, tokens.length)), [tokens]);

  useLayoutEffect(() => {
    if (!body.current || !emboss.current) return;
    const c = new THREE.Color();
    tokens.forEach((status, i) => {
      body.current!.setColorAt(i, c.set(STATUS_COLORS[status]));
      emboss.current!.setColorAt(i, c.set(STATUS_COLORS[status]).offsetHSL(0, -0.05, 0.14));
    });
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true;
    if (emboss.current.instanceColor) emboss.current.instanceColor.needsUpdate = true;
  }, [tokens]);

  useFrame(({ clock }) => {
    if (!body.current || !emboss.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < tokens.length; i++) {
      const s = slots[i];
      const speed = 0.16 - s.ring * 0.035;
      const a = s.angle + t * speed;
      const scale = hovered.current === i ? 1.45 : 1;
      dummy.position.set(Math.cos(a) * s.radius, s.y + Math.sin(t * 0.6 + i) * 0.06, Math.sin(a) * s.radius);
      dummy.rotation.set(Math.PI / 2 + Math.sin(t * 0.4 + i) * 0.35, t * 0.5 + i, 0);
      dummy.scale.setScalar(scale * 0.55);
      dummy.updateMatrix();
      body.current.setMatrixAt(i, dummy.matrix);
      ring.position.copy(dummy.position);
      ring.quaternion.copy(dummy.quaternion);
      ring.scale.copy(dummy.scale);
      ring.translateY(0.085);
      ring.updateMatrix();
      emboss.current.setMatrixAt(i, ring.matrix);
    }
    body.current.instanceMatrix.needsUpdate = true;
    emboss.current.instanceMatrix.needsUpdate = true;
  });

  const handlers = {
    onPointerMove: (e: any) => {
      e.stopPropagation();
      const i = e.instanceId as number | undefined;
      if (i === undefined || i === hovered.current) return;
      hovered.current = i;
      onHover({ index: i, status: tokens[i] });
    },
    onPointerOut: () => {
      hovered.current = -1;
      onHover(null);
    },
  };

  return (
    <>
      <instancedMesh ref={body} args={[undefined, undefined, Math.max(tokens.length, 1)]} count={tokens.length} {...handlers}>
        <cylinderGeometry args={[0.5, 0.5, 0.12, 36]} />
        <meshStandardMaterial metalness={0.25} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={emboss} args={[undefined, undefined, Math.max(tokens.length, 1)]} count={tokens.length}>
        <torusGeometry args={[0.3, 0.04, 8, 28]} />
        <meshStandardMaterial metalness={0.2} roughness={0.55} />
      </instancedMesh>
    </>
  );
}

/** The central wax seal with a tick, slowly turning. */
function CenterSeal() {
  const group = useRef<THREE.Group>(null);
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const n = 10;
    for (let i = 0; i <= 120; i++) {
      const t = (i / 120) * Math.PI * 2;
      const r = 1.18 + 0.1 * Math.cos(n * t);
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    return s;
  }, []);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.35) * 0.5;
    group.current.rotation.x = Math.sin(t * 0.27) * 0.12;
    group.current.position.y = Math.sin(t * 0.8) * 0.08;
  });
  return (
    <group ref={group}>
      <mesh>
        <extrudeGeometry args={[shape, { depth: 0.28, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 4 }]} />
        <meshStandardMaterial color="#c23b2b" metalness={0.15} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[0.9, 0.04, 8, 48]} />
        <meshStandardMaterial color="#e0705f" roughness={0.5} />
      </mesh>
      <group position={[0, -0.02, 0.36]}>
        <mesh position={[-0.22, -0.12, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.2, 0.52, 0.1]} />
          <meshStandardMaterial color="#fff8ec" roughness={0.5} />
        </mesh>
        <mesh position={[0.2, 0.08, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.2, 0.98, 0.1]} />
          <meshStandardMaterial color="#fff8ec" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Rig({ active }: { active: boolean }) {
  useFrame(({ camera, pointer }) => {
    if (!active) return;
    camera.position.x += (pointer.x * 0.9 - camera.position.x) * 0.04;
    camera.position.y += (1.5 + pointer.y * 0.55 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function Scene({ tokens, active, dark, onHover }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => () => canvasRef.current?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext(), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 1.5, 8.6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        canvasRef.current = gl.domElement;
      }}
      aria-label="Interactive 3D field of seals, one per filed promise"
    >
      <ambientLight intensity={dark ? 0.7 : 0.9} />
      <directionalLight position={[4, 6, 5]} intensity={dark ? 1.4 : 1.7} />
      <directionalLight position={[-5, -2, -3]} intensity={0.45} color={dark ? "#6f8fd6" : "#ffd9b0"} />
      <CenterSeal />
      <Tokens key={tokens.length} tokens={tokens} onHover={onHover} />
      <Rig active={active} />
    </Canvas>
  );
}

export function Lighting({ shadows }: { shadows: boolean }) {
  return (
    <>
      {/* Soft dusk: hemisphere for ambient fill, one directional for form/shadows. */}
      <hemisphereLight args={["#1b2440", "#0b1020", 0.9]} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.1}
        color="#ffd9a8"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
    </>
  );
}

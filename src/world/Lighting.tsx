export function Lighting({ shadows }: { shadows: boolean }) {
  return (
    <>
      {/* Golden hour, not dusk: a navy hemisphere was crushing everything on
          the island toward black regardless of material color — swapped for
          a warm sky/ground pair and raised intensities. The night-navy look
          stays only in the Canvas background/fog (World.tsx), well beyond
          the island, so the sky-at-the-horizon read doesn't change. */}
      <hemisphereLight args={["#fff2d6", "#6b5a45", 1.3]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[30, 40, 20]}
        intensity={1.9}
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

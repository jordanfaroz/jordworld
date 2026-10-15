import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

export const MIN_ZOOM = 20;
export const MAX_ZOOM = 80;
export const DEFAULT_ZOOM = 40;

// normalize(1,1,1) happens to be exactly the "true isometric" angle: ~45°
// yaw (equal x/z components) and ~35.26° pitch (arcsin(1/√3)) — matches the
// spec's "≈45° yaw, ≈35° pitch" without needing separate angle math.
const OFFSET_DIR = new THREE.Vector3(1, 1, 1).normalize();
const OFFSET_DISTANCE = 30;

export interface CameraRigProps {
  targetRef: React.RefObject<THREE.Vector3>;
  zoomRef: React.RefObject<number>;
  reducedMotion: boolean;
}

/** No free rotation — the only camera inputs are follow (automatic) and
 * zoom (wheel/pinch/±, applied to orthographic `zoom`, not distance). */
export function CameraRig({
  targetRef,
  zoomRef,
  reducedMotion,
}: CameraRigProps) {
  const camRef = useRef<THREE.OrthographicCamera>(null);
  const lookTarget = useRef(new THREE.Vector3());
  const { size } = useThree();

  useFrame(() => {
    const cam = camRef.current;
    if (!cam) return;
    const target = targetRef.current;

    const desiredPos = target
      .clone()
      .add(OFFSET_DIR.clone().multiplyScalar(OFFSET_DISTANCE));

    if (reducedMotion) {
      cam.position.copy(desiredPos);
      lookTarget.current.copy(target);
    } else {
      cam.position.lerp(desiredPos, 0.08);
      lookTarget.current.lerp(target, 0.08);
    }
    cam.lookAt(lookTarget.current);

    const zoom = zoomRef.current;
    if (Math.abs(cam.zoom - zoom) > 0.01) {
      cam.zoom = zoom;
      cam.updateProjectionMatrix();
    }
  });

  return (
    <OrthographicCamera
      ref={camRef}
      makeDefault
      zoom={DEFAULT_ZOOM}
      near={0.1}
      far={200}
      left={size.width / -2}
      right={size.width / 2}
      top={size.height / 2}
      bottom={size.height / -2}
      position={[OFFSET_DISTANCE, OFFSET_DISTANCE, OFFSET_DISTANCE]}
    />
  );
}

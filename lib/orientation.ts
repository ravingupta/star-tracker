export type Vec3 = { x: number; y: number; z: number };

export type OrientationSettings = {
  flipAltitude: boolean;
  headingOffset: number;
  useTrueNorth: boolean;
};

// Local helpers
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const rad2deg = (r: number): number => (r * 180) / Math.PI;

// Compute pitch & roll from accelerometer vector
export function getPitchRollFromAccel(accel: Vec3, settings?: OrientationSettings) {
  const ax = accel.x;
  const ay = accel.y;
  const az = accel.z;
  let pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)); // radians
  const roll = Math.atan2(ay, az); // radians

  if (settings?.flipAltitude) {
    pitch = -pitch;
  }

  return { pitch, roll };
}

// Compute altitude (deg above horizon) from accelerometer by comparing
// device "forward" vector to the gravity (up) vector. This is often more
// intuitive for aiming with the phone's top edge than using pitch alone.
// Defaults assume portrait orientation with the phone's top edge pointing forward.
export function altitudeFromAccel(
  accel: Vec3,
  opts?: { forwardAxis?: 'x' | 'y' | 'z'; forwardSign?: 1 | -1; flip?: boolean }
): number {
  const ax = accel.x;
  const ay = accel.y;
  const az = accel.z;

  // Normalize gravity vector (points DOWN toward Earth)
  const gLen = Math.hypot(ax, ay, az) || 1;
  const gx = ax / gLen;
  const gy = ay / gLen;
  const gz = az / gLen;

  // Up vector is opposite gravity
  const upX = -gx;
  const upY = -gy;
  const upZ = -gz;

  const forwardAxis = opts?.forwardAxis ?? 'y';
  const forwardSign = opts?.forwardSign ?? -1; // -Y is toward the phone's top edge in portrait on many devices

  let fx = 0, fy = 0, fz = 0;
  if (forwardAxis === 'x') fx = forwardSign;
  else if (forwardAxis === 'y') fy = forwardSign;
  else fz = forwardSign; // 'z'

  // Altitude = asin( dot(forward, up) ), clamped to [-90, +90]
  const dot = fx * upX + fy * upY + fz * upZ;
  let altDeg = rad2deg(Math.asin(clamp(dot, -1, 1)));
  if (opts?.flip) altDeg = -altDeg;
  return altDeg;
}

// Tilt-compensated heading from magnetometer & pitch/roll
export function tiltCompensatedHeading(mag: Vec3, pitchRad: number, rollRad: number, settings?: OrientationSettings) {
  const Mx = mag.x;
  const My = mag.y;
  const Mz = mag.z;
  const cosP = Math.cos(pitchRad);
  const sinP = Math.sin(pitchRad);
  const cosR = Math.cos(rollRad);
  const sinR = Math.sin(rollRad);

  const Xh = Mx * cosP + My * sinR * sinP + Mz * cosR * sinP;
  const Yh = My * cosR - Mz * sinR;
  // Reference heading to the device's top edge as "forward". In our accel-based
  // altitude, we treat forward as -Y. To stay consistent, measure heading from -Y
  // by flipping signs: atan2(-Xh, -Yh) which equals atan2(Xh, Yh) + 180°.
  // This aligns the observed heading with Apple Compass in portrait
  // (0° = North, 90° = East, 180° = South, 270° = West).
  let headingRad = Math.atan2(-Xh, -Yh);
  let headingDeg = (headingRad * 180) / Math.PI;
  if (headingDeg < 0) headingDeg += 360.0;

  // Apply heading offset
  if (settings?.headingOffset) {
    headingDeg += settings.headingOffset;
    if (headingDeg < 0) headingDeg += 360;
    if (headingDeg >= 360) headingDeg -= 360;
  }

  // TODO: For true north, we would need to add magnetic declination
  // For now, the heading offset can be used to compensate

  return headingDeg;
}

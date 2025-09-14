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
  const pitch = Math.atan2(-ay, Math.sqrt(ax * ax + az * az)); // radians - corrected for y axis
  const roll = Math.atan2(ax, az); // radians - corrected for x axis

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
  // Reference heading to the horizontal plane using a standard atan2(Y, X) form.
  let headingRad = Math.atan2(Yh, Xh);
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

// Robust azimuth from accel + magnetometer using cross-product method
// Steps:
// 1) g = normalize(accel) (gravity, points DOWN)
// 2) m = normalize(mag)
// 3) E = normalize(m × g)  (East)
// 4) N = g × E             (North)
// Heading (deg): atan2(Ey, Ny) in [0,360)
export function azimuthFromAccelMag(
  accel: Vec3,
  mag: Vec3,
  settings?: OrientationSettings,
  opts?: { forwardAxis?: 'x' | 'y' | 'z'; forwardSign?: 1 | -1 }
) {
  // Normalize helpers
  const norm = (v: Vec3): Vec3 => {
    const l = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  };

  const g = norm(accel);
  const m = norm(mag);

  // E = m × g
  let Ex = m.y * g.z - m.z * g.y;
  let Ey = m.z * g.x - m.x * g.z;
  let Ez = m.x * g.y - m.y * g.x;
  const eLen = Math.hypot(Ex, Ey, Ez);
  if (eLen < 1e-6) {
    // Fallback: return 0 if invalid; caller should smooth/offset
    return 0;
  }
  Ex /= eLen; Ey /= eLen; Ez /= eLen;

  // N = g × E
  const Nx = g.y * Ez - g.z * Ey;
  const Ny = g.z * Ex - g.x * Ez;
  const Nz = g.x * Ey - g.y * Ex;
  // No need to normalize N for atan2(Ey, Ny)

  // Device forward vector (which direction on the phone represents "toward the telescope").
  const forwardAxis = opts?.forwardAxis ?? 'y';
  const forwardSign = opts?.forwardSign ?? 1;
  let fx = 0, fy = 0, fz = 0;
  if (forwardAxis === 'x') fx = forwardSign;
  else if (forwardAxis === 'y') fy = forwardSign;
  else fz = forwardSign; // 'z'

  // Project device forward onto East and North
  const eDotF = Ex * fx + Ey * fy + Ez * fz; // component toward East
  const nDotF = Nx * fx + Ny * fy + Nz * fz; // component toward North

  let headingRad = Math.atan2(eDotF, nDotF);
  let headingDeg = (headingRad * 180) / Math.PI;
  if (headingDeg < 0) headingDeg += 360.0;

  // Apply optional user offset (and potential true-north correction in future)
  if (settings?.headingOffset) {
    headingDeg += settings.headingOffset;
    if (headingDeg < 0) headingDeg += 360;
    if (headingDeg >= 360) headingDeg -= 360;
  }

  return headingDeg;
}

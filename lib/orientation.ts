export type Vec3 = { x: number; y: number; z: number };

export type OrientationSettings = {
  flipAltitude: boolean;
  headingOffset: number;
  useTrueNorth: boolean;
};

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
  let headingRad = Math.atan2(-Yh, Xh);
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

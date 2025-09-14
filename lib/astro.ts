// Math helpers
export const deg2rad = (d: number): number => (d * Math.PI) / 180.0;
export const rad2deg = (r: number): number => (r * 180.0) / Math.PI;
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

// Julian Date from JS Date (UTC)
export function julianDateFromDate(date: Date): number {
  const Y = date.getUTCFullYear();
  let M = date.getUTCMonth() + 1;
  const D =
    date.getUTCDate() +
    (date.getUTCHours() + date.getUTCMinutes() / 60.0 + date.getUTCSeconds() / 3600.0) / 24.0;
  let YY = Y;
  if (M <= 2) {
    YY = Y - 1;
    M += 12;
  }
  const A = Math.floor(YY / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd = Math.floor(365.25 * (YY + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
  return jd;
}

// GST in hours from JD
export function gstFromJD(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15.0; // hours
}

// RA(hours), Dec(deg) -> Alt/Az(deg). lon positive East.
export function raDecToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  dateUTC: Date
): { alt: number; az: number } {
  const jd = julianDateFromDate(dateUTC);
  const gstHours = gstFromJD(jd);
  const lstHours = ((gstHours + lonDeg / 15.0) % 24 + 24) % 24;
  let ha = lstHours - raHours; // hours
  if (ha < -12) ha += 24;
  if (ha > 12) ha -= 24;
  const haRad = deg2rad(ha * 15.0);
  const decRad = deg2rad(decDeg);
  const latRad = deg2rad(latDeg);

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(clamp(sinAlt, -1.0, 1.0));

  let cosA =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (Math.cos(altRad) * Math.cos(latRad));
  cosA = clamp(cosA, -1.0, 1.0);
  let azRad = Math.acos(cosA);
  const sinA = (-Math.cos(decRad) * Math.sin(haRad)) / Math.cos(altRad);
  if (sinA < 0) azRad = 2.0 * Math.PI - azRad;

  let azDeg = rad2deg(azRad);
  if (azDeg < 0) azDeg += 360.0;
  const altDeg = rad2deg(altRad);
  return { alt: altDeg, az: azDeg };
}

export function perspectiveScale(sourceDistance: number, targetDistance: number, min = .05, max = 20) {
  if (!Number.isFinite(sourceDistance) || !Number.isFinite(targetDistance) || sourceDistance <= 0 || targetDistance <= 0) return null;
  const ratio = targetDistance / sourceDistance;
  return ratio >= min && ratio <= max ? ratio : null;
}
export function screenMatch(source: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }, tolerance = .028) {
  if (source.z < -1 || source.z > 1 || target.z < -1 || target.z > 1) return false;
  return Math.hypot(source.x - target.x, source.y - target.y) <= tolerance;
}

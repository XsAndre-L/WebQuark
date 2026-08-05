export interface MapMarkerCollisionItem {
  key: string;
  x: number;
  y: number;
  diameter: number;
}

export interface MapMarkerCollisionOffset {
  x: number;
  y: number;
}

const COLLISION_FOOTPRINT_DIAMETER_RATIO = 0.75;
const COLLISION_RESOLUTION_PASSES = 12;
const COLLISION_EPSILON = 0.01;

interface CollisionNode extends MapMarkerCollisionItem {
  collisionRadius: number;
  offset: MapMarkerCollisionOffset;
}

/**
 * Separates every visible map marker and cluster while allowing their full
 * circles to overlap. The collision footprint is 75% of the rendered diameter.
 */
export function resolveMapMarkerCollisionOffsets(
  items: readonly MapMarkerCollisionItem[],
): Map<string, MapMarkerCollisionOffset> {
  const nodes = items
    .filter(item => (
      Number.isFinite(item.x)
      && Number.isFinite(item.y)
      && Number.isFinite(item.diameter)
      && item.diameter > 0
    ))
    .map<CollisionNode>(item => ({
      ...item,
      collisionRadius: item.diameter * COLLISION_FOOTPRINT_DIAMETER_RATIO * 0.5,
      offset: { x: 0, y: 0 },
    }))
    .sort((left, right) => left.key.localeCompare(right.key));

  const largestCollisionRadius = Math.max(
    0,
    ...nodes.map(node => node.collisionRadius),
  );

  for (let pass = 0; pass < COLLISION_RESOLUTION_PASSES; pass += 1) {
    let adjusted = false;
    const ordered = [...nodes].sort((left, right) => (
      centerX(left) - centerX(right)
      || centerY(left) - centerY(right)
      || left.key.localeCompare(right.key)
    ));

    for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
      const left = ordered[leftIndex];
      if (!left) continue;

      for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
        const right = ordered[rightIndex];
        if (!right) continue;
        const xDistance = centerX(right) - centerX(left);
        if (xDistance >= left.collisionRadius + largestCollisionRadius) break;
        const xDelta = centerX(right) - centerX(left);
        const yDelta = centerY(right) - centerY(left);
        const distance = Math.hypot(xDelta, yDelta);
        const minimumDistance = left.collisionRadius + right.collisionRadius;
        if (distance + COLLISION_EPSILON >= minimumDistance) continue;

        const direction = distance > COLLISION_EPSILON
          ? { x: xDelta / distance, y: yDelta / distance }
          : stableCollisionDirection(left.key, right.key);
        const pushDistance = (minimumDistance - distance) * 0.5;
        left.offset.x -= direction.x * pushDistance;
        left.offset.y -= direction.y * pushDistance;
        right.offset.x += direction.x * pushDistance;
        right.offset.y += direction.y * pushDistance;
        adjusted = true;
      }
    }

    if (!adjusted) break;
  }

  return new Map(nodes.map(node => [node.key, node.offset]));
}

function centerX(node: CollisionNode): number {
  return node.x + node.offset.x;
}

function centerY(node: CollisionNode): number {
  return node.y + node.offset.y;
}

function stableCollisionDirection(leftKey: string, rightKey: string): MapMarkerCollisionOffset {
  let hash = 2_166_136_261;
  for (const character of `${leftKey}\u0000${rightKey}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  const angle = ((hash >>> 0) % 360) * (Math.PI / 180);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

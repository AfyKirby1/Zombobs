/**
 * Circle vs axis-aligned bounding box collision helpers for campaign maps.
 */

/**
 * Resolve circle position against a single AABB wall.
 * @returns {{ x: number, y: number, hit: boolean }}
 */
export function resolveCircleAgainstWall(cx, cy, radius, wall) {
    const closestX = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(cy, wall.y + wall.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distSq = dx * dx + dy * dy;
    const radiusSq = radius * radius;

    if (distSq >= radiusSq) {
        return { x: cx, y: cy, hit: false };
    }

    if (distSq === 0) {
        const centerX = wall.x + wall.w * 0.5;
        const centerY = wall.y + wall.h * 0.5;
        const pushDx = cx - centerX;
        const pushDy = cy - centerY;
        const pushLen = Math.sqrt(pushDx * pushDx + pushDy * pushDy) || 1;
        return {
            x: cx + (pushDx / pushLen) * radius,
            y: cy + (pushDy / pushLen) * radius,
            hit: true
        };
    }

    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    return {
        x: cx + (dx / dist) * overlap,
        y: cy + (dy / dist) * overlap,
        hit: true
    };
}

/**
 * Resolve circle against many walls (iterative, capped).
 */
export function resolveCircleAgainstWalls(x, y, radius, walls, maxPasses = 4) {
    let resolvedX = x;
    let resolvedY = y;

    for (let pass = 0; pass < maxPasses; pass++) {
        let moved = false;
        for (let i = 0; i < walls.length; i++) {
            const result = resolveCircleAgainstWall(resolvedX, resolvedY, radius, walls[i]);
            if (result.hit) {
                resolvedX = result.x;
                resolvedY = result.y;
                moved = true;
            }
        }
        if (!moved) break;
    }

    return { x: resolvedX, y: resolvedY };
}

/**
 * Clamp circle center inside rectangular map bounds.
 */
export function clampCircleInBounds(x, y, radius, bounds) {
    return {
        x: Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x)),
        y: Math.max(bounds.minY + radius, Math.min(bounds.maxY - radius, y))
    };
}

/**
 * Test if circle overlaps any wall.
 */
export function circleOverlapsWall(cx, cy, radius, wall) {
    return resolveCircleAgainstWall(cx, cy, radius, wall).hit;
}

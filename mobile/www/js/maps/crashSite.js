// [TRACE: CAMPAIGN_DESIGN.md] Zone 1 — The Crash Site

const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;
const CENTER_X = 1200;
const CENTER_Y = 900;

function makeRingWalls(cx, cy, radius, segments, gapSegment, kind = 'debris') {
    const walls = [];
    const segmentAngle = (Math.PI * 2) / segments;
    const thickness = 36;
    const chordLength = radius * segmentAngle * 1.05;

    for (let i = 0; i < segments; i++) {
        if (i === gapSegment) continue;

        const midAngle = i * segmentAngle - Math.PI / 2 + segmentAngle * 0.5;
        const px = cx + Math.cos(midAngle) * radius;
        const py = cy + Math.sin(midAngle) * radius;
        const isHorizontal = Math.abs(Math.cos(midAngle)) >= Math.abs(Math.sin(midAngle));

        if (isHorizontal) {
            walls.push({
                x: px - chordLength * 0.5,
                y: py - thickness * 0.5,
                w: chordLength,
                h: thickness,
                kind
            });
        } else {
            walls.push({
                x: px - thickness * 0.5,
                y: py - chordLength * 0.5,
                w: thickness,
                h: chordLength,
                kind
            });
        }
    }

    return walls;
}

function borderWalls(width, height, thickness = 64) {
    return [
        { x: 0, y: 0, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: height - thickness, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: 0, w: thickness, h: height, kind: 'concrete' },
        { x: width - thickness, y: 0, w: thickness, h: height, kind: 'concrete' }
    ];
}

const ringWalls = makeRingWalls(CENTER_X, CENTER_Y, 430, 14, 0, 'debris');
const innerRingWalls = makeRingWalls(CENTER_X, CENTER_Y, 250, 10, 5, 'wreckage');

export const crashSiteMap = {
    id: 'crash_site',
    name: 'The Crash Site',
    zone: 1,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawn: { x: CENTER_X, y: CENTER_Y + 120 },
    objective: 'Secure the Perimeter',
    nextMapId: 'maintenance_tunnels',
    ambiance: {
        forceNight: true,
        fogAlpha: 0.28
    },
    walls: [
        ...borderWalls(MAP_WIDTH, MAP_HEIGHT),
        // Helicopter fuselage — blocks center wreck
        { x: CENTER_X - 110, y: CENTER_Y - 150, w: 220, h: 70, kind: 'wreckage' },
        { x: CENTER_X - 40, y: CENTER_Y - 210, w: 80, h: 60, kind: 'wreckage' },
        { x: CENTER_X - 150, y: CENTER_Y - 60, w: 90, h: 50, kind: 'wreckage' },
        { x: CENTER_X + 70, y: CENTER_Y - 60, w: 100, h: 45, kind: 'wreckage' },
        // Scattered debris pockets
        { x: 860, y: 720, w: 120, h: 40, kind: 'debris' },
        { x: 1420, y: 760, w: 100, h: 36, kind: 'debris' },
        { x: 980, y: 1080, w: 140, h: 42, kind: 'debris' },
        { x: 1320, y: 1040, w: 110, h: 38, kind: 'debris' },
        { x: 700, y: 900, w: 50, h: 120, kind: 'concrete' },
        { x: 1650, y: 880, w: 50, h: 130, kind: 'concrete' },
        ...ringWalls,
        ...innerRingWalls
    ],
    decals: [
        { kind: 'fire', x: CENTER_X - 30, y: CENTER_Y - 40, w: 70, h: 55 },
        { kind: 'fire', x: CENTER_X + 60, y: CENTER_Y + 10, w: 55, h: 45 },
        { kind: 'smoke', x: CENTER_X - 80, y: CENTER_Y - 180, w: 120, h: 90 },
        { kind: 'crater', x: CENTER_X + 180, y: CENTER_Y + 140, w: 160, h: 120 },
        { kind: 'crater', x: CENTER_X - 320, y: CENTER_Y - 80, w: 140, h: 100 }
    ],
    props: [
        { type: 'burntCar', x: 760, y: 620 },
        { type: 'debris', x: 1580, y: 650 },
        { type: 'concreteBarrier', x: 640, y: 1180 },
        { type: 'concreteBarrier', x: 1720, y: 1160 },
        { type: 'sandbagBarricade', x: 1080, y: 520 },
        { type: 'sandbagBarricade', x: 1320, y: 520 },
        { type: 'trashCan', x: 900, y: 1320 },
        { type: 'ammoCrate', x: 1480, y: 1280 }
    ],
    triggers: [
        {
            id: 'crash_site_start',
            type: 'objective',
            x: CENTER_X - 200,
            y: CENTER_Y - 200,
            w: 400,
            h: 400,
            message: 'Hold the crash site. Clear the first wave.'
        },
        {
            id: 'crash_site_extract',
            type: 'extraction',
            x: CENTER_X - 80,
            y: CENTER_Y - 510,
            w: 160,
            h: 100,
            message: 'Reach the extraction point',
            requiresWave: 2,
            target: { x: CENTER_X, y: CENTER_Y - 460 }
        }
    ]
};

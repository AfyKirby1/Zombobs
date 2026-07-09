// [TRACE: CAMPAIGN_DESIGN.md] Zone 2 — The Maintenance Tunnels

const MAP_WIDTH = 1800;
const MAP_HEIGHT = 1200;
const CENTER_X = 900;
const CENTER_Y = 600;

function borderWalls(width, height, thickness = 64) {
    return [
        { x: 0, y: 0, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: height - thickness, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: 0, w: thickness, h: height, kind: 'concrete' },
        { x: width - thickness, y: 0, w: thickness, h: height, kind: 'concrete' }
    ];
}

function hWall(x, y, w, kind = 'concrete') {
    return { x, y, w, h: 60, kind };
}

function vWall(x, y, h, kind = 'concrete') {
    return { x, y, w: 60, h, kind };
}

export const maintenanceTunnelsMap = {
    id: 'maintenance_tunnels',
    name: 'The Maintenance Tunnels',
    zone: 2,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawn: { x: 120, y: CENTER_Y },
    objective: 'Reach the east escape ladder',
    nextMapId: 'switching_yard',
    ambiance: {
        forceNight: true,
        fogAlpha: 0.35
    },
    walls: [
        ...borderWalls(MAP_WIDTH, MAP_HEIGHT),
        // Main corridor ceiling/floor with openings for side passages
        hWall(0, 420, 500), hWall(660, 420, 540), hWall(1360, 420, 440),
        hWall(0, 720, 300), hWall(460, 720, 440), hWall(1060, 720, 740),
        // North passage 1 (x: 500-660)
        vWall(500, 80, 340), vWall(660, 80, 340), hWall(500, 80, 160),
        // North passage 2 (x: 1200-1360)
        vWall(1200, 80, 340), vWall(1360, 80, 340), hWall(1200, 80, 160),
        // South passage 1 (x: 300-460)
        vWall(300, 720, 340), vWall(460, 720, 340), hWall(300, 1060, 160),
        // South passage 2 (x: 900-1060)
        vWall(900, 720, 340), vWall(1060, 720, 340), hWall(900, 1060, 160),
        // Central support pillars
        vWall(800, 520, 160), vWall(1000, 520, 160)
    ],
    decals: [
        { kind: 'smoke', x: 520, y: 150, w: 120, h: 200 },
        { kind: 'smoke', x: 1220, y: 150, w: 120, h: 200 },
        { kind: 'smoke', x: 320, y: 820, w: 120, h: 200 },
        { kind: 'smoke', x: 920, y: 820, w: 120, h: 200 },
        { kind: 'crater', x: 700, y: 500, w: 120, h: 80 }
    ],
    props: [
        { type: 'ammoCrate', x: 560, y: 200 },
        { type: 'ammoCrate', x: 1260, y: 200 },
        { type: 'sandbagBarricade', x: 340, y: 1000 },
        { type: 'sandbagBarricade', x: 940, y: 1000 },
        { type: 'concreteBarrier', x: 800, y: 500 },
        { type: 'concreteBarrier', x: 1000, y: 500 },
        { type: 'trashCan', x: 1500, y: 550 }
    ],
    triggers: [
        {
            id: 'tunnels_start',
            type: 'objective',
            x: 0,
            y: 480,
            w: 240,
            h: 240,
            message: 'Push through the tunnels. Clear the first wave.'
        },
        {
            id: 'tunnels_extract',
            type: 'extraction',
            x: 1560,
            y: 480,
            w: 180,
            h: 240,
            message: 'Reach the escape ladder',
            requiresWave: 2,
            target: { x: 1650, y: CENTER_Y }
        }
    ]
};

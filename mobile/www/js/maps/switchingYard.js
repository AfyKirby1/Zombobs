// [TRACE: CAMPAIGN_DESIGN.md] Zone 3 — The Switching Yard

const MAP_WIDTH = 2800;
const MAP_HEIGHT = 1600;
const CENTER_X = 1400;
const CENTER_Y = 800;

function borderWalls(width, height, thickness = 64) {
    return [
        { x: 0, y: 0, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: height - thickness, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: 0, w: thickness, h: height, kind: 'concrete' },
        { x: width - thickness, y: 0, w: thickness, h: height, kind: 'concrete' }
    ];
}

/** Long train-car walls forming three parallel lanes. */
function trainLane(x, y, length, kind = 'wreckage') {
    return { x, y, w: length, h: 70, kind };
}

export const switchingYardMap = {
    id: 'switching_yard',
    name: 'The Switching Yard',
    zone: 3,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawn: { x: 180, y: CENTER_Y },
    objective: 'Power the east gate — clear the yard',
    nextMapId: 'control_tower',
    ambiance: {
        forceNight: true,
        fogAlpha: 0.22
    },
    walls: [
        ...borderWalls(MAP_WIDTH, MAP_HEIGHT),
        // North train row
        trainLane(200, 280, 900),
        trainLane(1200, 280, 700),
        trainLane(2000, 280, 500),
        // Mid train row (broken gap for crossing)
        trainLane(200, 720, 600),
        trainLane(950, 720, 500),
        trainLane(1600, 720, 800),
        // South train row
        trainLane(200, 1160, 800),
        trainLane(1100, 1160, 900),
        trainLane(2100, 1160, 400),
        // Shipping containers / cover
        { x: 700, y: 480, w: 120, h: 80, kind: 'debris' },
        { x: 1500, y: 500, w: 140, h: 90, kind: 'debris' },
        { x: 2200, y: 900, w: 110, h: 100, kind: 'concrete' },
        { x: 900, y: 980, w: 100, h: 70, kind: 'debris' },
        // Gate pillars at east exit
        { x: 2550, y: 620, w: 50, h: 120, kind: 'concrete' },
        { x: 2550, y: 860, w: 50, h: 120, kind: 'concrete' }
    ],
    decals: [
        { kind: 'crater', x: 600, y: 550, w: 180, h: 120 },
        { kind: 'crater', x: 1800, y: 900, w: 160, h: 110 },
        { kind: 'smoke', x: 400, y: 300, w: 140, h: 100 },
        { kind: 'smoke', x: 2000, y: 1180, w: 120, h: 90 },
        { kind: 'fire', x: 1300, y: 740, w: 60, h: 50 }
    ],
    props: [
        { type: 'burntCar', x: 500, y: 520 },
        { type: 'burntCar', x: 1700, y: 980 },
        { type: 'ammoCrate', x: 750, y: 520 },
        { type: 'ammoCrate', x: 2300, y: 780 },
        { type: 'sandbagBarricade', x: 2400, y: 700 },
        { type: 'sandbagBarricade', x: 2400, y: 860 },
        { type: 'concreteBarrier', x: 1100, y: 500 },
        { type: 'trashCan', x: 350, y: 900 }
    ],
    survivors: [
        { survivorId: 'june', x: 400, y: CENTER_Y + 40 }
    ],
    triggers: [
        {
            id: 'yard_start',
            type: 'objective',
            x: 80,
            y: CENTER_Y - 120,
            w: 280,
            h: 240,
            message: 'Push east through the train lanes. Clear wave 1.'
        },
        {
            id: 'yard_mid',
            type: 'objective',
            x: 1200,
            y: 600,
            w: 300,
            h: 300,
            message: 'Radio: Gate needs power. Find the couplers.',
            requiresWave: 2
        },
        {
            id: 'power_north',
            type: 'power',
            x: 600,
            y: 360,
            w: 100,
            h: 100,
            message: 'North coupler',
            requiresWave: 2,
            holdMs: 2500
        },
        {
            id: 'power_mid',
            type: 'power',
            x: 1300,
            y: 780,
            w: 100,
            h: 100,
            message: 'Mid coupler',
            requiresWave: 2,
            holdMs: 2500
        },
        {
            id: 'power_south',
            type: 'power',
            x: 900,
            y: 1080,
            w: 100,
            h: 100,
            message: 'South coupler',
            requiresWave: 2,
            holdMs: 2500
        },
        {
            id: 'yard_extract',
            type: 'extraction',
            x: 2480,
            y: 680,
            w: 220,
            h: 240,
            message: 'Reach the powered gate — Control Tower awaits',
            requiresWave: 3,
            target: { x: 2620, y: CENTER_Y }
        }
    ]
};

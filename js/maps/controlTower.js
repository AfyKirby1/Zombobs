// [TRACE: CAMPAIGN_DESIGN.md] Zone 4 — The Control Tower (Act 1 finale)

const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2200;
const CX = 1000;
const CY = 1100;

function borderWalls(width, height, thickness = 64) {
    return [
        { x: 0, y: 0, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: height - thickness, w: width, h: thickness, kind: 'concrete' },
        { x: 0, y: 0, w: thickness, h: height, kind: 'concrete' },
        { x: width - thickness, y: 0, w: thickness, h: height, kind: 'concrete' }
    ];
}

/** Nested ring walls with a north stair gap for "ascent". */
function ringWalls(cx, cy, halfW, halfH, gapW, kind = 'concrete') {
    const left = cx - halfW;
    const top = cy - halfH;
    const right = cx + halfW;
    const bottom = cy + halfH;
    const t = 48;
    const gapHalf = gapW * 0.5;
    return [
        // North wall split by stair gap
        { x: left, y: top, w: halfW - gapHalf, h: t, kind },
        { x: cx + gapHalf, y: top, w: halfW - gapHalf, h: t, kind },
        // South
        { x: left, y: bottom - t, w: halfW * 2, h: t, kind },
        // West / East
        { x: left, y: top, w: t, h: halfH * 2, kind },
        { x: right - t, y: top, w: t, h: halfH * 2, kind }
    ];
}

export const controlTowerMap = {
    id: 'control_tower',
    name: 'The Control Tower',
    zone: 4,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    spawn: { x: CX, y: MAP_HEIGHT - 180 },
    objective: 'Ascend the Spire — reboot the relay',
    nextMapId: null,
    actFinale: true,
    ambiance: {
        forceNight: true,
        fogAlpha: 0.15
    },
    walls: [
        ...borderWalls(MAP_WIDTH, MAP_HEIGHT),
        // Outer apron ring
        ...ringWalls(CX, CY + 80, 780, 820, 140, 'concrete'),
        // Lobby ring
        ...ringWalls(CX, CY - 40, 520, 520, 120, 'debris'),
        // Ops floor ring
        ...ringWalls(CX, CY - 120, 280, 280, 100, 'wreckage'),
        // Lobby pillars
        { x: CX - 200, y: CY - 80, w: 50, h: 50, kind: 'concrete' },
        { x: CX + 150, y: CY - 80, w: 50, h: 50, kind: 'concrete' },
        { x: CX - 200, y: CY + 120, w: 50, h: 50, kind: 'concrete' },
        { x: CX + 150, y: CY + 120, w: 50, h: 50, kind: 'concrete' },
        // Stair choke blocks
        { x: CX - 90, y: CY + 700, w: 40, h: 100, kind: 'debris' },
        { x: CX + 50, y: CY + 700, w: 40, h: 100, kind: 'debris' }
    ],
    decals: [
        { kind: 'floodlight', x: CX - 40, y: CY - 200, w: 80, h: 80 },
        { kind: 'floodlight', x: CX - 300, y: CY + 200, w: 70, h: 70 },
        { kind: 'floodlight', x: CX + 220, y: CY + 200, w: 70, h: 70 },
        { kind: 'crater', x: CX - 100, y: CY + 400, w: 160, h: 110 },
        { kind: 'smoke', x: CX + 80, y: CY + 500, w: 120, h: 90 },
        { kind: 'fire', x: CX - 250, y: CY + 600, w: 50, h: 40 },
        { kind: 'relay', x: CX - 30, y: CY - 160, w: 60, h: 60 }
    ],
    props: [
        { type: 'ammoCrate', x: CX - 160, y: CY + 40 },
        { type: 'ammoCrate', x: CX + 160, y: CY + 40 },
        { type: 'sandbagBarricade', x: CX - 60, y: CY + 200 },
        { type: 'sandbagBarricade', x: CX + 20, y: CY + 200 },
        { type: 'concreteBarrier', x: CX - 120, y: CY + 550 },
        { type: 'concreteBarrier', x: CX + 80, y: CY + 550 },
        { type: 'trashCan', x: CX + 200, y: CY + 350 }
    ],
    hazards: [],
    scriptedEvents: [],
    survivors: [
        { survivorId: 'holt', x: CX + 160, y: CY + 280 }
    ],
    triggers: [
        {
            id: 'tower_breach',
            type: 'objective',
            x: CX - 200,
            y: MAP_HEIGHT - 320,
            w: 400,
            h: 200,
            message: 'Breach the apron. Ascend north.'
        },
        {
            id: 'tower_lobby',
            type: 'objective',
            x: CX - 200,
            y: CY - 100,
            w: 400,
            h: 280,
            message: 'Lobby secured. Reach the terminal.',
            requiresWave: 2
        },
        {
            id: 'tower_terminal',
            type: 'hack',
            x: CX - 70,
            y: CY - 200,
            w: 140,
            h: 120,
            message: 'Hold E — reboot the relay',
            requiresWave: 2,
            holdMs: 5000,
            target: { x: CX, y: CY - 140 }
        },
        {
            id: 'tower_defend',
            type: 'defend',
            x: CX - 200,
            y: CY - 280,
            w: 400,
            h: 360,
            message: 'HOLD THE SIGNAL',
            durationMs: 50000,
            autoStart: false
        }
    ]
};

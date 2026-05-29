export default {
    drinkingroom: {
        A: { x: 100.667, y: 311.333, width: 55.3333, height: 19.3333, targetMap: 'left', targetPortal: 'top' },
        B: { x: 724, y: 212, width: 11.3333, height: 41.3333, targetMap: 'right', targetPortal: 'top' }
    },
    hall: {
        left: { x: 49, y: 321, width: 61, height: 21, targetMap: 'left', targetPortal: 'bottom' },
        right: { x: 1171, y: 324, width: 60, height: 19, targetMap: 'right', targetPortal: 'bottom' },
        bottom: { x: 278, y: 868, width: 45, height: 26, targetMap: 'toilet', targetPortal: 'bottom' }
    },
    left: {
        top: { x: 33, y: 34, width: 61, height: 58, targetMap: 'drinkingroom', targetPortal: 'A' },
        A: { x: 2, y: 387, width: 29, height: 42, targetMap: 'office_1', targetPortal: 'door' },
        B: { x: 5, y: 707, width: 25, height: 41, targetMap: 'office', targetPortal: 'door' },
        bottom: { x: 33, y: 833, width: 61, height: 62, targetMap: 'hall', targetPortal: 'left' }
    },
    office: {
        top: { x: 160, y: 95.5, width: 95, height: 37, targetMap: 'office_1', targetPortal: 'bottom' },
        door: { x: 320.5, y: 194.5, width: 31.5, height: 48, targetMap: 'left', targetPortal: 'B' }
    },
    office_1: {
        door: { x: 321, y: 193, width: 30.5, height: 51, targetMap: 'left', targetPortal: 'A' },
        bottom: { x: 163.5, y: 324, width: 90.5, height: 26, targetMap: 'office', targetPortal: 'top' }
    },
    right: {
        top: { x: 1, y: 203, width: 60, height: 79, targetMap: 'drinkingroom', targetPortal: 'B' },
        bottom: { x: 455, y: 1218, width: 145, height: 58, targetMap: 'hall', targetPortal: 'right' }
    },
    toilet: {
        bottom: { x: 32.3333, y: 149.667, width: 31.3333, height: 10.3333, targetMap: 'hall', targetPortal: 'bottom' }
    }
};

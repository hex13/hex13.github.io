"use strict";

// NOTE
// 1. this is WIP
// 2. there are some bad practices here (like setTimeout/setInterval everywhere).

const engine = clone2d({
    gravity: {
        x: 0, y: 0 // TODO this doesn't work for now
    }
});

engine.createTypesFromImages([
    'cat.png', 'planet.png'
])

engine.run(() => {

    // cat on the rope

    const world = engine.world;

    const hook = world.createObject({
        displayAs: 'rect',
        x: 300,
        y: -100,
        height: 16,
        width: 16,
        color: 'white',
        kinematic: true,
        constraints: true, // temporary solution. it will change
    });


    const rope = world.createObject({
        shape: 'rope',
        x: hook.x,
        y: hook.y,
        points: [
            {x: 0, y: 0},
            {x: 0, y: 200}
        ],
        jointA: hook,
    });
    const cat = world.createObject({
        type:'cat',
        x: hook.x,
        y: hook.y + 200,
        vx: 10,
        color: 'white',
        constraints: {
            lock: rope.points[rope.points.length - 1]
        },
    });


    // tiles colored like Github

    const COLORS = [
        'rgb(214, 230, 133)',
        'rgb(140, 198, 101)',
        'rgb(238, 238, 238)',
        'rgb(30, 104, 35)'
    ];
    const getFloorColor = () => COLORS[~~(Math.random() * COLORS.length)];

    const SIZE = 24;

    for (let x = 0; x < 30; x++) {
        for (let y = 0; y < 4; y++) {
            world.createObject({
                displayAs: 'rect',
                x: 50 + x * SIZE,
                y: 300 + y * SIZE,
                height: SIZE,
                width: SIZE,
                color: 'white',
                fill: getFloorColor(),
                kinematic: true,
            });
        }
    }

    // ground

    const ground = world.createObject({
        displayAs: 'rect',
        width: 800,
        height: 100,
        x: 400,
        y: 480,
        fill: '#252',
        color: '#265',
        kinematic: true,
        isImmortal: true,
    });

    world.createObject({
        displayAs: 'rect',
        width: 10,
        height: 540,
        x: 0,
        y: 160,
        fill: '#bbc',
        color: '#aac',
        kinematic: true,
        isImmortal: true,
    });

    world.createObject({
        displayAs: 'rect',
        width: 10,
        height: 540,
        x: 800,
        y: 160,
        fill: '#bbc',
        color: '#aac',
        kinematic: true,
        isImmortal: true,
    });

    // rotating wood
    const wood = world.createObject({
        displayAs: 'rect',
        width: 400,
        height: 20,
        x: 500,
        y: 120,
        fill: '#a63',
        color: '#a54',
        kinematic: true,
        isImmortal: true,
        rotation: -0.2,
        vr: -0.4, // velocity of rotation
    });


    world.createObject({
        displayAs: 'circle',
        r: wood.height / 2,
        x: wood.x,
        y: wood.y,
        fill: '#741',
        color: '#731',
        kinematic: true,
        isImmortal: true,
    });

    setTimeout(() => {
        wood.isImmortal = false;
        cat.removeConstraints();
        cat.constraints = null; // temporary solution


        setTimeout(() => {
            engine.modifiers.modExplode.patch(cat);
        }, 200)



    }, 8 * 1000);


    // falling trees

    setInterval(() => {
        const meteor = world.createObject({
            type:'planet',
            fill:'yellow',
            shape: 'circle',
            x: Math.random() * 700 + 100,
            y: 0,
            vx: Math.random() * 100 - 50,
            vy: 700,
            mass: 10,//0.001,
            width: 30,
            height: 30,
            r: 15,
            kinematics: true,
            isDestroyer: true,
            isImmortal:true,
            ttl: 10 * 1000, // time to live 10 seconds
        })
        setTimeout(() => {
            // but after 3 seconds
            // we make meteors destroyable anyway
            pinetree.isImmortal = false;
            // to much objects on screen can cause drop of FPS
        }, 3000);

    }, 2000);

});

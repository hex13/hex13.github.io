"use strict";

const engine = clone2d({
    physics: {
        gravity: {
            x: 0, y: 300
        },
        restitution: 0.4

    }
});

engine.createTypesFromImages([
    'cat.png', 'planet.png', 'pinetree.png', 'texture.jpg',
])

engine.run(() => {

    // cat on the rope

    const world = engine.world;

    const hook = world.createObject({
        displayAs: 'rect',
        x: 400,
        y: -100,
        height: 16,
        width: 16,
        color: 'white',
        kinematic: true,
        constraints: true, // temporary solution. it will change
        vx: 100,
        alpha: 0,
        onUpdate() {
            this.alpha += 0.01;
            this.set({vx: Math.cos(alpha) * 40})
        }
    });


    const rope = world.createObject({
        shape: 'rope',
        displayAs: 'shape',
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
        piecesX: 4,
        piecesY: 4,
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

    function createTiles() {

        for (let x = 0; x < 30; x++) {
            for (let y = 0; y < 7; y++) {
                const isDestroyer = x%3==0;//Math.random()<0.44 && y < 2;// && x < 15 && x > 10;
                world.createObject({
                    restitution: 0.1,
                    img: 'texture',
                    shape: 'rect',
                    displayAs: 'shape',
                    x: 50 + x * SIZE,
                    y: 300 + y * SIZE,
                    r: 10,
                    height: SIZE,
                    width: SIZE,
                    color: isDestroyer? 'white': 'white',
                    fill: false && isDestroyer? 'red' : getFloorColor(),
                    kinematic: true,
                    piecesX: 2,//isDestroyer? 4: 4,
                    piecesY: 2,//isDestroyer? 4: 4,
                    isDestroyer,
                    opacity: 0,
                    scale:0,
                    keyframes: [
                        {t:0, opacity: 0, scale: 0, rotation: Math.PI},
                        {t:2000, opacity: 1, scale: 1, rotation: 0},
                    ],
                    resolveExplosionParticle() {
                        return Object.assign({}, this, {
                             shape: 'circle',
                             scale: 0,
                             //ignore:true,
                             r: 4, mass: 1,
                             keyframes: [
                                 {t: 0, opacity: 0, scale:0},
                                 {t: 500, opacity: 1, scale:2},
                                 {t: 2000, opacity: 1, scale: 0}
                             ],
                             isDestroyer: Math.random()<0.2,
                             vy: Math.random()*100-50,
                             vx: Math.random()*100-50, kinematic: false, ttl: 800,
                            //gravityScale: 0,
                        });
                    },
                });
            }
        }
        setTimeout(createTiles, 16000)
    }
    createTiles();


    // walls
    engine.createType('wall', {
        img: 'texture',
        shape: 'rect',
        displayAs: 'image',
        kinematic: true,
        material: 0,
        isImmortal: true,
    });

let alpha = 0;

document.addEventListener('keydown', function (e) {
    if (e.keyCode == 39)
        alpha -= 0.2;
    if (e.keyCode == 37)
        alpha += 0.2;

})
    const ground = world.createObject({
        type: 'wall',
        shape: 'rect',
        displayAs: 'pattern',
        width: 600,
        height: 40,
        r: 100,
        x: 400,
        y: 430,
        fill: '#ccc',
        color: '#aaa',
        rotation: Math.cos(alpha) * 1,
        onUpdate() {
            alpha += 0.01
            this.set({
                rotation: Math.cos(alpha) * 1
            })
        }
    });

    world.createObject({
        type: 'wall',
        width: 800,
        height: 10,
        x: 400,
        y: -100,
        fill: '#bbc',
        color: '#aac',
    });


    world.createObject({
        type: 'wall',
        width: 10,
        height: 540,
        x: 0,
        y: 160,
        fill: '#bbc',
        color: '#aac',
    });

    world.createObject({
        type: 'wall',
        width: 10,
        height: 540,
        x: 800,
        y: 160,
        fill: '#bbc',
        color: '#aac',
    });



    // rotating wood
    const wood = world.createObject({
        displayAs: 'shape',
        shape: 'rect',
        width: 400,
        height: 20,
        x: 500,
        y: 120,
        fill: '#a63',
        color: '#a54',
        kinematic: true,
        isImmortal: true,
        rotation: -0.2,
        piecesX: 5,
        vr: -0.4, // velocity of rotation
    });


    world.createObject({
        shape: 'circle',
        img: 'texture',
        displayAs: 'shape',
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
        }, 2000)


    }, 3 * 5000);


    // falling trees

    const Meteor = {
        material: 0,
        img:'planet',
        fill:'yellow',
        shape: 'circle',
        mass: 1116,//0.001,
        width: 30,
        height: 30,
        r: 15,
        kinematics: true,
        isDestroyer: true,
        isImmortal:true,
        ttl: 3* 1000, // time to live 10 seconds
        opacity: 1,
        init() {
            console.log("INIT", arguments)
            meteor.keyframes = [
                {t: 0, opacity: 1},
                {t: 500, opacity: 0.6},
                {t: 1000, opacity: 1},
                {t: 1500, opacity: 0.6},
                {t: 2500, opacity: 1},
                {t: 3000, opacity: 0}
            ];

        },
    }

    setTimeout(function launch() {
        const meteor = world.createObject({
            material: 0,
            img:'planet',
            fill:'yellow',
            shape: 'circle',
            x: Math.random() * 700 + 100,
            y: Math.random()*100-60,
            vx: Math.random() * 200 - 100,
            vy: 400,
            mass: 1116,//0.001,
            width: 30,
            height: 30,
            r: 15,
            kinematics: true,
            isDestroyer: true,
            isImmortal:true,
            ttl: 3* 1000, // time to live 10 seconds
        })
        meteor.keyframes = [
            {t: 0, opacity: 1},
            {t: 500, opacity: 0.6},
            {t: 1000, opacity: 1},
            {t: 1500, opacity: 0.6},
            {t: 2500, opacity: 1},
            {t: 3000, opacity: 0}
        ];

        setTimeout(() => {
            // but after 3 seconds
            // we make meteors destroyable anyway
            meteor.isImmortal = false;
            // to much objects on screen can cause drop of FPS
        }, 3000);
        setTimeout(launch, 2000);
    }, 500);

    // plant tree when clicking

    engine.worldView.onMouseDown = function (e) {
        const meteor = world.createObject(Object.assign({}, Meteor, {
            img: 'planet',
            shape: 'circle',
            displayAs: 'image',
            r: 15,
            x: e.x,
            y: e.y,
            width: 30,
            height: 30,
            piecesX: 8,
            piecesY: 8,
            fill: 'yellow',
            kinematic: false,
            isDestroyer: true,
        }));
        meteor.keyframes = [
            {t: 0, opacity: 1},
            {t: 500, opacity: 0.6},
            {t: 1000, opacity: 1},
            {t: 1500, opacity: 0.6},
            {t: 2500, opacity: 1},
            {t: 3000, opacity: 0}
        ];
    }

    //
    // world.createObject({
    //     type: 'texture',
    //     shape: 'polygon',
    //     displayAs: 'polygon',
    //     x: 100,
    //     y:100,
    //     r: 40,
    //     pattern: null,
    //     render(ctx) {
    //         if (!this.pattern) {
    //             this.pattern = ctx.createPattern(this.img, 'repeat');
    //         }
    //
    //         //ctx.fillStyle = this.pattern;
    //         ctx.fillStyle = 'blue';
    //         ctx.beginPath();
    //         ctx.moveTo(0, 0);
    //         ctx.lineTo(100, 0);
    //         ctx.lineTo(100, 100);
    //         ctx.fill();
    //         //ctx.fillRect(0, 0, 300, 300);
    //
    //     }
    // })


});

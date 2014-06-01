"use strict";
var alert = function(s){
 console.log(s);
 
}
var doc = document;
doc.id = function(id) {return this.getElementById(id);};
doc.newElement = function(tag, params, style) {     
    var el = this.createElement(tag);
    if (params)
        for (var p in params)
            el[p] = params[p];
    if (style)
        for (var s in style) 
            el.style[s] = style[s];
    return el;
};

var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var	b2Vec2 = Box2D.Common.Math.b2Vec2,
b2BodyDef	= Box2D.Dynamics.b2BodyDef,
b2Body		= Box2D.Dynamics.b2Body,
b2FixtureDef	= Box2D.Dynamics.b2FixtureDef,
b2World		= Box2D.Dynamics.b2World,
b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
Joints = Box2D.Dynamics.Joints;


//-------- SpriteType ------------------------------

function dir(o) {
    var l = [];
    for (var a in o)
        l.push(a);
    return l.join(', ');
}


//-------- Sprite constructor and prototype ---------

function Sprite(params) {
    var self = this;
    this._objects = [];
    this.creationTime = app.now;

    var typeChain = app3.typeChain(params.type);

    for (var i = 0; i < typeChain.length; i++) {
        var t = app3.type(typeChain[i]);
        if (!t) alert('!t');
        for (var p in t)
            this[p] = t[p];
    }

    for (var p in params)
        this[p] = params[p];

    function convertUnits() { // 
        for (var i = 0, len = arguments.length; i < len; i++) {
            var varName = arguments[i];            
            var val = self[varName];
            if (val.charAt && val.length) {
                var lastChar = val.charAt(val.length - 1);
                if (lastChar == 't') {
                    self[varName] = parseFloat(val) * app.TILE_SIZE; 
                }
            }
        }
    }
    this.id = this.id || ('sprid' + ~~(Math.random()*500000000));

    convertUnits('x', 'y', 'vx', 'vy');
    this.move(0);
    
    if (this.group)
        this._createGroup();

    app.trigger(this, 'create');
}

Sprite.prototype = {
    walkingSpeed:3.5,
    levitation:0.1,
    collisionCount:0,
    counter:0, type:'sprite', w:0, h:0, gravity:1, angle:0,
    x:-300, y:0, vx:0, vy:0, x1:0, y1:0, pushable: false, 
    movable: true,  
    displayX:0, displayY:0, oldDisplayX:0, oldDisplayY:0,
    fixedRotation: false, density:1, bodyType:'dynamic',// box2d
    opacity:1, vopacity:0,
    friction:0.3, restitution:0.12, drawn:false,
   
    _createGroup: function() {
        var objects = this.objects;
        if (this.group && objects)
            for (var i = 0, len = objects.length; i < len; i++) {
                var params = Object.create(this.group);
                for (var p in objects[i])
                    params[p] = objects[i][p];                
                this._objects[i] = new Sprite(params);
            }
    }, 
    
    jump: function(speed) {
        speed = speed || 1;
        if (!this.isStanding) {
            if (this.mana < app.MANA_JUMP_IN_THE_AIR)
                return;
            this.mana -= app.MANA_JUMP_IN_THE_AIR;
            var html = "<div class='shadow'></div>";
            app.text({text:html, position:this, fly:false});                        
            
        }
        
        this.v.y = -5*speed;
    },
    walk: function(dir) {
        var vx = this.walkingSpeed*dir;
        this.v.x=vx;
        this.v.y-=this.levitation;
        
    },
    control: function(key, delta) {
        
        var dir = 1;//delta;
        switch(key) {
            case 'left':
                dir *= -1;
            case 'right':
                this.walk(dir);
                break;
            case 'rotateright':                
                this.box.SetAngularVelocity(2);
                break;
            case 'rotateleft':                
                this.box.SetAngularVelocity(-2);
                break;
                
            case 'up':
                this.jump();
                break;
        }
    
    },
    
    collision: function(target) {

    },
    move: function(lapse) {
        if (this.box) {        
            var pos = this.pos, scale = app.SCALE;
            this.displayX =  ~~(pos.x * scale - this.w2);
            this.displayY =  ~~(pos.y * scale - this.h2);            
        }

            
    },
    collidable:true,

    draw:function() {

        var style = this.style;    
        if (!this.box || !style)
            return;
        this.drawn = true;

        var angle = ~~(this.box.GetAngle()*100)/100;


        var transform  = "";//"translate(" + this.displayX + "px, "+ this.displayY +"px) "
    
        if (angle)
            transform += "rotate(" + angle + "rad)";
        if (transform != this.oldTransform) {
            //this.style.WebkitTransform = transform;                         
            var propertyName = 'transform';
            if ($.browser.webkit)   
                 propertyName = 'WebkitTransform';
            if ($.browser.mozilla)                    
                 propertyName = 'MozTransform';
            style[propertyName] = transform;           
        }        
        style.left = this.displayX + "px";
        style.top = this.displayY + "px";        
        this.oldTransform = transform;
       /* var opacity = this.opacity;
        if (opacity != this.oldOpacity)
            style.opacity = (~~(opacity * 100))/100;
        this.oldOpacity = opacity;*/
        this.counter++;

        return false; //!!! prevents further handlers
    }    
    
}

var app3 = {};
app3.ROOT_TYPE = 'sprite';
app3.types = {};
app3._typeChains = {
    'sprite':'_'
};
app3.typeChain = function(type) {
    var root = app3.ROOT_TYPE;
    return (app3._typeChains[type] || (root+' '+type) || root).split(' ');
}
app3.type = function(typeName, params) {
    var type = this.types[typeName] || (this.types[typeName] = {type:typeName});
    
    if (params) {
        params.type = typeName;
        params.base = params.base || 'sprite';
        for (var p in params)
            type[p] = params[p];

        var typeChains = this._typeChains;    
        //var chain = params.base? typeChains[params.base] + " " : "sprite ";
        var chain = (typeChains[params.base] || params.base) + " ";        
        typeChains[typeName] = chain + typeName;               
    }
    return type;
}

function Sprite2() {
    return Sprite.call(this);
}
Sprite2.prototype = Sprite.prototype;
/*app3.sprite = function(params) {
    var o = Object.create(params);
}*/




//-------- application object --------------------
// ----- various framework functions --------------

var app = {

   banner: function(bannerId, onEnd) {
        var $banner = $("#" + bannerId);
        var x = (app.SCREEN_W - $banner.width()) / 2;
        var y = (app.SCREEN_H - $banner.height()) / 2;        
        $banner.css({left:x, top:y})
            .fadeIn().delay(1000).hide(onEnd);
   },
   
   world: function() {
      return world;//!!!
   },
   restartLevel: function() {
        alert('restartLevel()');
       this.screen().hasToRestart = true;
   },
   
   isPause: false,
   pause: function() {
    this.isPause = !this.isPause;
   },
   SCREEN_W:800,
   SCREEN_H:600,
   MAX_DROPPED_FRAMES: 8,
   KEY_MAP: {37:'left', 38: 'up', 39: 'right', 40:'down', 32:'pause'},
   TILE_SIZE:50,
   GRAVITY:0.3,
   treatAs: 'application',
   _spriteTypes: {}, 
   _handlers: {},
   _metahandlers: {},
   _screens: [],
   images: {}, //read only
   levels: {}, // read only
   sprites: {},// read only
   clearWorld: function() {
   }
}

app.text = function(params) {
    params.x = params.position.displayX;
    params.y = params.position.displayY;//!!!

    if (params.text) {
        var top = params.y-10;
        var el = doc.newElement('div', 
            {className:'text', innerHTML:params.text},
            {left:params.x+"px", top:top+"px"});
        app.scene().appendChild(el);
        if (params.fly!== false)
            top -= 50;
        $(el).animate({top:top, opacity:0.0},2200, function() {
            $(this).remove();
        });
    }
}

app.image = function(obj) {
    var img, it = obj;
/*    do {
        var img = this.images[it.type];
        if (img) 
            return img;
        it = it.prototype;
    } while(it && it.type);*/

    var typeChain = app3.typeChain(obj.type);
    var i = typeChain.length;

    while (i--) {        
        var img = this.images[typeChain[i]];
        if (img)
            return img;
    }
}

app._setCurrentScreen = function(el) {
    this._screens[el? 'unshift': 'shift'](el);
}

app._showCurrentScreen = function(visible) {
    this._screens[0] && (this._screens[0].style.display = visible? 'block': 'none');
}

app.switchScreen = function(id) {
    alert('przelaczam:' + id);
    var el = id? doc.id(id) : null;
    this._showCurrentScreen(false);
    this._setCurrentScreen(el)
    if (el) {
        el.treatAs = 'screen';
        el.scene = doc.id(id +'-scene');

        app.trigger(el, 'run');
    }
    this._showCurrentScreen(true);  
}

app.screen = function() {
    return this._screens[0];
}

app.scene = function() {
    return this._screens[0].scene;
}


app.levels = function(data) {
    for (var level_id in data) 
        this.levels[level_id] = data[level_id];
}


app.handler = function(data) {
    for (var key in data) {
        this._handlers[key] = data[key];
    }
}

app.metahandler = function(dataToAdd) {
    var map = this._metahandlers;
    for (var eventSignature in dataToAdd) {
        var metahandlerData = map[eventSignature] || (map[eventSignature] = {});
        var newParams = dataToAdd[eventSignature];
        for (var param in newParams)
            metahandlerData[param] = newParams[param];
    }
}


app._fireMetaHandler = function(key) {
    var metahandler = app._metahandlers[key];    
    if (metahandler) {
        if (metahandler.text)
            app.text({text:metahandler.text, position:this});
        if (metahandler.coins)
            app.trigger(app.player(), 'coins', [metahandler.coins]);
            //app.player().v.y = -10;
//            app.text({coins:metahandler.coins, position:this});            
    } 
}

app.player = function() {
    return this.id('mruczek') || alert('brak gracza');
}

app.trigger = function(subject, event, args) { 
    if (!subject) 
        return;
        
    var cachedKeys = [];        
    var appHandlers = app._handlers;      
    var eventPostfix = "__" + event;  

    var result;
     
    var handler = subject[event];
    if (handler && handler.apply) // direct calling object's method
       result = handler.apply(subject, args) ;  

    if (result===false) 
       return;      
       
    var self = this;
        
    function fire(key, fromCache) {
        if (!fromCache)
            cachedKeys.push(key);                
        key += eventPostfix;
        var foo = appHandlers[key] ;
        foo && foo.apply(subject, args);
        //self._fireMetaHandler.call(subject, key);
    }
    
    var keys = subject.__triggerKeys;
    if (keys) {
        for (var i = 0, len = keys.length; i < len; i++) {
            fire(keys[i], true);
        }
        return;
    }
    
    var subjectType = subject.type;
    
    if (subject.treatAs) 
        fire(subject.treatAs);
    else {
        var chain = app3.typeChain(subject.type);
        
        for (var i = 0; i < chain.length; i++)
            fire(chain[i]);
    } 
    fire('#' + subject.id);
    subject.__triggerKeys = cachedKeys;
}



app.id = function(id, obj) {
    if (obj)
        this.sprites[id] = obj;
    return this.sprites[id];
}

// default handlers

app.metahandler({
    'mruczek__stand': {
        instruction:'stanales',
        pointer:'box1'
    },
    'mruczek1__endSensorCollision': {
        text:'',
        coins: 2
    }
});


app.handler({
    // sprite handlers
    sprite__fadeout: function() {
        //if (this.destroyableAfterHiding)
        //if (this.onlyVisible)        
        //!!! trzeba dorobic gdzies jakas funkcje do usuwania obiektow!
        
    },
    sprite__destroy: function() {
        world.DestroyBody(this.box);
        $(this.el).fadeOut(300, function() {
            $(this).remove();
        });
        //this.el.parentNode.removeChild(this.el);        
    },
    sprite__create: function() {
        //alert('sprajt utworzony ' + this.id);
        var el = this.el = document.createElement('div');    
        el.id = this.id;
        el.obj = this;
        //el.title = (this.x / app.TILE_SIZE) + ", " + (this.y / app.TILE_SIZE) + ":"+ this.id + "(" + this.type + ")";

        this.style = el.style;        
        el.className = 'sprite';
        if (this.type) {
            el.className = el.className + ' ' + this.type;                    

            this.image = app.image(this);    


            if (this.image) {
                el.style.backgroundImage = "url('"+this.image.src+"')";
                this.w = this.image.width;
                this.h = this.image.height;              
                el.style.width = this.w + "px";                
                el.style.height = this.h + "px";
                this.w2 = this.w / 2;
                this.h2 = this.h / 2;           
            } else {;//alert("Brak obrazka dla '" + this.type + "' (" + this.base + ")");
                this.w = this.h = 1;
                this.w2 = 0.5;
                this.h2 = 0.5;
                
            }
        }

        
        this.box = createBox(this, this.x, this.y, this.w, this.h, this.fixedRotation );
        
        if (this.box) {
            this.pos = this.box.GetPosition();           
            this.v = this.box.GetLinearVelocity(); 
            if (this.angularVelocity) {
                this.box.SetAngularVelocity(this.angularVelocity);//!!!nie dziala
            }
            
        };//else alert('blad:' + this.type);
        app.trigger(app, 'spriteCreated', [this]);                
        
    },
    instruction__create: function() {   
        this.el.innerHTML = this.text;
    },
    
    // screen handlers
    
    screen__run: function() {
       // this.innerHTML = '';
        myBox2D.clearWorld();
        var levelSprites = app.levels[this.id];
        if (levelSprites) {
            for (var i = 0; i < levelSprites.length; i++) {
                var params = levelSprites[i];
                new Sprite(params);
            }
        }
        this.ended = false;                        
    },
    
    '#level-1__keydown': function(e) {
        var key = app.KEY_MAP[e.keyCode];
        if (key=='pause') {
            app.pause();
            return;
        }
        var dir = 1;
        var player = app.id('mruczek');
        if (!player)
            return;
        player.box.SetAwake(true);
        var velocity = player.box.GetLinearVelocity();
        player.control(key);
        
    
    },
    
    'millcenter__create': function() {
        var joint = new Joints.b2RevoluteJointDef();
        var wings = this._objects, center = this.box;
        if (!this.fixedRotation)
            this.box.SetAngularVelocity(this.wingRotation);

        joint.bodyA = center;    
        joint.collideConnected = false;
        joint.localAnchorB.Set(0.9,0);//the top right corner of the box
        joint.localAnchorA.Set(0,0);
        
        var angleDelta = Math.PI * 2 / wings.length;

        for(var i = 0; i < wings.length; i++) {
            var body = wings[i].box;
            joint.bodyB = body;
            world.CreateJoint(joint);    
            body.SetAngularVelocity(this.wingRotation);        
            body.SetAngle(i * angleDelta);//SetRotation( 1.4);                        
        }

    },

    screen__interval: function(lapse) {
    //try{
        var self = this;
        if (app.isPause) 
            return;
            
        var staticObjects = [];
            
        if (!this.ended) {
            world.Step(1/60 * lapse, 8, 8);
            if (app.DEBUG_DRAW)
                world.DrawDebugData();
           // doc.title = Math.random();     
            var sprites = this.sprites, obj;
            
            if (sprites) {
                for (var i = this.sprites.length-1; i >= 0; i--) {
                    obj = sprites[i];
                    app.trigger(obj, 'move', [lapse]);
                    if (!obj.noNeedToDraw)
                        app.trigger(obj, 'draw');         
                    if (obj.bodyType=='static')
                        obj.noNeedToDraw = true;
                    /*if (obj.bodyType=='static') {                    
                        staticObjects.push(i);
                    }*/
                    if (obj.dead) {
                        app.trigger(obj, 'destroy');
                        this.sprites.splice(i, 1);//!!!nieoptymalne
                    }

                }                      
            }
        }
//        for (var i = 0; i < staticObjects.length; i++)
  //          this.sprites.splice(staticObjects[i], 1);
        
        if (this.hasToRestart) {
            
            this.hasToRestart = false;            

            app.banner('death', function() {
                app.switchScreen();            
                app.switchScreen('level-1');                        
            });
            
            if (self.sprites) {
                for (var i = self.sprites.length-1; i >= 0; i--) {
                    app.trigger(self.sprites[i], 'destroy');
                }
                self.sprites = [];
            }
            
            this.ended = true;                
        }
        
   // }catch(e){alert(e);}
    },
       
    // application handlers
    
    application__spriteCreated: function(sprite) {

        var screen = this.screen();
        screen.scene.appendChild(sprite.el);//!!!
        if (!screen.sprites)
            screen.sprites = [];
        screen.sprites.push(sprite);                    
        this.id(sprite.id, sprite); //add sprite to application lookup list
    },

    '#mruczek__coins': function(count) {
        this.coins += count;
        var html = "<div class='coin'>" + count + "</div>";
        app.text({text:html, position:this});                        
        //doc.title = this.coins;
        $("#status-coins span").animate({top:-6, opacity:0}, 100,function(){$(this).remove()});
        $("#status-coins").append("<span>"+this.coins+"</span>");
        
    },    
    'snowman__collision': function(target) {
        app.trigger(target, 'hit', [10]);
    },
    'snowman__move':function(lapse) {
        var desiredAngle = this.desiredAngle || 0;
        var angle = this.box.GetAngle() - desiredAngle;                
        var angleV = 0;//this.box.GetAngularVelocity();
        if (this.collisionCount>0) {
            this.desiredAngle *= 0.3;                  
            this.box.SetAngularVelocity(-angle*3 + angleV);
        } else {  
            this.box.SetAngularVelocity(-angle*4 + angleV);
        }
    
    },

    '#mruczek__move': function(lapse) {
        if (this.displayY > 1300) {
            this.pos.y = -3;
            this.v.y *= 0.4;
            this.v.x *= 0.8;
            this.pos.x = 2;
            this.box.SetPosition(this.pos);            
            return;
        }
        if (this.displayX > 4500) {        
            this.pos.x = 0;
            this.box.SetPosition(this.pos);            
            return;
        }
        
        var desiredAngle = this.desiredAngle || 0;
        var angle = this.box.GetAngle() - desiredAngle;                
        var angleV = 0;//this.box.GetAngularVelocity();
        
        //if (this.mana > app.MANA_MIN) {
            if (this.collisionCount>0) {
                this.desiredAngle *= 0.3;                  
                this.box.SetAngularVelocity(-angle*3 + angleV);
            } else {  
                this.box.SetAngularVelocity(-angle*4 + angleV);
            }
        //}
        if (this.mana < app.MANA_MIN)
            this.mana += app.MANA_REGENERATION_SPEED_WHEN_LOW * lapse;
        else
            this.mana += app.MANA_REGENERATION_SPEED * lapse;
        if (this.mana > app.MANA_MAX)
            this.mana = app.MANA_MAX;
        $(".mana").css({'width':(this.mana)*4});
        var isMinMana = this.mana >= app.MANA_MIN;
        $(".mana")[isMinMana?'addClass':'removeClass']('mana-highlight');
        
        

    },

    'exit__collision': function(target) {
        if (target.player) {
            app.banner("complete");
        }        

    },
    
    'powerup__collision': function(target) {
        if (target.player) {
            if (this.coins)
                app.trigger(target, 'coins', [this.coins]);
            app.trigger(target, 'powerup', [this]);                            
            this.dead = true;
        }
        if (this.text)
            app.text({position:this, text:this.text});
    },
    
    
    'sprite__sensorCollision': function() {
        this.collisionCount = (this.collisionCount || 0)+1;
        this.isStanding = true;
        this.style.opacity = 1;
    },
    'sprite__endSensorCollision': function() {
        if (--this.collisionCount<=0) {
            this.style.opacity = 1;
            this.isStanding = false;    
            //app.text({text:'halo', position:this});                
        }
    }, 
    'emitter__move': function() {      
        var now = (new Date()) - 0;  
        if (!this.lastT || (now-this.lastT>this.interval)) {
            var params = this.params;//{type:'snowman', y:this.displayY+100, x:this.displayX, lifeSpan:7000, restitution:0/*??*/};
            params.x = this.displayX;
            params.y = this.displayY + 100;//!!! referencja, psujemy this.params
            new Sprite(params);
            this.lastT = now;
        }
    },

    
    
    'sprite__move': function() {
        if (this.lifeSpan) {
            if (app.now > this.lifeSpan + this.creationTime)
                this.dead = true;
        }
    },
    'pokraka__collision': function(target) {
        app.trigger(target, 'hit', [20]);
    },
    'mruczek__hit': function(amount) {
        alert('mruczek__hit');
        var texts = ['Holy sh*t', 'WTF?', 'It hurts!', 'Damn!', 'F**k!'];
        var rnd = ~~(Math.random()*texts.length);
        app.text({text:texts[rnd], position:this, fly:true});
        $("#hit-overlay").fadeIn(100).fadeOut(300);        
        this.mana -= amount;
        if (this.mana < 0) {
            this.mana = 0;
            app.restartLevel();

            //app.switchScreen('level-1');
        }
    },
    
    'mruczek__powerup': function(powerup) {
        if (powerup.type == 'key') {
            this.keys = (this.keys||0) + 1;
        }
    },
    
    'door__move': function() {
        this.v.y *= 0.9;
    },
    
    'door__collision': function(target) {
        var html;
        if (target.keys) {
            this.v.y = 1;            
            html = 'Gate open.';
        } else {
            html = 'You need key.';
        }
        alert(html);
        app.text({text:html, position:this, fly:true});        
    }

    
    
});    

//-----
var myBox2D = {
    fixture: function(params) {
        var fixDef = new b2FixtureDef;    
        for (var p in params)
            fixDef[p] = params[p];
        return fixDef;
    },
    clearWorld: function() {
        //!!!! sprzezenie na linii box2D - screen - obiekt :/
        // nie wiadomo kto jest za co odpowiedzialny
        // kto przechowuje liste obiektow, kto ma usunac cialo ze swiata
      
        var node = world.GetBodyList();    
        while (node) {
            var body = node;
            node = node.GetNext();
            var gameObject = body.GetUserData();
            if (gameObject) {
                gameObject.dead = true;
            }
            /*if (gameObject)
                app.trigger(gameObject, 'destroy');
            else
                world.DestroyBody(body);*/
        }
    }
}

var sprites = [];
app.SCALE = 100;

function createBox(gameObject, x, y, width, height, fixedRotation) {
    var typeOfBody;
    typeOfBody =  gameObject.bodyType;
    width /= 2 * app.SCALE;
    height /= 2 * app.SCALE;
    x /= app.SCALE;
    y /= app.SCALE;    

    var fixDef = myBox2D.fixture({density: gameObject.density, 
                                 friction:gameObject.friction, 
                                 restitution:gameObject.restitution, 
                                 shape: new b2PolygonShape});

    fixDef.shape.SetAsBox(width,height);
    if (!gameObject.collidable)
        fixDef.filter.maskBits = 0;


    var bodyDef = new b2BodyDef;

    bodyDef.type = b2Body['b2_' + typeOfBody + 'Body'];
    bodyDef.userData = gameObject;

    bodyDef.position.x = x + gameObject.w / 2 / app.SCALE;
    bodyDef.position.y = y + gameObject.h / 2 / app.SCALE;//!!!?
    bodyDef.active = true;
    bodyDef.fixedRotation = fixedRotation;
	bodyDef.angle = gameObject.angle;
    
    var body = world.CreateBody(bodyDef);       
    //console.log(fixDef);
    body.CreateFixture(fixDef);

    if (gameObject.needSensor) {
        var sensor = myBox2D.fixture({isSensor:true, shape: new b2PolygonShape });    
        sensor.shape.SetAsOrientedBox(width*1.2, 0.1, new b2Vec2(0,height), 0); 
        body.CreateFixture(sensor);    
        gameObject.sensor = sensor;
    }

    return body;

}


var world; //box2d;

window.onload = function() {


    world = new b2World(new b2Vec2(0, 9),  true  /* allow sleep */   );

    var b2Listener = Box2D.Dynamics.b2ContactListener;

    //Add listeners for contact
    var listener = new b2Listener;
    
    function contactHandler(contact, isEnd) {
        var fixtureA = contact.GetFixtureA();
        var fixtureB = contact.GetFixtureB();
        var evName;
        var objA = fixtureA.GetBody().GetUserData();
        var objB = fixtureB.GetBody().GetUserData();
        if (!(fixtureA.IsSensor() || fixtureB.IsSensor())) {
            evName = isEnd? 'endCollision': 'collision';
            app.trigger(objA, evName, [objB]);
            app.trigger(objB, evName, [objA]);        
        } else {
            evName = isEnd? 'endSensorCollision': 'sensorCollision';
            if (fixtureA.IsSensor())        
                app.trigger(objA, evName, [objB]);
            if (fixtureB.IsSensor())                            
                app.trigger(objB, evName, [objA]);        
        
        }    
    }

    listener.BeginContact = function(contact) {
        contactHandler(contact, false);
    }


    listener.EndContact = function(contact) {
        contactHandler(contact, true);    
    }

    listener.PostSolve = function(contact, impulse) {
    }

    listener.PreSolve = function(contact, oldManifold) {
        // PreSolve

        var a = contact.GetFixtureA().GetBody().GetUserData();
        var b = contact.GetFixtureB().GetBody().GetUserData();
        if ((a && a.powerup) || (b && b.powerup))
            contact.SetEnabled(false)
    }

    world.SetContactListener(listener);


    alert('ok');

    var imgs = document.getElementById('images').childNodes;
    for (var j=0; j < imgs.length;j++) {                
        var node = imgs[j];        
        if (node.nodeType!=1 || node.tagName.toLowerCase() != 'img')
            continue;
        app.images[node.className] = node;
    }        
    app3.type('sprite', {gravity:0});
//    app3.type('application', {gravity:1});            
    app3.type('kotek', {gravity:1});
    app3.type('mruczek', {player:true, mana:100, coins:0, friction:0.4,gravity:1, restitution:0.001});    
    app3.type('static', {bodyType:'static',gravity:0});    
    app3.type('platform', {base:'static',pushable:0, gravity:0, movable:0});    
    app3.type('platformice', {base:'platform',friction:0.3});
    app3.type('powerup', {powerup:true, base:'static'});
    app3.type('pinetree', {base:'static', collidable:0});                               
    app3.type('coin1', {base:'powerup', coins:1});            
    app3.type('ice', {base:'platform',friction:0.0});    	        	
	app3.type('jumpplatform', {base:'platform',restitution:2});
	app3.type('exit', {base:'static', angle:Math.PI/2});    	    
    app3.type('mill', {fixedRotation:true});
    app3.type('smallice', {base:'platform',friction:0.0});
    app3.type('cloud1', {base:'static', collidable:0});
    app3.type('greenplatform', {base:'static' });    
    app3.type('wall3x3', {base:'static' });
    app3.type('soil9x2', {base:'static' });
    app3.type('soilupper9x2', {base:'static' });            
    app3.type('interior1', {base:'static', collidable:0});    
    app3.type('door', {base:'platform', bodyType:'kinematic'});    
    
    app3.type('key', {base:'powerup', text:'Key'});
    app3.type('planet', {bodyType:'dynamic', angularVelocity:0.5});                            
    app3.type('millcenter',{wingRotation:2.2/*2.7*/, bodyType:'kinematic',base:'static',movable:0, test:'kot'});
    app3.type('pokraka',{base:'millcenter', wingRotation:0.7});    
app3.type('pokraka-leg', {base:'pokraka', fixedRotation:true});
app3.type('pokraka-third-leg', {base:'pokraka', fixedRotation:true});                                

    app3.type('millbackground', {base:'static',movable:0});                            
    app3.type('box', {friction:0.8,restitution:0.3,pushable:1, movable:1,fixedRotation:0, density:0.7, gravity:1 });    

    app3.type('emitter', {base:'static'});
    
    app3.type('group1', {group: {base:'platform'}, 
        objects: [{x:'12t', y:'6t'}, {x:'12t', y:'4t'}, {x:'12t', y:'5t'}]
    });

    app3.type('introbox', {base:'box'});
    app.handler({
        '#camera__move': function() {
            if (this.follows) {
                var focus = app.id(this.follows);

                var focusX = focus.displayX;
                var x = this.displayX;
                var windowLeft = x + 200;
                var windowRight = x + app.SCREEN_W - 200;
                var screenCenterX = x + app.SCREEN_W/2;
                if ( (focusX < windowLeft) || (focusX > windowRight)) {
                    this.v.x = focusX < (x + app.SCREEN_W/2)? -6 : 6;
                }

                var cameraX = (~~focus.displayX-app.SCREEN_W/2);
                var style = app.scene().style;
                style.left = -cameraX + "px";
                style.top = -((~~focus.displayY - 350)) + "px";            

            }
            
        }
    });

    
    if (!document.addEventListener)
        alert("BRAK document.addEventListener!!!");

    var lastMouse;
    
   
    document.addEventListener('keydown', function(e) {
        app.trigger(app.screen(), 'keydown', [e]);
    }, false);
    
    var lastTime;
    
    var frames = 0;
    var timeLastFPS;
    var fps;
    setInterval(function() {
        var now = new Date() - 0;                
        app.now = now;
        var lapse = now - (lastTime || now); // lapse = 0 during first time 
        lapse /= 16.0; // convert milliseconds to frames - assuming 60 FPS(~16 ms)
        if (lapse > app.MAX_DROPPED_FRAMES)
            lapse = app.MAX_DROPPED_FRAMES;

        app.trigger(app.screen(), 'interval', [lapse]);
        
        lastTime = now;        

        test = 0;
        frames++;
        if (!timeLastFPS || (now - timeLastFPS ) > 1000) {
            fps = frames * 1;            
            frames = 0;
            timeLastFPS = now;
            var player = app.id('mruczek');
            if (player) {
                var x = player.displayX / app.TILE_SIZE, 
                    y = player.displayY / app.TILE_SIZE;
                var info = "FPS: " + fps + ", player position (in tiles): x=" 
                    + x + "; y="+ y;
                doc.getElementById('status-fps').innerHTML = info;
            }
        }

           // doc.title = lapse + ", FPS: " + fps + ", obiekty: " + app.screen().sprites.length;        
    },16);
    if (app.DEBUG_DRAW)
        setupDebugDraw();
    app.switchScreen('menu');        
}    
   
var test=0;

function setupDebugDraw() {
  var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(
    document.getElementById("canvas").
                        getContext("2d"));
  debugDraw.SetDrawScale(60.0);
  debugDraw.SetFillAlpha(0.6);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(
      b2DebugDraw.e_shapeBit | 
       b2DebugDraw.e_jointBit);
  world.SetDebugDraw(debugDraw);
};

   
    app.levels({
        'level-1': [
            //{type:'millbackground', x:'14.5t', y:'4.3t', 
            //gravity:0, collidable:0},                                 

            //{type:'mruczek', id:'mruczek', x:'37t', y:'17t'},
            {type:'key', x:'25t', y:'18t'},
            {type:'mruczek', id:'mruczek', x:'5t', y:'5t'},            {type:'snowman', x:'7t', y:'0t',vx:1,lifeSpan:7500},
            {type:'emitter', interval:2400, x:'1t', y:'-3t', params: {type:'snowman', lifeSpan:7500, restitution:0/*??*/}
            },
            {type:'smallice', x:'7t', y:'3.4t',angle:0.44},
            {type:'ice', x:'-1.7t', y:'1.5t',angle:0.16},                              

                                   
            {type:'millcenter', density:10, x:'14.5t', y:'6t', id:"millcenter",
                group: {type:'mill', gravity:1, y:'5t'},
                objects: [{ x:'13t', id:"mill1"}, {x:'16t', id:"mill2"},{ x:'13t'}

						   ]
            },
            
        {group:{type:'pinetree',y:'19.1t'},
            objects:[{x:'24t',y:'6.6t'}, {x:'27t', y:'6.8t'},{x:'30t', y:'7.4t'},
                     {x:'33t', y:'8t'},{x:'36t', y:'8.6t'},
                        
            {x:'27t'},{x:'30t'},
                    {x:'34t'},{x:'41t'},{x:'44t'},{x:'47t'}
                    
            ]
        },
        {type:'wall3x3', x:'36.5t', y:'20t', angle:1},
        {type:'emitter', x:'22.5t', y:'19t', interval:11000, params:            

            {type:'pokraka', friction:0.5,bodyType:'dynamic', wingRotation:0.8,density:10, x:'22.5t', y:'19t', fixedRotation:1, lifeSpan:8000,
                group: {lifeSpan:9300,friction:0.6,type:'pokraka-third-leg', gravity:1, y:'2t', bodyType:'dynamic'},
                objects: [{ x:'4t'},{ x:'4t'},{ x:'4t'}

						   ]
            }},
            
            {group:{type:'soilupper9x2', y:'22t'},
                objects: [ {x:'15t'},{x:'24t'},{x:'33t'},  {x:'42t'}, {x:'51t'},
                {x:'68t',y:'16t'}
                ]
            },
            {group:{type:'soil9x2', y:'24t'},
                objects: [ {x:'15t'}, {x:'24t'}, {x:'33t'},  {x:'42t'}, {x:'51t'}, 
                {x:'60t',y:'20t'}, {x:'60t',y:'22t'},
                
                {x:'68t'}, {x:'68t',y:'20t'},{x:'68t',y:'18t'}
                ]
            },
            
            



            {type:'door', x:'59t', y:'17t'},
            {type:'exit', x:'66t', y:'18t'},            
            {type:'greenplatform', x:'51t', y:'20t'},
            {type:'greenplatform', x:'51t', y:'21t'},
            {type:'greenplatform', x:'51t', y:'22t'},                                    
            {type:'greenplatform', x:'59t', y:'16t'},
            {type:'interior1', x:'60t', y:'17t'},
            {type:'interior1', x:'61.9t', y:'17t'},
            {type:'interior1', x:'63.8t', y:'17t'},
            {type:'interior1', x:'65.7t', y:'17t'},
            {type:'interior1', x:'67.6t', y:'17t'},            
            {group:{type:'coin1'}, objects: [
                {x:'60.5t', y:'18.5t'},{x:'62t', y:'18.5t'},{x:'63.5t', y:'18.5t'}
            ]},
            {group:{type:'greenplatform'},
                objects: [

                {x:'3t',y:'7.5t'},

                
				
					]

            },
            {type:'cloud1', x:'30t', y:'3t'},
            {type:'cloud1', x:'40t', y:'16t'},
            {type:'cloud1', x:'50t', y:'12t'},            
            { group: {type:'coin1'}, 
              objects: [{x:'25t', y:'7t'}, {x:'27t', y:'7.5t'},            
              {x:'29t', y:'8t'}, {x:'31t', y:'8.2t'},
              {x:'34t', y:'9t'}, {x:'36t', y:'9t'}, {x:'38t', y:'10t'}
              
              ]
            },
              
//            {type:'ice', x:'19t', y:'9t', angle:0.2},
            {type:'ice', x:'12t', y:'8t', angle:0.1},
            {type:'ice', x:'21t', y:'9.5t', angle:0.1},                            
            {type:'ice', x:'30t', y:'11t', angle:0.2},
            

			

            {id:'camera', type:'static', movable:1,collidable:0,
                follows:'mruczek', horizontalMargin: 200, speed:10, fixedRotation:1, x:'3t'
            }                                   
            
            
        ]
    });

app.MANA_MAX = 100;    
app.MANA_MIN = 25;
app.MANA_JUMP_IN_THE_AIR = app.MANA_MIN / 2 + 7;    
app.MANA_REGENERATION_SPEED_WHEN_LOW = 0.3;
app.MANA_REGENERATION_SPEED = 0.14;

"use strict";
var alert = function() {};
function Singleton(A) {
    A.getInstance = function (){ return (this._instance = (this._instance || new A)); };
    A.recreate = function() { this._instance = null;  }
}
//------------------------------------------------------

function Messenger() {
    this._subs = {};
    this._queue = [];
    this._objects = {};
}
Singleton(Messenger);

Messenger.prototype.dispatch = function (){
    var msgCount = this._queue.length, subs = this._subs, i, j, subscribers, obj;
    for (i = 0; i < msgCount; i++){
        var msg = this._queue[i];
        var targetObject = this._objects[msg.to];        
        targetObject && targetObject.sendMessage(msg);
        
        // subscribers for msg.to
        for (subscribers = subs[msg.to], j = 0; subscribers && (obj = subscribers[j++]); )
            obj.sendMessage(msg);
            
        // subscribers for msg.type
        for (subscribers = subs[msg.type], j = 0; subscribers && (obj = subscribers[j++]); )
            obj.sendMessage(msg);
    }
    
    this._queue = [];
}

Messenger.prototype.register = function(obj) {
    this._objects[obj] = obj;
}


//usage: messenger.subscribe(this, 'cow');
Messenger.prototype.subscribe = function(subscriber, topic) {
    (this._subs[topic] || (this._subs[topic] = [])).push(subscriber);
}

Messenger.prototype.sendMessage = function(msg) {
    this._queue.push(msg);
}

//------------------------------------------------------

function Sprite(params, engine) {
    var self = this;
    this.properties = {x:0, y:0, vx:0, vy:0, w:20, h:20, 
                       rotation:0, vrotation:0, 
                       gravity:0, energy:1, maxLifeTime:0, maxEnergy: 1, text:''};  
    this.properties.t0 = new Date();
    this._components = {};    

    var classList = params instanceof Array ? params : [params];
    
    for (var n = 0; n < classList.length; n++)
        for (var attrName in classList[n]) {
            var value = classList[n][attrName];
            var obj = typeof this.properties[attrName] != 'undefined' ? this.properties : this;
            obj[attrName] = value;
        }

    this._renderData = {engine:engine};            
        
    if (this.img) {
        this._renderData.img = this.img;       
        this.properties.w = this.img.width; 
        this.properties.h = this.img.height;
    }
    
    if (this.displaysEnergy) { //!!!! zamienic na displayPROPERTY
        var energyLabel = new TextComponent(engine, this);
        energyLabel.update = function(obj, props) {  
            var energy = props.energy, maxEnergy = props.maxEnergy;
            var prefix = self.displayPrefix? self.displayPrefix + ": " : '';
            this.text = prefix + (self.displaysEnergy=='%'? ~~(energy/maxEnergy*100) + '%' : energy);
            this.x = props.x + props.w/2 - (this.text.length*2);
            this.y = props.y - 20;
            var range = ~~(energy / maxEnergy * 3); 
            this.color = ['#f00', '#ee0', '#0e0'][Math.min(range, 2)];
        }
        this.addComponent(energyLabel);            
    }
    
    
    //!!! w ten sposob akcje z roznych klas nadrzednych beda sie nadpisywaly
    // czy nie lepiej zrobic tak ze dla kazdej klasy w classList bedzie tworzyl
    // nowy komponent ActionManager? trzeba to rozwazyc
    if (this.actions) 
        this.addComponent(new ActionManager(this, this.actions));    
          
    this.engine = engine;    

    this._handlers = this.handlers || {}; //!!!przekazywane przez referencje
    
    this.id = Math.floor(Math.random()*100000000);
    Messenger.getInstance().register(this);        
}

Sprite.prototype.toString = function(){
    return "#" + this.id;
}

Sprite.prototype.setRenderer = function(renderer) {
    this._renderer = renderer;
}

Sprite.prototype.addComponent = function(item) {
    this._components['k' + Math.floor(Math.random()*1000000)] = item; 
}

Sprite.prototype.destroy = function() {
    this._renderer.destroy(this._renderData);
    this.sendMessage({type:'destroy'});
}

Sprite.prototype.sendMessage = function(msg) {        
    var handler;        
    if (handler = this._handlers[msg.type])    
        handler.call(this, msg);    
        
     var components = this._components;     
     for (var id in components) {     
        components[id].sendMessage && components[id].sendMessage(msg);//!!!a co ze zm. `this` w handlerze?
     }
};    

Sprite.prototype.calculateGeometry = function(){
    var props = this.properties;
    props.x0 = props.x + props.w / 2;
    props.y0 = props.y + props.h / 2;
    props.r = Math.sqrt(props.w * props.w + props.h * props.h) / 2;
}
    
Sprite.prototype.update = function(tick){
    var t = new Date() - this.properties.t0;
    this.properties.t = t;
    if (this.properties.maxLifeTime && this.properties.maxLifeTime < t)
        this.dead = true;
    
    if (this._handlers.update)
        this._handlers.update.call(this, {type:'update'});

    for (var a in this._components) {
        var component = this._components[a];
        component.update && component.update(this, this.properties, tick);        
    }  
    this.calculateGeometry();
};

Sprite.prototype.render = function(){            
    for (var prop in this.properties)
       this._renderData[prop] = this.properties[prop];
    this._renderer && this._renderer.render(this._renderData);
    
    // rendering components...
    for (var a in this._components) {
        var component = this._components[a];
        component.render && component.render(this._renderData);            
    }
}

//------------------------------------------------------

function Movements() { }
Movements.prototype.update = function(obj, properties, tick) {
    properties.x += properties.vx * tick;
    properties.y += properties.vy * tick;    
    if (properties.gravity) 
        properties.vy += properties.gravity * tick;
    properties.rotation += properties.vrotation * tick;
}
Singleton(Movements);


function Character() {
}
Character.prototype.update = function(obj, properties) {
    if (obj.untouchableCounter && obj.untouchableCounter > 0)
        obj.untouchableCounter--;
    obj.untouchable = !!obj.untouchableCounter;        
    
    if (properties.energy <= 0)
        obj.dead = true;
}
Singleton(Character);
//------------------------------------------------------

function Renderer() {};
Singleton(Renderer);

Renderer.prototype.render = function(renderData) {
    if (!renderData.initialized)
        return this.init(renderData);
        
    var style = renderData.style;
    style.left = Math.floor(renderData.x) + "px";
    style.top = Math.floor(renderData.y) + "px";
    
    if (renderData.text)
        renderData.el.innerHTML = renderData.text;
};

Renderer.prototype.destroy = function(renderData) {
    renderData.el.parentNode.removeChild(renderData.el);
}

Renderer.prototype.init = function(renderData) {
    if (renderData.text && !renderData.img ) {
        var el = document.createElement('div');    
    }
    else
    if (renderData.img && renderData.img.src) {
        var el = document.createElement('img');    
        el.src = renderData.img.src;
    }
        

    el.className = 'sprite';
    
    renderData.el = el;
    renderData.style = el.style;
    renderData.initialized = true;    
    
    this.render(renderData);
    
    renderData.engine.currentScreen.domElement.appendChild(el);

}

//------------------------------------------------------

function Screen(domElement) {
    this.domElement = domElement;
    this._input = new Input(this.domElement, this.domElement);
}
Screen.prototype = new Array();

Screen.prototype.show = function() {
    this.domElement.style.display = 'block';
    this._input.start();
    //jQuery(this.domElement).fadeIn(200);
}
Screen.prototype.hide = function() {
   this.domElement.style.display = 'none';    
   this._input.stop();
   //jQuery(this.domElement).fadeOut(200);
}

//----------------------------------------------

function Engine(initialScreenId) {
    this._screenStack = [];
    this.displayScreen(initialScreenId);
    this.speed = 1;
}

Engine.prototype.start = function() {    
    var self = this;
    setInterval(function(){ 
        try{ self.update(); } catch(e) { alert("Engine Error: " + e); }        
    }, 20);
}

Engine.prototype.update = function(){
    var count = 0;
    var self = this;
    Time('Engine.update()');   // debug!!!
    var now = new Date();
    var tick = this._lastTime? (now - this._lastTime)/30: 1;
    tick *= this.speed;
    

    var list = this.currentScreen;
    
    for (var i = list.length-1; i >= 0; i--) {
        if (list[i].dead) {
            list[i].destroy();
            list.splice(i,1);            
        }
    }    
    
    for (var i = 0, len = list.length; i < len; i++) {
        var obj = list[i];
        obj.update(tick);
        obj.render();        
        
        count++;
    }         
    CollisionDetector.getInstance().update(list);       
    Messenger.getInstance().dispatch();    
    Time.end(); // debug!!!

    this._lastTime = now;
    
    if (this._hasToEnd) {
        setTimeout(function() {
            self.exitScreen();
            Messenger.recreate();
        }, 10);
        this._hasToEnd = false;
    }
}

Engine.prototype.reset = function() {
    this.currentScreen.domElement.innerHTML = '';
    this.currentScreen.length = 0;
}

Engine.prototype.createSprite = function(params) {
    var spr = new Sprite(params, this);
    spr.setRenderer(Renderer.getInstance());        
    spr.addComponent(Movements.getInstance());
    spr.addComponent(Character.getInstance());
    
    this.currentScreen.push(spr);    
    return spr;
}

Engine.prototype.displayScreen = function(screenId) {  

    if (this.currentScreen) {
        this.currentScreen.hide();
        this._screenStack.push(this.currentScreen);
    }
    
    var domEl = document.getElementById(screenId);            
    this.currentScreen = new Screen(domEl);     
    this.currentScreen.show();
}

Engine.prototype.endLevel = function() {
    this._hasToEnd = true;
}

Engine.prototype.exitScreen = function() {
    this.currentScreen.hide();
    this.currentScreen = this._screenStack.pop();
    if (this.currentScreen)
        this.currentScreen.show(); 
}

//--------------------------------------------------------


function CollisionDetector() { };
Singleton(CollisionDetector);

CollisionDetector.prototype.update = function(list) {
    var a, b, A, B, messenger = Messenger.getInstance();
    
    var ax0, ay0, dx, dy;
    
    for (a = 0; a < list.length - 1; a++) {
        A = list[a].properties;
        for (b = a + 1; b < list.length; b++) {        
            B = list[b].properties;           
            var x1 = Math.min(A.x, B.x);
            var x2 = Math.max(A.x + A.w, B.x + B.w);
            var y1 = Math.min(A.y, B.y);
            var y2 = Math.max(A.y + A.h, B.y + B.h);
            
            if ( (x2 - x1) <= (A.w + B.w) && (y2 - y1) <= (A.h + B.h) ) {
                 //!!! powinien wysylac msg, tylko jesli obiekt zglosil taka potrzebe
                 if (list[a].type==list[b].type) continue; //!!!!! to tylko testowy warunek, usunac.

                messenger.sendMessage({to: list[a], type:'collision', 'target': list[b]});
                messenger.sendMessage({to: list[b], type:'collision', 'target': list[a]});
            }
        }
    }    
    
}


CollisionDetector.prototype.circle__update = function(list) {
    var a, b, A, B, messenger = Messenger.getInstance();
    
    var ax0, ay0, dx, dy;
    
    for (a = 0; a < list.length - 1; a++) {
        A = list[a].properties;
        ax0 = A.x0;
        ay0 = A.y0;
        
        for (b = a + 1; b < list.length; b++) {        
            B = list[b].properties;           
            dx = (ax0 - B.x0) ;//|| 0;
            dy = (ay0 - B.y0) ;//|| 0;
            var r = A.r + B.r;
            if (dx*dx + dy*dy < r * r) {
                 //!!! powinien wysylac msg, tylko jesli obiekt zglosil taka potrzebe
                 if (list[a].type==list[b].type) continue; //!!!!! to tylko testowy warunek, usunac.

                messenger.sendMessage({to: list[a], type:'collision', 'target': list[b]});
                messenger.sendMessage({to: list[b], type:'collision', 'target': list[a]});
            }
        }
    }    
    
}

//------------------------------------------------------ 298

function ActionSequenceIterator(actions, globalContext) {
    var index = 0, context = {id:Math.floor(Math.random()*1000), common: globalContext};    
    return function(){ 
        var result = actions[index] ? actions[index].call(this, context) : 2;
        switch (result) {            
            case -2:  // rewind
                index = 0; break;
            case -1: // step backward
            case 1:  // step forward
                index += result; break;
            case 2: // terminate
                return 1;  
        }
    };
}    

//----------------- 241

function ActionManager(owner, actions) {
    actions = this._actions = (actions || {});
    this._runningActions = []; // used as a stack 
    this._context = {};
    this._context.common = this._context;
    this._owner = owner;
    this.sendMessage({to:owner, type:'start'}); //!!! this.sendMessage zamiast Messenger.sendMessage
}

ActionManager.prototype.update = function(){ 
    var result = this._execute? this._execute.call(this._owner): 1;
    if (result == 1) 
        this._execute = this._runningActions.pop();
}

ActionManager.prototype.sendMessage = function(msg) {
    var newAction = this._actions[msg.type];
    if (newAction) {
        if (this._execute)
            this._runningActions.push(this._execute);
        this._execute = new ActionSequenceIterator(newAction, this._context);
    }
}
// 266 // 264


// uses: jQuery
function Input(parent, domElement) {
    var enabled = false;
    function dispatch(e) {  
        if (!enabled)
            return;
        e.preventDefault();
        var offset = $(parent).offset();
        var x = e.pageX - offset.left;
        var y = e.pageY - offset.top;
        Messenger.getInstance().sendMessage({type: e.type, x: x, y: y, e:e});
        //$(e.target).css('background', ['red','blue','green','yellow'][~~(Math.random()*4)]);
    }
    var events = ['mousemove', 'mousedown', 'mouseup'];        
    this.start = function() {
        enabled = true;
        for (var i = 0, $d = $(document); i < events .length; i++) 
            $d.bind(events[i], dispatch);
    }
    this.stop = function() {
        enabled = false;
    }
}

//---------------

function ImageLoader(images, callback) {
    var totalCount = 0, loadedCount = 0;
    
    function imgToStr() { return this.src; }    
    function onLoad() {
        images[this.spriteType] = {width: this.width, height: this.height, 
                                   src: this.src, img: this, toString: imgToStr};
        if (++loadedCount >= totalCount)  
            callback();
    }

    for (var name in images) 
        totalCount++;
        
    for (var name in images) {
        var img = new Image();
        img.spriteType = name; //!!! moze lepiej img.className?
        img.onload = onLoad;
        img.src = images[name];
    }    
    return images;
}


//------------------------------
//
//-----------------------------------------
//---------------------------------------
// ---------- GRA -------------------------

window.onload = function() {


// ---------- Game Constants -----------------------

var IMG_PATH = "images/";
var GROUND_Y = 500;
var WITCH_Y = 100;
var ANIMAL_COUNT = 8;
var ANIMAL_HEIGHT = 75;
var ANIMAL_Y = GROUND_Y;

var LOADING_GUN_TIME_1 = 600;
var LOADING_GUN_TIME_2 = 3300;

/*var images = {'apple': IMG_PATH+'golden-apple.png', 
              'witch': IMG_PATH + 'fiolet/witch.png', 
              'cow': IMG_PATH + 'fiolet/cow4.png',
              'bear': IMG_PATH + 'bear.png',
              'bullet': 'bullet.gif',
              'launcher': IMG_PATH + 'shooter.png',
              'roomWindow': IMG_PATH + 'window-cat.png',
              'ground': IMG_PATH + 'ground.png',
              'sight': IMG_PATH+'sight.png', 
              };*/
              

var images = {'apple': IMG_PATH+'golden-apple.png', 
              'witch': IMG_PATH + 'fiolet/witch.png',
              'cow': IMG_PATH + 'fiolet/cow4.png',
              'bear': IMG_PATH + 'bear.png',
              'bullet': 'bullet.gif',
              'launcher': IMG_PATH + 'shooter.png',
              'roomWindow':  IMG_PATH + 'window-cat.png',
              'ground':  IMG_PATH + 'ground.png',
              'sight': IMG_PATH+'sight.png', 
              };              

new ImageLoader(images, function(){


// DEBUG
//$('body').append("<button id='przycisk'>przycisk</button>");
//$('body').append("<button id='przycisk-2'>wyjdz</button>");

$(".button-about").click(function() {
    engine.displayScreen('about');
});


var skipLevel;

$("#level").click(function() { skipLevel(); });


$(".button-play").click(function() {

    level1();
    $("#level-number").text("1");
    engine.displayScreen('level');
    
    var words = $("#level .dialog").attr('data-text').split('');
    $("#level .dialog").html('');
    function displayLikeTypeMashine() {
        var html = $("#level .dialog").html();
        $("#level .dialog").html(html + words.shift());
        if (words.length)
            setTimeout(displayLikeTypeMashine, 40);
        else
            setTimeout(function() {        
                skipLevel(); 
            }, 1200);

    }
    setTimeout(displayLikeTypeMashine, 100);
    
    
    
});

$("a[href=#exit]").click(function() {
    engine.exitScreen();
});

$("a[href=#todo]").click(function() {
    alert(this.getAttribute('data-desc'));
});



// ~DEBUG


var animals = [];
var engine = new Engine("screen-menu");

var screen = {width:800, height:600};
// ------------------ Game Types -------------------
var RoomWindow = {
    x: 300, y:100, type:'roomWindow', img:images.roomWindow
}

var Ground = {
    x: 0, y:GROUND_Y, type:'ground', img:images.ground
}


var Launcher = {
    vx:0/*3*/, x: 160, y:220, handlers: {
        update: function(msg) {   
            var t = this.properties.t;
            //this.properties.vx = Math.cos(t / 600) * 1.3;
            //var vy = Math.sin(this.properties.t / 460) * 5 ;
            //this.properties.vx = Math.cos(t / 700) * 1;
            //var vy = Math.sin(this.properties.t / 560) * 1.4 ;
            //this.properties.vy = vy;
            this.properties.x = 110 + Math.cos(this.properties.t/700) * 2;
            this.properties.y = 200 + Math.sin(this.properties.t/400) * 82;


            var now = new Date();
            var deltaTime = now - this.lastTime;            
            this.properties.energy = Math.min(deltaTime / LOADING_GUN_TIME_2, 1);
            /*if (this.properties.x > 200 || this.properties.x<0)
                this.properties.vx *= -1;*/
            var myX = this.properties.x0;
            var myY = this.properties.y0;  
            var r = 140;          
            var angle = Math.atan2(this.lastMouseY - myY, this.lastMouseX - myX);
            sight.properties.x = myX + r * Math.cos(angle);
            sight.properties.y = myY + r * Math.sin(angle);            
                
                
        },    
        mousedown: function(msg) {
            //this.properties.x = msg.x - this.properties.w / 2; 
            //this.properties.y = msg.y - this.properties.h / 2; 
            var now = new Date();
            var speed = 18;         
            var deltaTime = now - this.lastTime;
            if (deltaTime < LOADING_GUN_TIME_1)
                return;
                            
            if (this.lastTime!==null && deltaTime < LOADING_GUN_TIME_2) {
                speed *= deltaTime / LOADING_GUN_TIME_2;
            }
                
            this.lastTime = now;
            var angle = Math.atan2(msg.y - this.properties.y, msg.x - this.properties.x);

            for (var i=0; i<3; i++) {
                angle += 0.1 + Math.random()*0.02;
                var vx = speed * Math.cos(angle);
                var vy = speed * Math.sin(angle);            
                var bullet = {type:'bullet', img: images.bullet, vrotation:56, 
                              vx:vx, vy:vy, gravity:GRAVITY, 
                              x:this.properties.x, y:this.properties.y,
                              maxLifeTime:3000, handlers: {
                                update: function() {
                                    var pos = this.properties;
                                    /*if (this.properties.y<0) {
                                         this.properties.y = 0;
                                         this.properties.vy *= -0.6;
                                    }*/
                                    
                                    if (1 || pos.t > 1000 && pos.t < 1500 ) {
                                        var wx = witch.properties.x;
                                        var wy = witch.properties.y;                                    
                                        var dx = wx - pos.x;
                                        var dy = wy - pos.y;                                    
                                        if (dx*dx + dy*dy < 160*160) {
                                        pos.vx += dx/220;
                                        pos.vy += dy/220;         
                                        }                           
                                     }

                                    
                                    
                                    
                                }
                              }
                };
                engine.createSprite(bullet);
                speed *= Math.random()*0.1 + 0.95;

            }   
        },
        mousemove : function(msg) {
            this.lastMouseX = msg.x;
            this.lastMouseY = msg.y;            
        }
    
    
    },
    displaysEnergy: '%',
    displayPrefix:'charging',
    lastTime:null,
    img: images.launcher,
    type:'launcher'
}

var Sight = {type:'sight', img:images.sight};
var witch;

var launcher, sight, score;
var GRAVITY = 0.15;

$("#congratulations, #failure").click(function() {
    $(this).hide();
    engine.endLevel();
});

var Witch = {
    energy: 100, maxEnergy:100,  x:400, y:100, handlers: {
            collision: function(msg){
                if (this.untouchable)
                    return;
                if (msg.target.type!='bullet')
                    return;
                msg.target.dead = true;
                this.sendMessage({type:'hit', target:msg.target});
                /*this.properties.background = 'green';
                this.properties.y = 10;
                this.properties.x = Math.random() * screen.width;*/
                this.untouchableCounter = 10;
                (this.properties.energy -= 6) >= 0 || (this.properties.energy = 0);
            },
            hit: function(msg) {
                var $overlay = $("#overlay");                
                var opacity = (Math.random()*0.4 + 0.4).toFixed(2);
                $overlay.css('opacity', opacity).show();
                setTimeout(function() {
                    $overlay.hide();
                }, 150);

            },
            destroy: function(msg) {
                for (var i=0; i<4; i++) {
                    var vx_sign = Math.random()>0.5? 1 : -1;
                    var vx = vx_sign*(Math.random()*3+1);
                    var vy = -(Math.random() - 0.5)*3 - 2;                    
                    engine.createSprite( {type:'apple', img: images.apple, vrotation:56, 
                                          x: this.properties.x, y:this.properties.y, 
                                          vx:vx, vy:vy, gravity:GRAVITY, maxLifeTime:2700});
                     
                    
                    setTimeout(function() {
                        var deadAnimals = score.deadAnimals;
                        var damagePerAnimal = (screen.height - ANIMAL_Y + ANIMAL_HEIGHT);
                        var deadAnimalsDamage = damagePerAnimal * deadAnimals;
                        var livingAnimalsDamage = (score.damage - deadAnimalsDamage);
                        var totalAnimalDamage = deadAnimals + (livingAnimalsDamage / damagePerAnimal);

                        var livingAnimalsPenalty = (livingAnimalsDamage / damagePerAnimal) / ANIMAL_COUNT * 100;
                        var deadAnimalsPenalty = deadAnimals / ANIMAL_COUNT * 100;

                        var damagePenalty = (totalAnimalDamage / ANIMAL_COUNT * 100);;
                        var percent = 100 - damagePenalty;
                        $("#congratulations-damage").text(Math.floor(livingAnimalsPenalty) + "%");
                        var text = deadAnimals + " (" + (~~deadAnimalsPenalty) + "%)";
                        $("#congratulations-dead-animals").text(text);
                        $("#congratulations-total-score").text(Math.floor(percent)+"%");
                        $("#congratulations").fadeIn();
                    }, 3000);

                }
            }
            
     },
     actions: {
       'start': [            
            selectRandomElement(animals),
            selectCoordinates(null,WITCH_Y),
            moveTo(5),
            create(engine, {type:'apple', img: images.apple, vrotation:56, 
                            x:90, y:40, vx:-0.4, vy:-1, 
                            gravity:GRAVITY, maxLifeTime:4000}, true, false),            
            create(engine, {type:'apple', img: images.apple, vrotation:56, 
                            x:90, y:40, vx:0.3, vy:-1, 
                            gravity:GRAVITY, maxLifeTime:4000}, true, false),            
            selectRandomCoordinates(360, 30, screen.width-30, 300),
            moveTo(4),
            create(engine, {type:'apple', img: images.apple, vrotation:56, 
                            x:90, y:40, vx:-7, vy:-3, 
                            gravity:GRAVITY, maxLifeTime:4000}, true, false),            
            create(engine, {type:'apple', img: images.apple, vrotation:56, 
                            x:90, y:40, vx:-2, vy:-2, 
                            gravity:GRAVITY, maxLifeTime:4000}, true, false),            

            repeat()  ], 
       'hit': [
            moveTo(12, null, 40),
            selectRandomCoordinates(200, 400, screen.width-200, 400),
       ]
      },
      img: images.witch,
      type: 'witch',
      displaysEnergy: '%'
};

var Cow = {
        energy: 20,
        handlers: {
            collision: function(msg){
                if (msg.target.type!='apple' && msg.target.type!='bullet') //!!! to tak nie moze byc
                    return;
                

                    
                    
                var $overlay = $("#overlay-fail");
                $overlay.show().fadeOut(300);
                /*setTimeout(function() {
                    $overlay.hide();
                }, 200);*/
                    
                    
                    
                this.properties.background = 'blue';
                var damage = msg.target.type=='apple'? 2 : 1;
                this.properties.y += damage;

                score.damage += damage;                                
                if (this.properties.y > screen.height && !this.dead) {
                    var myIndex =  animals.indexOf(this);
                    if (myIndex != -1)
                        animals.splice(myIndex, 1);
                    this.dead = true;
                    score.deadAnimals += 1;
                    //score.damage += 100;
                }
            }
        },
        img: images.cow,
        actions: {
            'collision____DISABLED': [moveTo(2, Math.random()*200,450), endLevel()]
        },
        type: 'cow', displaysEnergy: false
};
    
// ------------ Game Levels ---------------------
engine.start();

function level1() {
    score = {damage: 0, deadAnimals:0,
             getTotalDamageInPercent: function() {
                var deadAnimals = this.deadAnimals;
                var damagePerAnimal = (screen.height - ANIMAL_Y + ANIMAL_HEIGHT);
                var deadAnimalsDamage = damagePerAnimal * deadAnimals;
                var livingAnimalsDamage = (this.damage - deadAnimalsDamage);
                var totalAnimalDamage = deadAnimals + (livingAnimalsDamage / damagePerAnimal);
                return Math.floor(totalAnimalDamage / ANIMAL_COUNT * 100);
            }            
    };
    skipLevel = (function () {
        var done = false;
        return function() {
            if (!done) {
                engine.exitScreen()
                setTimeout(function() {
                    $("#level1-info").fadeIn(600).fadeTo(4000,1).fadeOut(3000); //!!!!!! to tak nie moze byc
                // powinno byc bardziej uniwersalne do kazdego levela
                }, 600);
                
            }
            done = true;
        }
    })();




    engine.displayScreen('game');
    engine.reset();
    
    engine.createSprite(RoomWindow);
    engine.createSprite(Ground);
    
    witch = engine.createSprite([Witch, {x:Math.random()*300}]);      
    for (var i = 0; i < ANIMAL_COUNT; i++) {
        var concreteCow = {x: (Math.random()*20+90*i) + 20, y:GROUND_Y- 75, vx:0, vy:0}
        if (Math.random()<0.4) concreteCow.img = images.bear;
        animals.push(engine.createSprite([Cow, concreteCow]));
    }    
    launcher = engine.createSprite(Launcher);
    sight = engine.createSprite(Sight);    
    Messenger.getInstance().subscribe(launcher, 'mousemove');
    Messenger.getInstance().subscribe(launcher, 'mousedown');
    
    var damageDisplay = new TextComponent(engine, null, 'damage-display');
    damageDisplay.color = '#a00';
    damageDisplay.x = 400;
    damageDisplay.y = 260;    
    damageDisplay.update = function() {
        this.text = "Damage: " + score.damage;
    }
    var dummy = engine.createSprite({
        handlers: {
            update: function(){
                this.properties.text = "Our damages: " + score.getTotalDamageInPercent() + "%";
            }
        }, x:330,y:520
    });
    //dummy.addComponent(damageDisplay);
    $("#damage-display").show();
    var interval = setInterval(function() {
        if (!animals.length) {
            $("#failure").show();
            clearInterval(interval);
        }
    }, 333);
    
    
}    
 
 
// ---------- Game Initialization -----------------




});

};








//-----------------------------------------------------------


// debug


//-----------------------------


function Time(name) {
    Time.current = {name:name, t0: new Date()};   
}
Time.HOW_MANY = 300;
Time.end = function(){
    var lapse = new Date() - Time.current.t0;
    var data = Time._data[Time.current.name] || (Time._data[Time.current.name] = {sum:0, counter:0});
    data.sum += lapse;  
    if (++data.counter >= Time.HOW_MANY) {
        data.sum = 0;
        data.counter = 0;
    }
}
Time._data = {}


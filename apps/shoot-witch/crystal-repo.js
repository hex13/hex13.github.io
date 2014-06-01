
function create(engine, params, bCopyPosition, bCopyVelocity) {
    return function() {
        var spr = engine.createSprite(params);
        if (bCopyPosition) {
            spr.properties.x += this.properties.x;
            spr.properties.y += this.properties.y;
        }
        if (bCopyVelocity) {
            spr.properties.vx = this.properties.vx;
            spr.properties.vy = this.properties.vy;
        }
        return 1;
    }
}

//-----------------------




function repeat() {
    return function(){
        return -2;
    }
}

function selectRandomElement(arr) {
    return function(context) {      
        var len = arr.length;
        if (len) {
            var i = Math.floor(Math.random() * len);
            var obj = arr[i];
            context.target = obj;
            context.x = obj.properties.x;
            context.y = obj.properties.y;
            //alert(obj.type/*i + ": " + len*/);
            //console.log(" TYPE:" + obj.type +", " + context.x + "I: " + i);
        }
        return 1;
    }
}

function selectCoordinates(x, y) {
    return function(context) {
        context.x = typeof x != 'undefined' && x!==null? x : context.x;
        context.y = typeof y != 'undefined' && y!==null? y : context.y;
        return 1;
    }
}

function selectRandomCoordinates(minx, miny, maxx, maxy) {
    return function(context) {
        var dx = maxx - minx;
        var dy = maxy - miny;                
        context.x = Math.random() * dx + minx;
        context.y = Math.random() * dy + miny;        
        return 1;
    }
}


function moveTo(speed, targetx, targety) {
    return function(context) {
    
        // we must operate on copies, we can't change targetx or targetx
        // because they are closure variables and messing with those would affect 
        // future calls of this function
        var tx = targetx, ty = targety;
        
        var properties = this.properties;        
        
        if (typeof tx=='undefined' || tx === null)
            tx = context.hasOwnProperty('x')? context.x : properties.x;
        if (typeof ty=='undefined' || ty === null)  
            ty = context.hasOwnProperty('y')? context.y : properties.y;
            
        var dx = (tx - properties.x);
        var dy = (ty - properties.y);        
        var dist = Math.sqrt(dx * dx + dy * dy);          
        var done = dist < speed;
        if (!done) 
            var factor = speed / dist;                   

        properties.vx = done? 0 : dx * factor;
        properties.vy = done? 0 : dy * factor;

        context.sum = (context.sum || 0) + 10;

        return done? 1: 0;
    }
}

function endLevel() {
    return function() {
        return 1;
    }
}

function TextField() {

}
//TextField.prototype.text 
// components

function TextComponent(engine, owner, className) {    
    var el = document.createElement('div');
    el.className = 'sprite' + (className? (' ' + className): '');
    $(engine.currentScreen.domElement).append(el);
    return {
        render: function() {
             el.style.left = this.x + "px";
             el.style.top = this.y +"px";             
             el.style.color = this.color;
             el.innerHTML = this.text;
        },
    }
}




/*function MoveToAction(speed, targetx, targety) {
    var execute = this.execute = function(context) {        
            var properties = this.properties;
            var dx = (targetx - properties.x);
            var dy = (targety - properties.y);        
            var dist = Math.sqrt(dx * dx + dy * dy);          
            var done = dist < speed;
            if (!done) 
                var factor = speed / dist;                   
            properties.vx = done? 0 : dx * factor;
            properties.vy = done? 0 : dy * factor;
            context.sum = (context.sum || 0) + 10;
            return done? 1: 0;
    };
    
}



//-----------------------

function MoveToObjectAction(speed, target) {
   
    var execute = this.execute = function(context) {      
        var moveToAction = new MoveToAction(speed, target.properties.x, target.properties.y);
        return moveToAction.execute.call(this, context);
    }
}



function MoveToObjectAction2(speed) {
    var execute = this.execute = function(context) {      
        var target = context.target;
        var moveToAction = new MoveToAction(speed, target.properties.x, target.properties.y);
        return moveToAction.execute.call(this, context);
    }
}




function RandomElementAction(arr) {   
    this.execute = function(context) {      
        var len = arr.length;
        var i = ~~(Math.random() * len);
        context.target = arr[i];
        alert(i + ": " + len);
        return 1;
    }
}


function RepeatAction() {
    this.execute = function(){
        return -2;
    }
}

*/






//---------------------

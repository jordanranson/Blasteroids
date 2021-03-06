Player = {};

Player.collide = function(entity) {
    var x = -entity.radius, 
        y = -entity.radius-(game._scalar*.5);
}

Player.update = function(entity) {
    if( !entity.alive ) return entity;

    // handle input
    if( entity.name === game.playername ) {


        // update camera position
        game.camera.x += (entity.pos.x+entity.radius - game.camera.x) / 33;
        game.camera.y += (entity.pos.y+entity.radius - game.camera.y) / 33;

        // movement
        if( game.input.state(Key.w) ) {
            entity.vel.x += Math.cos(Math.radians(entity.angle))*entity.speed;
            entity.vel.y += Math.sin(Math.radians(entity.angle))*entity.speed;
        }
        if( game.input.state(Key.s) ) {
            entity.vel.x -= Math.cos(Math.radians(entity.angle))*(entity.speed*.6);
            entity.vel.y -= Math.sin(Math.radians(entity.angle))*(entity.speed*.6);
        }

        // rotation
        var rotationSpeed = 2; // 120 / 60 - degrees per second / 60 seconds = 2;
        if( game.input.state(Key.a) ) {
            entity.angle = entity.angle-rotationSpeed<0?359:entity.angle-rotationSpeed;
        }
        if( game.input.state(Key.d) ) {
            entity.angle = entity.angle+rotationSpeed>359?0:entity.angle+rotationSpeed;
        }

        // attack
        if( game.input.pressed(Key.space) ) {

            var x = (entity.pos.x + entity.radius) + (entity.radius * Math.cos(Math.radians(entity.angle))),
                y = (entity.pos.y + entity.radius) + (entity.radius * Math.sin(Math.radians(entity.angle)));
            
            var time = (new Date()).getTime();
            var projectile = {
                name: 'p'+time,
                type: 'projectile',
                tech: 'none',
                owner: entity.name,
                pos: {x: x, y: y},
                last: {x: y, y: y},
                vel: {x: 0, y: 0},
                speed: 0,
                angle: entity.angle,
                alive: true,
                spawned: time,
                color: entity.reactorColor
            };

            game.spawnEntity( projectile );
        }

        // use tech
        if( game.input.pressed(Key.shift) ) {
            console.log('tech')
        }

        // switch tech
        if( game.input.pressed(Key.q) ) {
            console.log('switch tech')
        }
    }

    // clamp velocity
    var maxVel = entity.speed * 40;
    if( entity.vel.x >  maxVel )  entity.vel.x =  maxVel;
    if( entity.vel.x < -maxVel )  entity.vel.x = -maxVel;
    if( entity.vel.y >  maxVel )  entity.vel.y =  maxVel;
    if( entity.vel.y < -maxVel )  entity.vel.y = -maxVel;

    // update position
    entity.pos.x += entity.vel.x;
    entity.pos.y += entity.vel.y;

    // decay velocity
    entity.vel.x *= .997;
    entity.vel.y *= .997;

    // send to server
    if( entity.name === game.playername && (entity.pos.x<<0 !== entity.last.x<<0 || entity.pos.y<<0 !== entity.last.y<<0) ) {
        socket.emit('updateentity', entity);
    }

    // new last position
    entity.last.x = entity.pos.x;
    entity.last.y = entity.pos.y;

    return entity;
};

Player.render = function(entity) {
    var canvas = document.createElement('canvas');
        canvas.width = entity.radius*2;
        canvas.height = entity.radius*2;

    var context = canvas.getContext('2d');

    var i, x, y;


    /*
     * draw entity shapes
     */

    context.lineWidth = 2;
    context.lineJoin = 'bevel';
    for ( i = 0; i < entity.shapes.length; i++ ) {
        context.beginPath();
        context.strokeStyle = entity.shapes[i].color;

        context.moveTo(entity.radius+(entity.shapes[i].points[0].x*game._scalar), entity.radius+(entity.shapes[i].points[0].y*game._scalar));
        for( var k = 0; k < entity.shapes[i].points.length; k++ ) {
            x = entity.radius+(entity.shapes[i].points[k].x*game._scalar);
            y = entity.radius+(entity.shapes[i].points[k].y*game._scalar);
            context.lineTo(x, y);
        }
        for( var k = entity.shapes[i].points.length-1; k >= 0; k-- ) {
            x = entity.radius+((entity.shapes[i].points[k].x*game._scalar)*-1);
            y = entity.radius+(entity.shapes[i].points[k].y*game._scalar);
            context.lineTo(x, y);
        }
        context.stroke();
    }

    return canvas;
};

Player.draw = function(entity) {
    if( !entity.alive ) return;

    // render ship and cache the context
    if( !(entity.name in game.entityCanvas) ) {
        game.entityCanvas[entity.name] = Player.render(entity);
    }

    game.context.save();

    game.context.translate(entity.pos.x, entity.pos.y);
    game.context.translate(entity.radius, entity.radius);
    game.context.rotate(Math.radians(entity.angle+90));


    /* 
     * draw ship
     */


    game.context.globalAlpha = 1;
    game.context.drawImage(game.entityCanvas[entity.name], -entity.radius, -entity.radius-(game._scalar*.5));


    /* 
     * draw hitbox
     */

    // game.context.save();

    // game.context.strokeStyle = '#999';
    // game.context.globalAlpha = 0.5;
    // game.context.setLineDash([2,3]);
    // game.context.lineWidth = 1;
    // game.context.beginPath();
    // game.context.arc(0,0,entity.radius*.7,0,2*Math.PI);
    // game.context.stroke();

    // game.context.restore();


    /* 
     * draw reactor cores
     */

    y = entity.reactorPos*game._scalar - (game._scalar*.5);

    game.context.save();

    var time = new Date().getTime() * 0.1;
    game.context.translate(0, y);
    game.context.rotate(Math.radians( time % 360 ));

    game.context.strokeStyle = entity.reactorColor;
    game.context.lineWidth = 2;
    game.context.fillStyle = 'transparent';
    game.context.globalAlpha = Math.random()*.5+.5;
    game.context.regularPolygon(0, 0, 7.5, 3);
    game.context.stroke();

    game.context.restore();


    /* 
     * draw jet flames
     */

    if( entity.name === game.playername && game.input.state(Key.w) ) {
        y = entity.radius*.9;
        var sin = Math.sin(time*.9);

        game.context.save();

        game.context.translate(0, y);

        game.context.strokeStyle = entity.reactorColor;
        game.context.lineWidth = 2;
        
        game.context.beginPath();
        game.context.globalAlpha = sin<.5 ? 0 : .7;
        game.context.moveTo(-game._scalar, 0);
        game.context.lineTo(0, 1.8*game._scalar);
        game.context.lineTo(game._scalar, 0);
        game.context.stroke();
        game.context.closePath();

        game.context.beginPath();
        game.context.globalAlpha = sin<.5 ? 1 : 0;
        game.context.moveTo(-.4*game._scalar, 0);
        game.context.lineTo(0, .6*game._scalar);
        game.context.lineTo(.4*game._scalar, 0);
        game.context.stroke();
        game.context.closePath();

        game.context.restore();
    }

    if( entity.name === game.playername && game.input.state(Key.s) ) {
        y = -entity.radius*.9;
        var sin = Math.sin(time*.9);

        game.context.save();

        game.context.translate(0, y);

        game.context.strokeStyle = entity.reactorColor;
        game.context.lineWidth = 2;

        game.context.beginPath();
        game.context.globalAlpha = sin<.5 ? .7 : 0;
        game.context.moveTo(-.4*game._scalar, 0);
        game.context.lineTo(0, -.6*game._scalar);
        game.context.lineTo(.4*game._scalar, 0);
        game.context.stroke();
        game.context.closePath();

        game.context.restore();
    }


    game.context.restore();
};
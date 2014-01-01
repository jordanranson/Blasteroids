global.Entity = global.Class.extend({

    pos: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },

    maxVel: 3,
    speed: .1,
    friction: .997,

    id: 0,
    name: '',
    class: 'Entity',

    events: {},

    lastUpdate: 0,

    init: function( x, y, settings ) {
    
        // Set position
        this.pos.x = x ? x : 0;
        this.pos.y = y ? y : 0;

        // Hook up socket events
        for( var key in this.events ) {
            //global.game.socket.on( key, this[this.events[key]] );
        }

        // Extend properties from settings
        this.lastUpdate = Date.now();
        this.updateEntity( Date.now(), settings );
    },

    update: function( time ) {

        // Difference between last update and current time
        var delta = time - this.lastUpdate;

        // clamp velocity
        if( this.vel.x >  this.maxVel ) this.vel.x =  this.maxVel;
        if( this.vel.x < -this.maxVel ) this.vel.x = -this.maxVel;
        if( this.vel.y >  this.maxVel ) this.vel.y =  this.maxVel;
        if( this.vel.y < -this.maxVel ) this.vel.y = -this.maxVel;

        // update position
        this.pos.x += this.vel.x * delta;
        this.pos.y += this.vel.y * delta;

        // collision
        this.collide( delta );

        // decay velocity
        this.vel.x *= this.friction * delta;
        this.vel.y *= this.friction * delta;

        // new last position
        this.last.x = this.pos.x;
        this.last.y = this.pos.y;

        // new update time
        this.lastUpdate = Date.now();
    },

    collide: function( delta ) {
        
    },

    updateEntity: function( time, settings ) {
        for( var key in settings ) {

            // Update objects
            if( typeof this[key] === 'object' ) {
                for( var k in settings[key] ) {
                    this[key][k] = settings[key][k];
                }
            }

            // Update everything else
            else if( typeof this[key] !== 'function' ) {
                this[key] = settings[key];
            }
        }
        this.update( time );
    }

});
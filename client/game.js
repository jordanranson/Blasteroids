global.Game = global.Class.extend({

    socket: null,
    input: null,
    draw: null,
    camera: null,

    entities: [],
    particles: [],

    universe: {},
    playerName: 'anonymous',

    init: function() {
        this.input = new global.Input();
        this.draw = new global.Draw( '#canvas' , global.Constants.CLEAR_COLOR );
        this.camera = new global.Camera();

        this.bindSockets();
    },

    bindSockets: function() {
        var self = this;

        this.socket = io.connect( 
            global.Constants.SERVER_URL + ':' + 
            global.Constants.SERVER_PORT );

        // Request to join the game
        var packet = global.Packet.create({
            name: prompt( 
                "What's your name?", 
                'anon'+((new Date()).getTime()>>4).toString(16) )
        });
        this.socket.emit(   'game:join', packet );

        // Server accepted player join request
        this.socket.on(     'server:join', 
            function( data ) { self.join( data ) });

        // Duplicate name detected
        this.socket.on(     'server:invalid_name', 
            function( data ) { self.invalidName( data ) });

        // Server spawned an entity
        this.socket.on(     'server:spawn_entities', 
            function( data ) { self.spawnEntities( data ); });

        // Server removed an entity
        this.socket.on(     'server:remove_entity', 
            function( data ) { self.removeEntity( data ); });
    },

    update: function( time ) {

        // Update input handler
        this.input.update();

        // Update
        var i = this.entities.length;
        while( i-- ) {
            this.entities[i].handleInput( time, this.input ); 
            this.entities[i].update( time );
        }

        // Draw
        this.draw.clear();
        i = this.entities.length;
        while( i-- ) {
            this.entities[i].draw( this.draw );
        }
    },

    run: function() {
        var self = this;

        window.requestAnimFrame = (function() {
            return window.requestAnimationFrame   ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                function( callback ) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();

        (function animloop(){
            requestAnimFrame(animloop);
            self.update( Date.now() );
        })();
    },

    spawnEntities: function( packet ) {
        var entities = packet.data.entities;

        var i = entities.length;
        while( i-- ) {
            console.log( 'spawned:', packet );
            this.spawnEntity( entities[i].clientClassName, entities[i] );
        };
    },

    spawnEntity: function( className, settings ) {
        if( settings === undefined ) settings = {};

        var entity = new global[className]( settings.id, settings );
        this.entities.push( entity );

        return entity;
    },

    removeEntity: function( packet ) {
        console.log( 'removed:', packet );
        this.entities.remove( packet.data.id );
    },

    join: function( packet ) {
        console.log( 'joined:', packet );
        this.playerName = packet.data.name;
    },

    invalidName: function( packet ) {
        var packet = global.Packet.create({
            name: prompt( 
                packet.data.msg + ' Please choose a different name:', 
                'anon'+((new Date()).getTime()>>4).toString(16) )
        });
        this.socket.emit( 'game:join', packet );
    }

});
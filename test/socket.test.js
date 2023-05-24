const io = require('socket.io-client');
const request = require("supertest");
const app = require("../server"); // Replace with the path to your Express app file

describe("TEST SOCKET.IO", () => {

    let socket;

    beforeAll(() => {
        app.listen(8000)

        // Connect to the Socket.IO server        
        socket = io('http://localhost:8000');
    });

    afterAll((done) => {
        // Disconnect from the Socket.IO server
        socket.disconnect();
        done();
    });

    it("GET /usuario_gps should respond with a 200 status code", async () => {
        const response = await request(app).get("/usuario_gps")
        expect(response.statusCode).toBe(200)
    })

    test('should receive a message server "Bienvenido al chat de Ruta Amigapp, recuerda seguir nuestras políticas de uso."', (done) => {
        const expectedMessage = 'Bienvenido al chat de Ruta Amigapp, recuerda seguir nuestras políticas de uso.';

        // Listen for the "message" event
        socket.on('chat send server message', (message) => {
            expect(message).toBe(expectedMessage);
            done();
        });


    });

    test('should receive list data rooms enabled', (done) => {
        // Listen list users in rooms
        socket.emit('send_list_rooms')

        // Event on list user in run
        socket.on('send_list_enable_rooms', (data) => {
            // Listen for the "message" event            
            expect(typeof data).toEqual('object');
            done();
        });
    });

    test('should receive gps data form user event"', (done) => {

        const dataGPS = JSON.stringify({ room: "Ruta 4", data: [-75, 34] })
        // Listen list users in rooms
        socket.emit('geo_posicion', { room: "Ruta 4", data: [-75, 34] })

        // Event on list user in run
        socket.on('chat_send_server_message', (data) => {
            // Listen for the "message" event            
            expect(JSON.stringify(data)).toEqual(dataGPS);
            done();
        });
    });

    test('should receive join room users, validate if exists room', (done) => {
        // Event on list user in run
        const roomdata = { room: 'Ruta 5', type: 'user-data-gps'}
        //JOIN ROOM
        socket.emit('server_join_room',roomdata )

        // Listen list users in rooms
        socket.emit('send_list_rooms')

        // Event on list user in run
        socket.on('send_list_enable_rooms', (data) => {
            // Listen for the "message" event            
            expect(data.roomsNames.includes(roomdata.room)).toBeTruthy()
            done();
        });   
    });

    test('should receive users send message chat and all users get message', (done) => {

        //Event send menssage

        //JOIN ROOM
        socket.emit('server_join_room', { room: 'Ruta 4', type: 'user-data-gps'})
        //SEND MESSAGE DATA
        socket.emit('chat_send_message', { message: 'hola mundo', route: 'Ruta 4' })
        //GET MESSAGE DTA
        socket.on('message_chat', (data) => {
            // Listen for the "message" event            
            expect(data.message).toBe('hola mundo');
            done();
        });

    });






})

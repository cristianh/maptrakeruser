const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const cors = require('cors');


//socket 
const { Server } = require("socket.io");
const { setTimeout } = require('timers');
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const whitelist = ["https://amigaapp-f2f93-default-rtdb.firebaseio.com", "https://socket-maptracker.onrender.com ", "http://localhost:8001", "http://localhost:8000"];
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PATH"]
  }, origin: true, allowEIO3: true
});

app.use(cors());
// Servimos los archivos que se encuentran en el directorio public
app.use(express.static(path.join(__dirname, './public')));
/* app.use(express.static(path.join(__dirname, './public/app_traker'))); */

app.get('/', (req, res) => {
  // Servimos los archivos que se encuentran en el directorio public
  res.sendFile(__dirname + '/index.html');
});

app.get('/usuario_gps', (req, res) => {
  // Servimos los archivos que se encuentran en el directorio public
  //res.sendFile(__dirname + 'app_traker/index.html');
  res.sendFile(path.resolve(__dirname, './public/app_tracker', 'index.html'));
});

// ---------------- SOCKET.IO ----------------- //
//save user connection to server
const users = [];
//Return list user by room
let usersIds = [];
//RTUEN list user by room enabled
let availableRooms = []
let usersGPSdata = []
let estructuraDBGPSDATA = []

const eventsSocketio = {
  SERVER_JOIN_ROOM: 'server_join_room',
  SERVER_MESSAGE: 'chat send server message',
  SERVER_SEND_LIST_USERS: 'send_list_users',
  GET_LIST_ROOMS: 'send_list_rooms',
  SERVER_SEND_LIST_ROOMS: 'send_list_enable_rooms',
  GET_CHAT_MESSAGE: 'chat_send_message',
  SEND_CHAT_MENSSAGE: 'message_chat',
  GET_USER_GPS_DATA: 'geo_posicion',
  SEND_USER_GPS_DATA: 'chat_send_server_message',
  CHECK_LENGTH_USER_CONECT_ROOM_GPS: 'check_length_users_route_gps',
  MESSAGE_PRIVATE_USER: 'route_message_user',
  STOP_DATA_GPS_USER: 'stop_send_data_gps'
}


io.on('connection', (socket) => {
  console.log('a user connected');
  //MENSAJE DE BIENVENIDA.(privado)
  io.to(socket.id).emit(eventsSocketio.SERVER_MESSAGE, "Hola bienvenido al server");

  //DETECT USER DESCONECT
  socket.on('disconnect', (socket) => {
    console.log('user disconnected', socket);

  });


  socket.on('leaveroom', (room) => {
    socket.leave(room);
    console.log('leave room', room)
  });

  socket.on('disconnecting', (room) => {
    console.log(`Usuario ${socket.id} está abandonando la sala ${room}`)

    if (usersIds.length > 0) {
      usersIds = usersIds.filter((id) => {
        return id != socket.id
      })

    }
    //SEND NEW LIST USER connection
    socket.broadcast.emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: room, usersIds });
  });

  socket.on(eventsSocketio.SERVER_JOIN_ROOM, (dataRoom) => {

    console.log(dataRoom)
    console.log(socket.id)

    //SUSCRIBE TO ROOM USER FROM GPS PAGE.
    socket.join(dataRoom.room);

    //GUARDAMOS EL ARREGLO COMO VAN LLEGANDO LOS USUARIOS.
    /* estructuraDBGPSDATA[dataRoom.room].push() */

    if (estructuraDBGPSDATA[dataRoom.room] === undefined) {
      estructuraDBGPSDATA[dataRoom.room] = [{
        idUser: socket.id, type: dataRoom.type
      }];
    } else {
      estructuraDBGPSDATA[dataRoom.room].push({
        idUser: socket.id, type: dataRoom.type
      });
    }

    //BUSCAMOS EL ID PARA SABER
    
    if (estructuraDBGPSDATA[dataRoom.room].length > 1) {
      let findId = estructuraDBGPSDATA[dataRoom.room].findIndex((users) => {
        return users.type === 'user-data-gps'
      })
      console.log(findId)
      if(findId>-1){
        io.to(socket.id).emit(eventsSocketio.MESSAGE_PRIVATE_USER, { senddata: false, status: true, message: `La ${dataRoom.room.replace("_", " ")} ya esta monitoreada, sera conectado al servidor. en un momento sera enviada su posicion.` })
      }
    }


    

    console.log("estructura actual", estructuraDBGPSDATA)

    //SEND USER CONNECT TO ROOM.
    const usersInRoom = io.sockets.adapter.rooms.get(dataRoom.room);


    if (usersInRoom) {
      usersIds = Array.from(usersInRoom.keys());

    }

    // send to all clients in room return list id users conects for room
    io.in(dataRoom.room).emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: dataRoom.room, usersIds });



  })

  io.of("/").adapter.on("leave-room", (room, id) => {
    console.log(`socket ${id} has leave room ${room}`);
    socket.broadcast.emit("route_exit_user_data", { id, room })

    /* 
    
        //GET ROOM ENABLED
        const usersInRoom = io.sockets.adapter.rooms;
    
        if (usersInRoom) {
          roomsNames = Array.from(usersInRoom.keys());
        }
    
        // send to all clients in room return list id users conects for room
        io.emit(eventsSocketio.SERVER_SEND_LIST_ROOMS, { roomsNames}); */
  });

  /**
   * EVENT SEND MESSAGE USERS CHAT BY ROOMS
   */
  socket.on(eventsSocketio.GET_CHAT_MESSAGE, (data) => {
    // to all clients in room
    io.in(data.route).emit(eventsSocketio.SEND_CHAT_MENSSAGE, data.message);
  })


  //EVENTO PARA ENVIAR INFORMACION DE LAS RUTAS.
  socket.on(eventsSocketio.GET_USER_GPS_DATA, (data) => {
    //EVENTO PARA TODAS LAS PERSONAS CONECTADAS A LA SALA.
    //socket.broadcast.to(data.room).emit(eventsSocketio.SEND_USER_GPS_DATA, data)//solo a los de la sala

    //SI VAMOS A ENVIAR LA INFORMACION A TODOS
    io.emit(eventsSocketio.SEND_USER_GPS_DATA, data)
  });


  //SEND LIST DATA USER CONECT FOR ROOM.
  socket.on(eventsSocketio.USER_CONECT_ROOM_SERVER, (data) => {

    //SEND USER CONNECT TO ROOM.
    const usersInRoom = io.sockets.adapter.rooms.get(data.room);


    if (usersInRoom) {
      usersIds = Array.from(usersInRoom.keys());

    }

    // send to all clients in room return list id users conects for room
    io.in(data.room).emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: data.room, usersIds });

  })

  //SEND LIST DATA ROMOOS ENABLED
  socket.on(eventsSocketio.GET_LIST_ROOMS, (data) => {


    //GET ROOM ENABLED
    const usersInRoom = io.sockets.adapter.rooms;

    if (usersInRoom) {
      roomsNames = Array.from(usersInRoom.keys());
    }

    // send to all clients in room return list id users conects for room
    io.emit(eventsSocketio.SERVER_SEND_LIST_ROOMS, { roomsNames });
  })


  //EVENTO PARa validar  cantidad de usuarios transmitiendo
  socket.on(eventsSocketio.CHECK_LENGTH_USER_CONECT_ROOM_GPS, (roomData) => {

    //SI ES USUARIO TRNAMITIENDO LA DATA. ("user-data-gps")
    if (roomData.conect === "user-data-gps") {
      //BUSCAMOS SI EL ID DEL USUARIO CONECTADO ESTA GUARDADO EN LA ROOM ESPECIFICA.
      let validateroom = availableRooms.findIndex((room) => {
        return room.id === roomData.room
      });

      //SI NO ESTA
      if (validateroom == -1) {
        //GUARDAMOS EL tipo de usuario el id y la sala a la que se conecto
        availableRooms = [{ type: roomData.conect, id: roomData.room }, ...availableRooms]
      }

      //GUARDAMOS TODOS LOS IDS DE LOS USUARIO DENTRO DE LA ROOM
      const usersInRoom = io.sockets.adapter.rooms.get(roomData.room);

      //CONVERTIMOS EL OBJETO DEVUELTO A UN ARRAY.
      let usersIdroom = Array.from(usersInRoom)

      if (usersIdroom.length > 1) {
        //notificamos a los demas usuario que se intentan conectar que ya existe un usuario envio la informacion.
        // enviamos el mensaje a todos excepto quien esta de primero en la sala.
        io.to(usersIdroom.slice(1)).emit(eventsSocketio.MESSAGE_PRIVATE_USER, { senddata: false, status: true, message: `La ${roomData.room.replace("_", " ")} ya esta monitoreada, sera conectado al servidor. en un momento sera enviada su posicion.` })
        //DESCONECTAMOS AL USUARIO PARA LIBERAR RECURSOS
        //socket.disconnect()
      } else {
        io.to(socket.id).emit(eventsSocketio.MESSAGE_PRIVATE_USER, { senddata: true, status: false, message: `` })
      }
    } else {

      //SEND USER CONNECT TO ROOM.
      const usersInRoom = io.sockets.adapter.rooms.get(roomData.room);


      if (usersInRoom) {
        usersIds = Array.from(usersInRoom.keys());

      }

      // to all clients in room
      io.in(roomData.room).emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: roomData.room, usersIds });
    }

  })

  //STOP SEND DATA USER
  socket.on(eventsSocketio.STOP_DATA_GPS_USER, (roomData) => {

    // Check if the room exists
    const room = io.sockets.adapter.rooms.get(roomData.room);
    if (room) {
      // Delete the room object from the adapter
      io.sockets.adapter.rooms.delete(room);
    }

  })
});



// ------------------ END SOCKET.IO --------------------------------//

server.listen(process.env.PORT || 8000, () => {
  console.log('listening on http://localhost:8000');
});

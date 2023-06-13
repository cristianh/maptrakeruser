const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const cors = require('cors');
// DB MONGO CONEXION
const { dbConnection } = require('./database/config.db')
const { Message, Route } = require('./database/Models/message')
//Commit de prueba (borrar)
// Importamos las librerías necesarias
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ENCRIPT MESSAGE */
const CryptoJS  = require("crypto-js");


//CONECTAR DB MONGO
const db = async () => {
  await dbConnection()
}

db()
//FIN CONEXION DB




//socket 
const { Server } = require("socket.io");
const { setTimeout } = require('timers');
const io = new Server(server, {
  pingTimeout: 40000,
  cors: {
    origin: (origin, callback) => {
      const whitelist = ["https://amigaapp-f2f93-default-rtdb.firebaseio.com", "https://socket-maptracker.onrender.com ", "http://localhost:8001", "http://localhost:8000","https://rutamigapp.com"];
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

app.get('/allChat', async (req, res) => {
  const { ruta } = req.query

  let findRoute = `${ruta}`
  const findRouteMessages = await Message.find({ "route.name": findRoute });
  //const findRouteMessages = await Message.find({ "route.name": ruta});


  let messagesAll = []

  Object.values(findRouteMessages).map((msg) => {

    messagesAll.push(msg.message)

  })

  res.status(200).send({ messages: messagesAll })
});

// ---------------- SOCKET.IO ----------------- //
//save user connection to server
const users = [];
//Return list user by room
let usersIds = [];
//RTUEN list user by room enabled
let availableRooms = []
let usersGPSdata = []
let DBGPSDATA = []
let roomleave = null

//OBJECT EVENT READ ONLY
const eventsSocketio = Object.freeze({
  SERVER_JOIN_ROOM: 'server_join_room',
  SERVER_LEAVE_ROOM: 'server_leave_room',
  SERVER_MESSAGE: 'chat send server message',
  SERVER_SEND_LIST_USERS: 'send_list_users',
  GET_LIST_ROOMS: 'send_list_rooms',
  SERVER_SEND_LIST_ROOMS: 'send_list_enable_rooms',
  GET_CHAT_MESSAGE: 'chat_send_message',
  SEND_CHAT_MENSSAGE: 'message_chat',
  GET_USER_GPS_DATA: 'geo_posicion',
  SEND_USER_GPS_DATA: 'chat_send_server_message',
  MESSAGE_PRIVATE_USER: 'route_message_user',
  CHECK_LENGTH_USER_CONECT_ROOM_GPS: 'check_length_users_route_gps',
  STOP_DATA_GPS_USER: 'stop_send_data_gps'
})


io.on('connection', (socket) => {

  //MENSAJE DE BIENVENIDA.(privado)
  io.to(socket.id).emit(eventsSocketio.SERVER_MESSAGE, "Bienvenido al chat de Ruta Amigapp, recuerda seguir nuestras políticas de uso.");

  socket.on(eventsSocketio.SERVER_JOIN_ROOM, (dataRoom) => {

    /* try { */
    //SUSCRIBE TO ROOM USER FROM GPS PAGE.
    socket.join(dataRoom.room);



    //GUARDAMOS EL ARREGLO COMO VAN LLEGANDO LOS USUARIOS.

    if (DBGPSDATA[dataRoom.room] === undefined) {
      DBGPSDATA[dataRoom.room] = [{
        idUser: socket.id, type: dataRoom.type
      }];
    } else {
      DBGPSDATA[dataRoom.room].push({
        idUser: socket.id, type: dataRoom.type
      });
    }


    let find = DBGPSDATA[dataRoom.room].filter((users) => {
      return users.type === dataRoom.type
    })

    if (find.length > 1) {
      io.to(socket.id).emit(eventsSocketio.MESSAGE_PRIVATE_USER, { senddata: false, status: false, message: `La ${dataRoom.room.replace("_", " ")} ya esta monitoreada, sera conectado al servidor. en un momento sera enviada su posicion.` })
    }



    //SEN UPDATE  USER CONNECT TO ROOM.
    const usersInRoom = io.sockets.adapter.rooms.get(dataRoom.room);


    if (usersInRoom) {
      usersIds = Array.from(usersInRoom.keys());

    }

    // send to all clients in room return list id users conects for room
    io.in(dataRoom.room).emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: dataRoom.room, usersIds });


    socket.on(eventsSocketio.SERVER_LEAVE_ROOM, (room) => {

      //UNSUSCRIBE TO ROOM USER FROM GPS PAGE.
      socket.leave(room);


      if (usersIds.length > 0) {
        usersIds = usersIds.filter((id) => {
          return id != socket.id
        })
      }

      //SEND NEW LIST USER connection
      socket.broadcast.emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: room, usersIds });
    })

    //DETECT USER DESCONECT

    socket.on('disconnect', () => {
      try {
        Object.keys(DBGPSDATA).forEach((data, key) => {
          const filterids = DBGPSDATA[data].filter((item) => item.idUser !== socket.id)
          DBGPSDATA[data] = filterids
          roomleave = data
          return false
        })


        if (usersIds.length > 0) {
          usersIds = usersIds.filter((id) => {
            return id != socket.id
          })
        }

        if (roomleave !== null) {
          let findNextData = DBGPSDATA[dataRoom.room].filter((users) => {

            return users.type === 'user-data-gps'
          })


          io.to(findNextData[0].idUser).emit(eventsSocketio.MESSAGE_PRIVATE_USER, { senddata: true, status: true, message: `Ya puedes enviar tu posicion.` })

        }


      } catch (error) {

      }
    });

    /* } catch (error) {
      console.log(error)
    } */




  })

  //io.of("/").adapter.on("leave-room", (room, id) => {
  //console.log(`socket ${id} has leave room ${room}`);
  //if (usersIds.length > 0) {
  //usersIds = usersIds.filter((id) => {
  //return id != socket.id
  //})
  //}
  //SEND NEW LIST USER connection
  //socket.broadcast.emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: room, usersIds });
  //socket.broadcast.emit("route_exit_user_data", { id, room })

  //});

  /**
   * EVENT SEND MESSAGE USERS CHAT BY ROOMS
   */
  socket.on(eventsSocketio.GET_CHAT_MESSAGE, async (data) => {

    /* try {
      const openai = new OpenAIApi(configuration);


      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Classify the sentiment in this comment:\n\n${data.message}\n\nSentiment:`,
        temperature: 0,
        max_tokens: 1,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      });

      console.log(response.data.choices[0].text.trim().toLowerCase());

      // to all clients in room
      io.in(data.route).emit(eventsSocketio.SEND_CHAT_MENSSAGE, { status: response.data.choices[0].text.trim().toLowerCase(), message: data.message });
    } catch (error) {
      console.log(error.message)
    } */

    try {




      // Buscar el usuario por su ID
      const findRoute = await Route.findOne({ 'name': data.route });



      const findRouteMessages = await Message.find({ "route.name": data.route });


      if (findRoute !== null) {        
        const message = new Message({
          message: CryptoJS.AES.encrypt(data.message, process.env.KEY_ENCRIPT_MESSAGE),
          idUserSocket: socket.id,
          route: [findRoute]
        })

        await message.save(findRoute)



      } else {
        console.log(CryptoJS.HmacSHA1(data.message, process.env.KEY_ENCRIPT_MESSAGE));

        const route = new Route({
          name: data.route,
        });

        await route.save();

        const message = new Message({
          message:CryptoJS.HmacSHA1(data.message, process.env.KEY_ENCRIPT_MESSAGE),
          idUserSocket: socket.id,
          route: [route]
        })

        await message.save(findRoute)
      }
      // to all clients in room (default 'positive')
      io.in(data.route).emit(eventsSocketio.SEND_CHAT_MENSSAGE, { status: "positive", message: data.message });

      //socket.emit(eventsSocketio.SEND_CHAT_MENSSAGE, { status: "positive", message: data.message });

    } catch (error) {
      console.log(error)
    }


  })


  //EVENTO PARA ENVIAR INFORMACION DE LAS RUTAS.
  socket.on(eventsSocketio.GET_USER_GPS_DATA, (data) => {
    try {


      //EVENTO PARA TODAS LAS PERSONAS CONECTADAS A LA SALA.
      //socket.broadcast.to(data.room).emit(eventsSocketio.SEND_USER_GPS_DATA, data)//solo a los de la sala

      //SI VAMOS A ENVIAR LA INFORMACION A TODOS
      io.emit(eventsSocketio.SEND_USER_GPS_DATA, data)
    } catch (error) {
      console.log(error)
    }

  });


  //SEND LIST DATA USER CONECT FOR ROOM.
  socket.on(eventsSocketio.USER_CONECT_ROOM_SERVER, (data) => {

    try {
      //SEND USER CONNECT TO ROOM.
      const usersInRoom = io.sockets.adapter.rooms.get(data.room);


      if (usersInRoom) {
        usersIds = Array.from(usersInRoom.keys());

      }

      // send to all clients in room return list id users conects for room
      io.in(data.room).emit(eventsSocketio.SERVER_SEND_LIST_USERS, { room: data.room, usersIds });

    } catch (error) {
      console.log(error.message)
    }


  })

  //SEND LIST DATA ROMOOS ENABLED
  socket.on(eventsSocketio.GET_LIST_ROOMS, () => {
    try {
      //GET ROOM ENABLED
      const usersInRoom = io.sockets.adapter.rooms;

      if (usersInRoom) {
        roomsNames = Array.from(usersInRoom.keys());
      }

      // send to all clients in room return list id users conects for room
      io.emit(eventsSocketio.SERVER_SEND_LIST_ROOMS, { roomsNames });
    } catch (error) {
      console.log(error.message)
    }

  })


  //EVENTO PARa validar  cantidad de usuarios transmitiendo
  /* socket.on(eventsSocketio.CHECK_LENGTH_USER_CONECT_ROOM_GPS, (dataRoom) => {
    console.log(DBGPSDATA[dataRoom.room])
    try {

    } catch (error) {
      console.log(error.message)
    }


  }) */


  //STOP SEND DATA USER
  socket.on(eventsSocketio.STOP_DATA_GPS_USER, (roomData) => {
    try {

    } catch (error) {
      console.log(error.message)
    }

  })
});




// ------------------ END SOCKET.IO --------------------------------//

module.exports = server

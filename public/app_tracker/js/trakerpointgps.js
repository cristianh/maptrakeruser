
let watchIDElement;
let nombreRutaDB = "Ruta taxi";
let nombreRutaDBRoom = "";
let opcionesRuta = []
let watchID;
let simlutePintCoordenate = 0
let puntosSimulacion;
//variable para validar si el usuario actual puede enviar datos.
let usersenddata = false
let hasSendDataUser = false

document.addEventListener('DOMContentLoaded', main, false);

let temporizadorSimulador = null

function main() {

    //NOS CONECTAMOS A LA FIREBASE PARA SIMULAR UNA RUTA
    let datosfirebase;




    //HACEMOS LA PETICION A FIREBASE DE LAS RUTAS GUARDADAS CON ANTERIORIDAD.
    fetch(`https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas/Ruta%20taxi.json`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })

        .then(response => response.json())
        .then(json => {

            console.log(json)
            puntosSimulacion = Object.values(json)
            console.log(puntosSimulacion)

        })
        .catch(err => console.log(err))
        .finally(() => {
            console.log('finish')


        })

    // Cordova is now initialized. Have fun!

    //TEST URL LOCAL
    //PARA EL DESPLIEGUE QUITAR 'localhost' 
    let socket = io("http://localhost:8000", {
        withCredentials: true
    })
    //TEST URL PRODUCCION
    /* let socket = io("https://socket-maptracker.onrender.com", {
        withCredentials: true
    }) */


    //PASAMOS EL OBJECT SOCKET AL OBJETO WINDOW PARA UTILIZARLO GLOBALMENTE.
    window.socket = socket

    //EVENT PARA ESPERAR RESPUESTA SI 2 USUARIO SE CONECTARON A LA MISMA RUTA
    window.socket.on("route_message_user", (data) => {
        console.log(".............................................", data)

        if (data.status) {
            document.getElementById('info').innerHTML = data.message
        }

        if (!data.status) {
            usersenddata = !data.status
        }

        if (data.senddata) {
            hasSendDataUser = data.senddata
        }
    })

    //EVENT PARA ESPERAR RESPUESTA SI 2 USUARIO SE CONECTARON A LA MISMA RUTA
    window.socket.on("route_message_user", (data) => {
        console.log(".............................................", data)
        document.getElementById('info').innerHTML = data.message
    })

 


    document.getElementById("stopPosition").addEventListener("click", stopWatch);
    document.getElementById("watchPosition").addEventListener("click", watchPosition);
    document.getElementById("simulacion_route").addEventListener("click", emulateRoute);



    fetch('https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas.json')
        .then(response => response.json())
        .then(json => {


            Object.keys(json).forEach(element => {
                opcionesRuta.push(element)

            });

        })
        .catch(err => console.log(err))
        .finally(() => {
            let selectRutas = document.getElementById('selectRutas');
            console.log(opcionesRuta)
            opcionesRuta.forEach(opcion => {
                console.log("opcion", opcion)
                let Op = document.createElement('option')
                Op.value = opcion
                Op.text = opcion
                selectRutas.add(Op)
            });

        })

    document.getElementById('selectRutas').addEventListener('change', (event) => {

        sendDataGpsSimulate().then((data) => {
            if (data) {
                temporizadorSimulador = setInterval(() => {
                    window.socket.emit('geo_posicion', { room: nombreRutaDBRoom, data: puntosSimulacion[simlutePintCoordenate] });

                    console.log("enviando datos....", puntosSimulacion[simlutePintCoordenate])

                    simlutePintCoordenate += 1
                }, 2000);
            }
        }).catch((error) => {
            //document.getElementById('info').innerHTML = error
        })

    });


}



/**
 * The function sends simulated GPS data to a server at a regular interval.
 */
function sendDataGpsSimulate() {

    return new Promise((resolve, reject) => {
        if (usersenddata) {
            resolve(usersenddata)
        } else {

            reject("Emulador Esperando turno para enviar GPS data.....");
        }
    });
}

/**
 * The function sends GPS data to a server using a socket connection and displays the data on a
 * webpage.
 * @param positionData - an object containing the current position data, including latitude, longitude,
 * altitude, accuracy, altitude accuracy, heading, speed, and timestamp.
 */
function sendDataGpsUseConect() {

    return new Promise((resolve, reject) => {

        if (usersenddata) {
            resolve(usersenddata)
        } else {

            reject("Usuario Esperando turno para enviar GPS data.....");
        }
    });
}

function emulateRoute() {
    document.getElementById('select_route_simulacion').style.visibility = 'visible'
}


function onSelectRuta(e) {
    console.log(e.target.value);
    nombreRutaDBRoom = e.target.value.replace(" ", "_")
    
    /* window.socket.emit('check_length_users_route_gps', { conect: 'user-data-gps', room: nombreRutaDBRoom }); */
    //socket.emit('server_join_room', { room: rutaSeleccionada, type: 'user-map-view' })
    window.socket.emit('server_join_room', { room: nombreRutaDBRoom, type: 'user-data-gps' })
    
}


function stopWatch() {
    navigator.geolocation.clearWatch(watchIDElement);
    clearInterval(temporizadorSimulador);

    document.getElementById('info').innerHTML = ""
    document.getElementById("simulacion_route").classList.remove('disable')
    document.getElementById("simulacion_route").addEventListener("click", emulateRoute);
    window.socket.emit('stop_send_data_gps', { room: nombreRutaDBRoom });
}



function watchPosition() {
    document.getElementById('select_route_simulacion').style.visibility = 'hidden'

    document.getElementById("simulacion_route").classList.add('disable')
    document.getElementById("simulacion_route").removeEventListener("click", emulateRoute);
    if (nombreRutaDBRoom === "") {
        alert("Seleccione la ruta por favor.")
    }
    else {
        var options = {
            maximumAge: 3600000,
            timeout: 1000,
            enableHighAccuracy: true,
        }
        watchIDElement = navigator.geolocation.watchPosition(onSuccess, onError, options);

        function onSuccess(position) {
            sendDataGpsUseConect().then((data) => {
                console.log("----------------------------", data)
                if (data) {
                    let _datos = {
                        'Fecha': new Date().toLocaleString().replace(",", "-").replace(" ", ""),
                        'Latitude': position.coords.latitude,
                        'Longitude': position.coords.longitude,
                        'Heading': position.coords.heading,
                        'Speed': position.coords.speed
                    }

                    document.getElementById('info').innerHTML = JSON.stringify(_datos)

                    window.socket.emit('geo_posicion', { hasSendDataUser, room: nombreRutaDBRoom, data: _datos });
                    console.log("enviando datos....")
                }

            }).catch((error) => {
                //document.getElementById('info').innerHTML = error
            });
        }

        function onError(error) {
            alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
    }
}

function networkInfo() {
    var networkState = navigator.connection.type;
    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';
    alert('Connection type: ' + states[networkState]);
}

function onOffline() {
    alert('You are now offline!');
}

function onOnline() {
    alert('You are now online!');
}

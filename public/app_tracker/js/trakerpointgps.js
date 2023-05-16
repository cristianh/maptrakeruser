
let watchIDElement;
let nombreRutaDB = "Ruta taxi";
let nombreRutaDBRoom = "";
let opcionesRuta = []
let watchID;
let simlutePintCoordenate = 0
let puntosSimulacion;
//variable para validar si el usuario actual puede enviar datos.
let hasSendDataUser = true
let hasEmulateSendData = false

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

        if (data.senddata) {
            hasSendDataUser = data.senddata
        }

        console.log("hasSendDataUser", hasSendDataUser)





    })

    //EVENT PARA ESPERAR RESPUESTA SI 2 USUARIO SE CONECTARON A LA MISMA RUTA
    window.socket.on("route_message_user", (data) => {
        hasSendDataUser = data.senddata
        console.log(".............................................", data)
        document.getElementById('info').innerHTML = data.message
    })
    window.socket.on("route_exit_user_data", (data) => {
        console.log(data)
        hasSendDataUser = true
    })




    document.getElementById("stopPosition").addEventListener("click", stopWatch, false);
    document.getElementById("watchPosition").addEventListener("click", watchPosition, false);
    document.getElementById("simulacion_route").addEventListener("click", emulateRoute, false);



    fetch('https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas.json')
        .then(response => response.json())
        .then(json => {


            Object.keys(json).forEach(element => {
                opcionesRuta.push(element)

            });

        })
        .catch(err => console.log(err))
        .finally(() => {
            let selectRutas = document.getElementById('selectRutas_emulate');
            console.log(opcionesRuta)
            opcionesRuta.forEach(opcion => {
                console.log("opcion", opcion)
                let Op = document.createElement('option')
                Op.value = opcion
                Op.text = opcion
                selectRutas.add(Op)
            });

        })

    document.getElementById('selectRutas_emulate').addEventListener('change', (event) => {
        console.log(event.target.value);
        hasEmulateSendData = true
    });


}

/**
 * The function sends GPS data to a server using a socket connection and displays the data on a
 * webpage.
 * @param positionData - an object containing the current position data, including latitude, longitude,
 * altitude, accuracy, altitude accuracy, heading, speed, and timestamp.
 */
function sendDataGpsUseConect() {

    return new Promise((resolve) => {

        if (hasSendDataUser) {
            resolve(hasSendDataUser)
        }
    });
}

/**
 * The function makes a select element visible on the webpage.
 */
function emulateRoute() {
    document.getElementById('select_route_simulacion').style.visibility = 'visible'
}


/**
 * The function logs the selected value from a dropdown menu and replaces any spaces with underscores
 * in a variable.
 * @param e - The parameter "e" is an event object that is passed as an argument to the function
 * "onSelectRuta". It contains information about the event that triggered the function, such as the
 * target element that was selected and its value.
 */
function onSelectRuta(e) {
    console.log(e.target.value);
    nombreRutaDBRoom = e.target.value.replace(" ", "_")
}


/**
 * This function stops a GPS tracking simulation and clears related variables and events.
 */
function stopWatch() {
    navigator.geolocation.clearWatch(watchIDElement);
    clearInterval(temporizadorSimulador);
    hasSendDataUser = false
    hasEmulateSendData = false
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
        //NOS CONECTAMOS AL LA SALA (ROOM)
        window.socket.emit('server_join_room', { room: nombreRutaDBRoom, type: 'user-data-gps' })
        socket.emit('check_length_users_route_gps', { conect: 'user-data-gps', room: nombreRutaDBRoom });
        console.log("----------------------------", hasSendDataUser)
        var options = {
            maximumAge: 3600000,
            timeout: 1000,
            enableHighAccuracy: true,
        }
        watchIDElement = navigator.geolocation.watchPosition(onSuccess, onError, options);

        function onSuccess(position) {
            console.log("----------------------------", hasSendDataUser)
            console.log("----------------------------Envia", hasSendDataUser)
            /* sendDataGpsUseConect().then((data) => { */

            /* if (data) { */
            if (hasEmulateSendData) {

                temporizadorSimulador = setInterval(() => {
                    window.socket.emit('geo_posicion', { room: nombreRutaDBRoom, data: puntosSimulacion[simlutePintCoordenate] });

                    console.log("enviando datos emulados....", puntosSimulacion[simlutePintCoordenate])

                    simlutePintCoordenate += 1
                }, 2000);


                document.getElementById('info').innerHTML = "Simulando recorrido ruta.................."

            } else {
                let _datos = {
                    'Fecha': new Date().toLocaleString().replace(",", "-").replace(" ", ""),
                    'Latitude': position.coords.latitude,
                    'Longitude': position.coords.longitude,
                    'Heading': position.coords.heading,
                    'Speed': position.coords.speed
                }

                document.getElementById('info').innerHTML = JSON.stringify(_datos)

                window.socket.emit('geo_posicion', { hasSendDataUser, room: nombreRutaDBRoom, data: _datos });
                console.log("enviando datos usuario....")
            }

            //}

            /* }).catch((error) => {
                document.getElementById('info').innerHTML = error
            }); */
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

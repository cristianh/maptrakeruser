
let watchIDElement;
let nombreRutaDB = "Ruta taxi";
let routeEmulate = 'Ruta%20taxi';
let nombreRutaDBRoom = "";
let opcionesRuta = []
let watchID;
let simlutePintCoordenate = 0
let puntosSimulacion;
//variable para validar si el usuario actual puede enviar datos.
let hasSendDataUser = true
let hasEmulateSendData = false

let temporizadorSimulador = null


//URL BASE FIREBASE
const firebaseUrlBase = 'https://amigaapp-f2f93-default-rtdb.firebaseio.com'

//TEST URL LOCAL
// cambiar por 'http://localhost:8000'
const baseUrlProduction = 'https://socket-maptracker.onrender.com'

// API endpoints
const RoutesDbSimulateEndpoint = `${firebaseUrlBase}/dbrutas/${routeEmulate}.json`;
const RouteDBEndpoint = `${firebaseUrlBase}/dbrutas.json`;

document.addEventListener('DOMContentLoaded', main, false);


function main() {

    //listener
    document.getElementById("stopPosition").addEventListener("click", stopWatch, false);
    document.getElementById("watchPosition").addEventListener("click", watchPosition, false);
    document.getElementById("simulacion_route").addEventListener("click", emulateRoute, false);


    //LOAD DATE FOOTER
    loadYearFooter()


    //TEST URL PRODUCCION - MODIFICACION
    let socket = io(baseUrlProduction, {
        withCredentials: true,
        pingTimeout: 30000
    })


    //******************** START SOCKET EVENTS ******************************

    // WE PASS THE OBJECT SOCKET TO THE WINDOW OBJECT TO USE IT GLOBALLY.
    window.socket = socket


    // EVENT TO WAIT RESPONSE IF 2 USER CONNECTED TO THE SAME ROUTE
    window.socket.on("route_message_user", (data) => {
        console.log(".............................................", data)

        if (data.status) {
            document.getElementById('info').innerHTML = data.message
        }

        if (data.senddata) {
            hasSendDataUser = data.senddata
        }

    })


    window.socket.on("route_exit_user_data", (data) => {
        console.log(data)
        /* hasSendDataUser = true */
    })

    //*********************** END SOCKETS EVENT *******************

    // Make multiple API requests concurrently using Promise.all
    Promise.all([
        axios.get(RoutesDbSimulateEndpoint),
        axios.get(RouteDBEndpoint)
    ])
        .then(responses => {
            const [pointesResponse, routesResponse] = responses;

            // Process point markets response
            const pointsData = pointesResponse.data;
            /*  console.log('Points data:', pointsData); */

            // We make the request to Firebase of the routes stored above.
            puntosSimulacion = Object.values(pointsData)
            puntosSimulacion.reverse()

            // Process routes response
            const routesData = routesResponse.data;
            /*  console.log('Routes data:', routesData); */

            //GET DATA RESPONSE
            Object.keys(routesData).forEach(element => {
                opcionesRuta.push(element)
            });

            //WE LOAD ALL THE ROUTES STORED IN FIREBASE IN THE SELECT.
            let selectRutas = document.getElementById('selectRutas_emulate');
            opcionesRuta.forEach(opcion => {

                let Op = document.createElement('option')
                Op.value = opcion
                Op.text = opcion
                selectRutas.add(Op)
            });

        })
        .catch(error => {
            console.error('Error:', error);
        });

    document.getElementById('selectRutas_emulate').addEventListener('change', (event) => {
        hasEmulateSendData = true
    });


}

/**
 * The function sets the current year in the footer of a webpage.
 */
function loadYearFooter() {
    var year = new Date().getFullYear();

    document.getElementById("year_date").innerHTML = `Rutamigapp. ${year}  @copyrigth todos los derechos reservados.`;
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
    document.getElementById('select_route_simulacion').style.display = 'inline-grid'
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

    clearInterval(temporizadorSimulador);
    hasSendDataUser = false
    hasEmulateSendData = false
    document.getElementById('info').innerHTML = ""
    document.getElementById("simulacion_route").classList.remove('disable')
    document.getElementById("simulacion_route").addEventListener("click", emulateRoute);
    window.socket.emit('stop_send_data_gps', { room: nombreRutaDBRoom });
}



/**
 * The function watches the user's geolocation and sends the data to a server for a selected route,
 * with an option to simulate the route.
 */
function watchPosition() {
    document.getElementById('select_route_simulacion').style.display = 'none'


    if (nombreRutaDBRoom === "") {
        alert("Seleccione la ruta por favor.")
    }
    else {
        document.getElementById("simulacion_route").classList.add('disable')
        document.getElementById("simulacion_route").removeEventListener("click", emulateRoute);
        // We connect to the room (room)
        window.socket.emit('server_join_room', { room: nombreRutaDBRoom, type: 'user-data-gps' })
        /* socket.emit('check_length_users_route_gps', { conect: 'user-data-gps', room: nombreRutaDBRoom }); */

        var options = {
            maximumAge: 3600000,
            timeout: 1000,
            enableHighAccuracy: true,
        }
        watchIDElement = navigator.geolocation.watchPosition(onSuccess, onError, options);

        /**
         * The function sends GPS data to a server and either simulates or sends real-time location
         * data depending on a boolean value.
         * @param position - The parameter "position" is an object that contains the current GPS
         * position of the user, including latitude, longitude, heading, and speed. It is passed as an
         * argument to the function "onSuccess" which is called when the GPS position is successfully
         * retrieved.
         */
        function onSuccess(position) {

            sendDataGpsUseConect().then((data) => {

                if (data) {
                    if (hasEmulateSendData) {

                        temporizadorSimulador = setInterval(() => {

                            window.socket.emit('geo_posicion', { room: nombreRutaDBRoom, data: puntosSimulacion[simlutePintCoordenate] });

                            console.log("enviando datos emulados....", puntosSimulacion[simlutePintCoordenate])

                            simlutePintCoordenate += 1
                        }, 3000);

                        document.getElementById('info').innerHTML = `<div>Simulando recorrido ruta...</div>`

                    } else {
                        let _datos = {
                            'Fecha': new Date().toLocaleString().replace(",", "-").replace(" ", ""),
                            'Latitude': position.coords.latitude,
                            'Longitude': position.coords.longitude,
                            'Heading': position.coords.heading,
                            'Speed': position.coords.speed
                        }

                        //document.getElementById('info').innerHTML = JSON.stringify(_datos)
                        document.getElementById('info').innerHTML = `<div>Enviado información ruta...</div>`

                        window.socket.emit('geo_posicion', { hasSendDataUser, room: nombreRutaDBRoom, data: _datos });
                        console.log("enviando datos usuario....")
                    }
                }

            }).catch((error) => {
                document.getElementById('info').innerHTML = error
            });
        }

        /**
         * The function alerts an error message with the error code and message.
         * @param error - The error object that contains information about the error that occurred. It
         * typically includes a code and a message property.
         */
        function onError(error) {
            alert('code: ' + error.code + '\n' + 'message: ' + error.message + '\n');
        }
    }
}
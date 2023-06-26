window.addEventListener('DOMContentLoaded', () => {



    loadYearFooter()


    //SOCKET CODE

    let userChat = []
    let routeSelected = ""
    let socket = io();
    let notificado = false
    let backPointMarkers = []
    let positionHerUser = []
    let opcionesRuta = []
    let puntosSimulacion = []


    //Add markets
    let geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    //DATA STOP BUS
    //Para ubicar los paraderos
    let geojsonBusStop = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.668881, 4.541374]

                },
                "properties": {
                    "title": "Ruta 32",
                    "description": "Norte/Sur",
                    "velocidad": 0
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.666513, 4.539046]
                },
                "properties": {
                    "title": "Ruta 21",
                    "description": "Norte/Sur",
                    "velocidad": 0
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.671884, 4.538494]
                },
                "properties": {
                    "title": "Ruta 5",
                    "description": "Norte/Sur",
                    "velocidad": "0"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.684583, 4.522099]
                },
                "properties": {
                    "title": "Ruta 5",
                    "description": "Norte/Sur",
                    "velocidad": "0"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.668856, 4.537622]
                },
                "properties": {
                    "title": "Ruta 5",
                    "description": "Norte/Sur",
                    "velocidad": "0"
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.683675, 4.527566]
                },
                "properties": {
                    "title": "Ruta 5",
                    "description": "Norte/Sur",
                    "velocidad": "0"
                }
            }

        ]
    }



    let map;
    let from;
    let to;

    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };


    //URL BASE FIREBASE
    const firebaseUrlBase = 'https://amigaapp-f2f93-default-rtdb.firebaseio.com'

    // API endpoints
    const RoutesDbSimulateEndpoint = `${firebaseUrlBase}/dbrutas.json`;
    const RouteDBEndpoint = `${firebaseUrlBase}/rutas.json`;


    const mapElement = document.getElementById('map');

    mapElement.setAttribute('tabindex', '-1');



    /* The above code is defining a function called `onSelectRuta` that is triggered when a user
    selects a route from a dropdown menu. The function saves the selected route in a variable called
    `routeSelected`, replaces any spaces in the route name with underscores, and then emits two
    socket events to the server. The first event tells the server that the user is leaving the
    current room (if they were in one), and the second event tells the server to join a new room
    with the selected route name and a type of 'user-map-view'. */
    onSelectRuta = (e) => {

        //SAVE ROUTE SELECTED
        routeSelected = e.target.value.replace(" ", "_")
        loadMessageChat(routeSelected)
        socket.emit('server_leave_room', routeSelected);
        socket.emit('server_join_room', { room: routeSelected, type: 'user-map-view' })
    }



    /* The above code is defining a function called `onSendMessage` that is triggered when a form is
    submitted. It first prevents the default form submission behavior. Then, it gets the value of
    the input field with the ID `message_input`. If the input field is not empty, it emits a socket
    event called `chat_send_message` with an object containing the message and a route. Finally, it
    clears the input field. */
    onSendMessage = (e) => {
        e.preventDefault()
        if (routeSelected == "") {
            //Mostramos la notificación.
            new Notify({
                title: '!Atencion!',
                text: 'Por favor selecciona una ruta.',
                autoclose: true,
                autotimeout: 4000,
                status: 'warning',
                position: 'left bottom',
                gap: 40,
                distance: 20,
                type: 1
            })
        } else {
            let messageUser = document.querySelector('#message_input')
            //IF MESSAGE NOT IS EMPY, SEND DATA
            if (messageUser.value != "") {
                socket.emit('chat_send_message', { message: messageUser.value, route: routeSelected })
                messageUser.value = ""
            }
        }


    }


    // created event to list the users in the chat.
    socket.on('send_list_users', (users) => {
        userChat = users
        loadUserChat()
    })


    // We detect message sent from the server.
    socket.on('message_chat', (data) => {
        if (data.status == 'positive' || data.status == 'neutral') {
            createDivChatElement(data.message, "message")
        } else {
            let info = 'El mensaje no puede ser visualizado,ya que no cumple con la politicas de lenguaje apropiado'
            createDivChatElement(info, "message_dangerus")

        }

    })




    /* The above code defines a function `loadUserChat` that loads the available chat users and
    displays them on the screen. It first selects the HTML element with class `chat_users` and
    clears its content. Then, for each user ID in the `userChat` object, it creates a new `div`
    element with the user's name and appends it to the `chat_users` element. It also adds a class
    `userActive` to the last user in the list to indicate that they are currently active. */
    loadUserChat = () => {

        //LOAD SALAS RUTAS DISPONIBLES.
        const mensaje = document.querySelector('.chat_users')
        //CLEAN CONTENT USERS
        mensaje.innerHTML = ""

        userChat.usersIds.forEach(user => {

            let divuser = document.createElement("div")
            const newtext = document.createTextNode("user" + user.toString().substring(0, 4));
            divuser.appendChild(newtext);
            let element = document.createElement("div")
            element.classList.add("message")
            element.appendChild(divuser)
            element.id = "user" + user.toString().substring(0, 4)
            mensaje.appendChild(element)
           
        });
        localStorage.setItem('idchat',JSON.stringify("user" + socket.id.toString().substring(0, 4)))
        repaintChatUsers()

    }

    repaintChatUsers = () => {
        const userActiveChat = document.querySelectorAll('.chat_users > div')



        if (userActiveChat.length >= 1) {
            console.log(userActiveChat)
            console.log(userActiveChat[userActiveChat.length - 1].id)

           
        }

        document.querySelector(`#${JSON.parse(localStorage.getItem('idchat'))}`).classList.add("userActive")
        
    }

    // event to send the welcome message Dal Server.
    socket.once('chat send server message', (message) => {

        const mensaje = document.querySelector('#welcome_message')

        let text = document.createElement("div")
        const newtext = document.createTextNode(message);
        text.appendChild(newtext)
        let element = document.createElement("div")
        element.classList.add("message")
        element.appendChild(text)
        mensaje.appendChild(text)
    })

    //EVENT DETEC USER LEAVE ROOM TRANSMITION DATA GPS
    socket.on("route_exit_user_data", (data) => {

    })

    //END SOCKET CODE

    //VALIDATE IF GELOCATION IS ENABLED
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {

            loadMap(parseFloat(pos.coords.latitude), parseFloat(pos.coords.longitude))
            socket.emit('chat message', { 'lat': pos.coords.latitude, 'log': pos.coords.longitude });
            // HABILITAMOS EL MENSAJE GPS ACTIVO
            if (!localStorage.getItem('modal_info')) {
                document.querySelector('#modal_gps_activo').style.display = "block"
                //MOSTRAMOS EL CONTENEDOR DEL MODAL.
                document.querySelector('.container-modal').style.display = "flex"
                localStorage.setItem('modal_info', true)
            }


        }, (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.log("User denied the request for Geolocation.")
                    // HABILITAMOS EL MENSAJE GPS INACTIVO
                    document.querySelector('#modal_gps_inactivo').style.display = "block"
                    document.querySelector('.container-modal').style.display = "flex"
                    localStorage.removeItem('modal_info')
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.log("Location information is unavailable.")
                    break;
                case error.TIMEOUT:
                    console.log("The request to get user location timed out.")
                    break;
            }
        }, options);
    } else {
        console.log("Your browser doesn't support geolocation.")
    }

    // Usando watchPosition()
    let watchID = navigator.geolocation.watchPosition((pos) => {



    });

    navigator.geolocation.clearWatch(watchID);

    /**
     * The function loads a map using Mapbox and listens for incoming data from a server to update the
     * map with markers and calculate distances between points.
     * @param lat - The latitude of the starting position of the map.
     * @param lng - The longitude coordinate of the map's starting position.
     */
    const loadMap = (lat, lng) => {

        positionHerUser = [lng, lat]
        mapboxgl.accessToken = 'pk.eyJ1IjoiY3J1c3RvMjAyMiIsImEiOiJjbDg3c3lmaTExNmg4M3BubGhyMThvMmhsIn0.AhcG868gRKbP-zDiccuMdA';
        map = new mapboxgl.Map({
            container: 'map', // container ID
            style: 'mapbox://styles/mapbox/streets-v11', // style URL
            center: [lng, lat], // starting position [lng, lat]
            //center: [-121.403732, 40.492392],
            zoom: 14, // starting zoom
            projection: 'globe' // display the map as a 3D globe
        });
        map.on('style.load', () => {
            map.setFog({}); // Set the default atmosphere style
        });


        map.on('load', async () => {
            try {


                //hidden preload
                document.querySelector('.back-preloader').style.display = 'none'

                // customizamor at User's Point Marker
                const margkeruser = document.createElement('div');

                margkeruser.style.width = "50px"
                margkeruser.style.height = "50px"
                margkeruser.style.backgroundImage = "url('../../assets/user_profile.svg')"
                margkeruser.style.backgroundSize = "cover"
                margkeruser.style.borderRadius = "50%"
                margkeruser.style.cursor = "pointer"
                margkeruser.style.backgroundColor = "white"
                margkeruser.style.borderRadius = "100%"
                margkeruser.className = 'marker';



                // Current user position.
                let marker = new mapboxgl.Marker(margkeruser, {
                    draggable: true,
                })
                    .setLngLat([lng, lat])
                    .addTo(map);

                //Tomamos el primer punto de referencia (cordenadas actuales del usuario)
                from = turf.point([lng, lat]);

                const onDragEnd = () => {
                    const lngLat = marker.getLngLat();
                    const { lat, lng } = lngLat
                    console.log(lat, lng)
                    //UPDATE el  punto de referencia (cordenadas actuales del usuario)
                    from = turf.point([lng, lat]);
                }

                marker.on('dragend', onDragEnd);


                // Make multiple API requests concurrently using Promise.all
                Promise.all([
                    axios.get(RoutesDbSimulateEndpoint),
                    axios.get(RouteDBEndpoint)
                ])
                    .then(responses => {
                        const [pointesResponse, routesResponse] = responses;

                        // Process point markets response
                        const pointsData = pointesResponse.data;
                        console.log('Points data:', pointsData);

                        // We make the request to Firebase of the routes stored above.
                        puntosSimulacion = Object.keys(pointsData)


                        console.log(".................................", puntosSimulacion)

                        puntosSimulacion.forEach(async (rutaNombre) => {
                            console.log("...........................rutaNombre", rutaNombre);
                            await fetch(`https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas/${rutaNombre}.json`)
                                .then((resp) => resp.json())
                                .then((data) => {

                                    let dataPoints = Object.values(data)



                                    Array.of(dataPoints[0]).forEach((coordenadas) => {

                                        const { Latitude, Longitude, Speed } = coordenadas



                                        geojson.features[rutaNombre] =
                                        {
                                            type: 'Feature',
                                            geometry: {
                                                coordinates: {
                                                    lat: Latitude,
                                                    lon: Longitude
                                                }
                                            },
                                            properties: {
                                                title: 'Ruta 18',
                                                description: 'Norte/Sur',
                                                velocidad: Speed == undefined ? '0' : Math.round(Speed)
                                            }
                                        }

                                    });
                                })
                                .finally(() => {
                                    loadPointMap()
                                })

                        })

                        // Process routes response
                        const routesData = routesResponse.data;
                        /*  console.log('Routes data:', routesData); */

                        //GET DATA RESPONSE
                        Object.keys(routesData).forEach(element => {
                            opcionesRuta.push(element)
                        });



                        //WE LOAD ALL THE ROUTES STORED IN FIREBASE IN THE SELECT.
                        let selectRutasList = document.querySelector('#route');


                        opcionesRuta.forEach(opcion => {
                            let Op = document.createElement('option')
                            Op.classList.add('search_list');
                            Op.value = capitalizarTexto(opcion.replace('_', ' ').toLowerCase())
                            let optionText = document.createTextNode(capitalizarTexto(opcion.replace('_', ' ').toLowerCase()));
                            Op.appendChild(optionText);
                            selectRutasList.appendChild(Op)
                        });

                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });




            } catch (err) {
                // If the updateSource interval is defined, clear the interval to stop updating the source.
                // if (updateSource) clearInterval(updateSource);
                throw new Error("Error", err.message);

            }
        })

        map.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            // Fly the map to the location.
            map.flyTo({
                center: [lng, lat],
                speed: 0.5
            });
            //calculateTravelTime([lng, lat],positionHerUser)

        });

        // Add zoom and rotation controls to the map.
        map.addControl(new mapboxgl.NavigationControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left');

        ;

        // Add geolocate control to the map.
        map.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                // When active the map will receive updates to the device's location as it changes.
                trackUserLocation: true,
                // Draw an arrow next to the location dot to indicate which direction the device is heading.
                showUserHeading: true
            })
        );

        //LOAD PARADERO IN MAP.
        map.loadImage(
            'https://res.cloudinary.com/dl7oqoile/image/upload/v1684804920/bus-stop_l8qgtv.png',
            (error, image) => {
                if (error) throw error;



                // Add the image to the map style.
                map.addImage('bus-route', image);

                map.addSource('routemap', {
                    type: 'geojson',
                    // Use a URL for the value for the `data` property.
                    data: geojsonBusStop

                });

                // Add a symbol layer
                map.addLayer({
                    'id': 'routemap-layer',
                    'type': 'symbol',
                    'source': 'routemap',
                    layout: {
                        'icon-image': 'bus-route', // Nombre del icono personalizado externo
                        'icon-size': 0.07 // Ajusta el tamaño del icono según sea necesario
                    },
                    minzoom: 15, // Set the minimum zoom level for the icons to be visible
                    maxzoom: 20, // Set the maximum zoom level for the icons to be visible
                    paint: {
                        'text-halo-blur': 0 // Set the circle blur to 0 to remove the blur effect
                    }
                });

                map.setPaintProperty('routemap-layer', 'icon-max-size', 21);
            });





        /** 
         * We listen to the information sent from the server
         */
        socket.on('chat_send_server_message', (msg) => {



            try {
                /* console.log("recibiendo datos................", msg) */
                const { Latitude, Longitude, Speed } = msg.data

                to = turf.point([Longitude, Latitude]);
                let options = { units: 'kilometers' };
                let distance = turf.distance(from, to, options);
                //SI LA DISTANCIA CUMPLE LA CONDICION
                //TODO:OJO deshabilitamos la notificacion cambiar.
                console.log(routeSelected.replace('_', ' ').toLowerCase(), msg.room.replace('_', ' ').toLowerCase())
                if (Math.round(distance * 1000) > 100 && Math.round(distance * 1000) < 150) {
                    if (routeSelected.replace('_', ' ').toLowerCase() === msg.room.replace('_', ' ').toLowerCase()) {
                        notifiyUserProximityRoute(msg.room.replace('_', ' ').toLowerCase())
                    }
                } else {
                    notificado = false
                }

                let rutaName = msg.room.replace('_', ' ').toLowerCase()

                //SAVE DIFERENT POINT IN JSON MAP DATA.
                if (msg.room.replace('_', ' ').toLowerCase() !== "") {
                    geojson.features[rutaName] =
                    {
                        type: 'Feature',
                        geometry: {
                            coordinates: {
                                lat: Latitude,
                                lon: Longitude
                            }
                        },
                        properties: {
                            title: capitalizarTexto(rutaName),
                            description: 'Norte/Sur',
                            velocidad: Speed == undefined ? '0' : Math.round(Speed * 3.6),
                            distancia: Math.round(distance * 1000)
                        }
                    }
                }
                if (Longitude !== undefined && Latitude !== undefined) {
                    calculateTravelTime([Longitude, Latitude], positionHerUser)
                }
                loadPointMap()
            } catch (error) {
                console.log(error)
            }



        });



        /* The above code defines a function called `notifiyUserProximityRoute` that sends a
        notification to the user when a certain route is nearby. The function creates a new instance
        of a `NotificationsPushApp` class with a title and message, and then calls the
        `showNotification` method to display the notification. It also sends a POST request to a
        WonderPush API endpoint to deliver the notification to all users. */
        notifiyUserProximityRoute = (routename) => {
            //Notificamos que la ruta esta cerca.
            //NOTIFICATION TEST
            let notifications = new NotificationsPushApp('RUTA AMIGAPP', `La ruta ${routename} se encuentra cerca a tu ubicación.`)

            //SHOW NOTIFICATION
            notifications.showNotification()


            if (notificado == false) {
                let mensaje = `La ruta ${routename}, se encuentra cerca a su posición.`
                let dataMensaje = {
                    title: '!Atencion!',
                    text: mensaje,
                    autoclose: true,
                    autotimeout: 8000,
                    status: 'warning',
                    position: 'rigth bottom',
                    gap: 40,
                    distance: 20,
                    type: 1
                }


                new Notify(dataMensaje)
                notificado = true
            }




            //SHOW NOTIFICATION ONLY ROOM ROUTE
            //socket.emit('message_notify_route', { message: 'Probando Mensaje', room: msg.room.replace('_', ' ').toLowerCase() })

            var urlencoded = new URLSearchParams();
            urlencoded.append("targetSegmentIds", "@ALL");
            urlencoded.append("notification", `{\"alert\":{\"text\":\"La ruta ${routename} se encuentra cerca a tu posicion\"}}`);

            var requestOptions = {
                method: 'POST',
                body: urlencoded,
                redirect: 'follow'
            };

            fetch("https://management-api.wonderpush.com/v1/deliveries?accessToken=NDkyMjZjYmE2YTJhNzA5NDA4ZjhiZTIwMWQ3YWI2MTgwNTkwYTQ5NzE3NWU1N2UyNDNjNGZhNTQwZDE4ZDVmNw", requestOptions)
                .then(response => response.text())
                .then(result => console.log(result))
                .catch(error => console.log('error', error));

        }
    }





    /* The above code defines a function called `capitalizarTexto` that takes a string as an argument.
    The function capitalizes the first letter of the string and converts the rest of the string to
    lowercase. It then returns the modified string. */
    capitalizarTexto = (texto) => {
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    }

    /* The above code is defining a function called `loadPointMap` that adds markers to a Mapbox map
    based on data in a GeoJSON object. The function first checks if there are any existing markers
    on the map and removes them if there are. It then loops through the features in the GeoJSON
    object and creates a custom marker for each one. Each marker is given a popup with information
    about the feature, and the marker is added to the map and saved in an array for later use. The
    function also sets the `tabindex` attribute of each marker element to `-1` to prevent auto */
    loadPointMap = () => {

        //IF EXIST MARKTS.
        //DELETE ALL (MAP REPEINT DATA)

        if (backPointMarkers.length > 0) {
            backPointMarkers.forEach(marker => {
                marker.remove()
            });
        }

        //GET ALL KEYS (ROURTES)
        let keys = Object.keys(geojson.features)
        //AGEGANDO PUNTOS EN EL MAPA.
        keys.forEach((key, index) => {

            //PERSONALIZAMOS EL MARKER
            const el = document.createElement('div');

            el.style.width = "42px"
            el.style.height = "42px"
            el.style.backgroundImage = "url('../../assets/iconbus.svg')"
            el.style.backgroundSize = "cover"
            el.style.borderRadius = "50%"
            el.style.cursor = "pointer"
            el.id = `popmarketbus_${geojson.features[key].properties.title}`

            el.className = 'marker';

            //CREATE POPUP
            //<br><span>Velocidad: ${geojson.features[key].properties.velocidad}k/h </span><br><span>Distancia: ${geojson.features[key].properties.distancia == undefined ? 'N/A' : geojson.features[key].properties.distancia}m</span>

            let popupText = new mapboxgl.Popup({
                offset: 25, closeButton: false,
                closeOnClick: true
            })
                .setLngLat([geojson.features[key].geometry.coordinates.lon, geojson.features[key].geometry.coordinates.lat])
                .setHTML(`<div><h3>${geojson.features[key].properties.title}</h3><Dirección:<span>${geojson.features[key].properties.description}</span><br><span>Distancia: ${geojson.features[key].properties.distancia == undefined ? 'N/A' : geojson.features[key].properties.distancia}m</span></div>`)
                .addTo(map);

            // Evitar que el foco se capture automáticamente en el popup
            popupText.on('open', function () {
                setTimeout(function () {
                    popupText._content.focus();
                }, 0);
            })


            //ADD MERCKER TO MAP
            pointmarcketr = new mapboxgl.Marker(el)
                .setLngLat([geojson.features[key].geometry.coordinates.lon, geojson.features[key].geometry.coordinates.lat])
                .addTo(map)
                .setPopup(popupText);

            // Agregar el atributo tabindex="-1" al elemento del marker para evitar el auto focus
            pointmarcketr.getElement().setAttribute('tabindex', '-1');



            //ADD MARKERS GENERATES TO ARRAY (SAVE ALL MARKTES)
            backPointMarkers.push(pointmarcketr)

        })
    }
})

/**
 * The function calculates the estimated travel time between two locations using the Mapbox API.
 * @param origin - The starting point of the journey, represented as an array of two numbers: the
 * longitude and latitude coordinates of the location.
 * @param destination - The destination parameter is the coordinates of the location where the user
 * wants to travel to. It is an array containing two elements: the longitude and latitude of the
 * destination.
 */
function calculateTravelTime(origin, destination) {
    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${mapboxgl.accessToken}`)
        .then(response => response.json())
        .then(data => {
            const travelTime = data.routes[0].duration / 60; // Duración en minutos
            console.log(`Tiempo de viaje estimado: ${travelTime} minutos`);
        })
        .catch(error => {
            console.error('Error al calcular el tiempo de viaje:', error);
        });
}

/**
 * The function hides a GPS active message and sets a local storage item.
 */
function hiddenWindowGpsEnabled() {
    // HABILITAMOS EL MENSAJE GPS ACTIVO
    document.querySelector('#modal_gps_activo').style.display = "none"
    document.querySelector('.container-modal').style.display = "none"
    localStorage.setItem('modal_info', false)
}

/**
 * The function sets the current year in the footer of a webpage.
 */
function loadYearFooter() {
    var year = new Date().getFullYear();

    document.getElementById("year_date").innerHTML = `Rutamigapp. ${year}  ®copyrigth todos los derechos reservados.`;
}




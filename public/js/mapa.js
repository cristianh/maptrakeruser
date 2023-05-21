window.addEventListener('DOMContentLoaded', () => {


    loadYearFooter()

    //SOCKET CODE

    let userChat = []
    let rutaSeleccionada = ""
    let socket = io();
    let notificado = false
    let backPointMarkers = []
    let posicionActualUsuario = []


    //Añadimos markets
    let geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    let map;
    let from;
    let to;
    let marker;


    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };



    const mapElement = document.getElementById('map');

    mapElement.setAttribute('tabindex', '-1');


    //LISTO EN FRONT
    onSelectRuta = (e) => {

        //SAVE ROUTE SELECTED
        rutaSeleccionada = e.target.value.replace(" ", "_")
        socket.emit('server_leave_room', rutaSeleccionada);
        socket.emit('server_join_room', { room: rutaSeleccionada, type: 'user-map-view' })
    }

    //YA PASADO
    //SEND MESSAGE CHAT
    onSendMessage = (e) => {
        e.preventDefault()
        let messageUser = document.querySelector('#message_input')
        //IF MESSAGE NOT IS EMPY, SEND DATA
        if (messageUser != "") {
            socket.emit('chat_send_message', { message: messageUser.value, route: rutaSeleccionada })
            messageUser.value = ""
        }

    }

    //CREADO EVENTO ( FALTA LA IMPLEMENTACION DEL CHAT COMPONENT)
    socket.on('send_list_users', (users) => {
        userChat = users
        loadUserChat()
    })

    //CREADO EVENTO ( FALTA LA IMPLEMENTACION DEL CHAT COMPONENT)
    //DETECTAMOS MENSAJE
    socket.on('message_chat', (data) => {
        if (data.status == 'positive' || data.status == 'neutral') {
            createDivChatElement(data.message, "message")
        } else {
            let info = 'El mensaje no puede ser visualizado,ya que no cumple con la politicas de lenguaje apropiado'
            createDivChatElement(info, "message_dangerus")

        }

    })

    createDivChatElement = (message, classN) => {
        //LOAD MESSAGE DIV.
        let mensajeelement = document.querySelector('#messages')
        let mesajesContainer = document.querySelector('.container_messages')
        let divuser = document.createElement("div")

        const newtext = document.createTextNode(message);
        divuser.appendChild(newtext);
        let element = document.createElement("div")
        element.classList.add(classN)
        element.classList.add("animate__bounceIn")
        element.appendChild(divuser)
        mensajeelement.appendChild(element)

        //Scroll rolling down
        mesajesContainer.scrollTop = mesajesContainer.scrollHeight;
    }

    /**
     * Cargamos la lsita de todos los usuarios en el sistema.
     */
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
            mensaje.appendChild(element)
        });
        const userActiveChat = document.querySelectorAll('.chat_users > div')

        if (userActiveChat.length == 1) {
            userActiveChat[(userActiveChat.length) - 1].classList.add("userActive")
        } else {
            userActiveChat[(userActiveChat.length) - 2].classList.add("userActive")
        }


    }




    //Evento para los usuarios conectados.
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


    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {

            loadMap(parseFloat(pos.coords.latitude), parseFloat(pos.coords.longitude))
            socket.emit('chat message', { 'lat': pos.coords.latitude, 'log': pos.coords.longitude });
            // HABILITAMOS EL MENSAJE GPS ACTIVO
            if (!localStorage.getItem('modal_info')) {
                document.querySelector('#modal_gps_activo').style.display = "block"
                localStorage.setItem('modal_info', true)
            }


        }, (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.log("User denied the request for Geolocation.")
                    // HABILITAMOS EL MENSAJE GPS INACTIVO
                    document.querySelector('#modal_gps_inactivo').style.display = "block"
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

    const loadMap = (lat, lng) => {

        posicionActualUsuario = [lng,lat]
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

            let opcionesRuta = []

            //Personalizamor en point marker del usuario    
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


            //Posicion actual usuario.
            let marker = new mapboxgl.Marker(margkeruser)
                .setLngLat([lng, lat])
                .addTo(map);

            //Tomamos el primer punto de referencia (cordenadas actuales del usuario)
            from = turf.point([lng, lat]);


            let markets = []
            /* 
            
                        const allDbRoutesInfo = await fetch('https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas.json')
                        const allDbRoutes = await fetch('https://amigaapp-f2f93-default-rtdb.firebaseio.com/rutas.json')
            
                        const [ruta, dbrutas] = await Promise.all([allDbRoutes, allDbRoutesInfo])
                            .then((response) => {
                                console.log(response)
                                responses.forEach(response => {
                                    console.log(response.status, response);
                                })
                            })
                            .catch((error) => {
                                console.log(error.message)
                            })
            
                        console.log(ruta) */

            //LOAD ALL ROUTE IN SELECT ITEM
            await fetch('https://amigaapp-f2f93-default-rtdb.firebaseio.com/dbrutas.json')
                .then(response => response.json())
                .then(json => {


                    Object.keys(json).forEach(element => {
                        opcionesRuta.push(element)


                    });

                })
                .catch(err => console.log(err))
                .finally(() => {

                    console.log(opcionesRuta)


                })

            //LOAD DATA POINT IN DB (FIREBASE-EMULATE)
            try {
                opcionesRuta.forEach(async (rutaNombre) => {
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

            } catch (err) {
                // If the updateSource interval is defined, clear the interval to stop updating the source.
                // if (updateSource) clearInterval(updateSource);
                throw new Error("Error", err);

            }
        })

        map.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            // Fly the map to the location.
            map.flyTo({
                center: [lng, lat],
                speed: 0.5
            });
            //calculateTravelTime([lng, lat],posicionActualUsuario)
            console.log([lng, lat],posicionActualUsuario);
            console.log(`Clicked position: Longitude: ${lng}, Latitude: ${lat}`);
        });

        // Add zoom and rotation controls to the map.
        map.addControl(new mapboxgl.NavigationControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-left');

        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            language: 'es', // Specify the language as German.
            mapboxgl: mapboxgl
        });
        map.addControl(geocoder);

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



        /**
         * ESCUCHAMOS LA INFORMACION ENVIADA DESDE EL SERVIDOR
         */
        socket.on('chat_send_server_message', (msg) => {
            /* console.log("recibiendo datos................", msg) */
            const { Latitude, Longitude, Speed } = msg.data

            to = turf.point([Longitude, Latitude]);
            let options = { units: 'kilometers' };

            let distance = turf.distance(from, to, options);

            //SI LA DISTANCIA CUMPLE LA CONDICION
            //TODO:OJO deshabilitamos la notificacion cambiar.
            if (Math.round(distance * 1000) > 300 && Math.round(distance * 1000) < 350) {
                notifiyUserProximityRoute(room.replace('_', ' ').toLowerCase())
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
            if(Longitude!==undefined && Latitude!==undefined){
                calculateTravelTime([Longitude, Latitude],posicionActualUsuario)
            }
            loadPointMap()
        });



        notifiyUserProximityRoute = (routename) => {
            //Notificamos que la ruta esta cerca.


            //NOTIFICATION TEST
            let notifications = new NotificationsPushApp('RUTA AMIGAPP', `La ruta ${routename} se encuentra cerca a tu ubicación.`)

            //SHOW NOTIFICATION
            notifications.showNotification()

            notificado = true
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





    capitalizarTexto = (texto) => {
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    }

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
                .setHTML(`<div><h3>${geojson.features[key].properties.title}</h3><Dirección:<span>${geojson.features[key].properties.description}</span><br><span>Velocidad: ${geojson.features[key].properties.velocidad}k/h </span><br><span>Distancia: ${geojson.features[key].properties.distancia == undefined ? 'N/A' : geojson.features[key].properties.distancia}m</span></div>`)
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

function hiddenWindowGpsEnabled() {
    // HABILITAMOS EL MENSAJE GPS ACTIVO
    document.querySelector('#modal_gps_activo').style.display = "none"
    localStorage.setItem('modal_info', false)
}

function loadYearFooter() {
    var year = new Date().getFullYear();

    document.getElementById("year_date").innerHTML = `Rutamigapp. ${year}  @copyrigth todos los derechos reservados.`;
}

function chatView() {
    let chatElement = document.querySelector('.chat')

    if (chatElement.classList.contains('animatedChatIn')) {
        chatElement.classList.toggle('animatedChatOut')
    } else {
        chatElement.classList.toggle('animatedChatIn')
    }

    chatElement.style.animationFillMode = 'forwards'
}


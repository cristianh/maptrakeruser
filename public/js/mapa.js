window.addEventListener('DOMContentLoaded', () => {


    loadYearFooter()

    //SOCKET CODE

    let userChat = []
    let rutaSeleccionada = ""

    let socket = io();

    let notificado = false



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
        console.log(userActiveChat)
        if (userActiveChat.length == 1) {
            userActiveChat[(userActiveChat.length) - 1].classList.add("userActive")
        } else {
            userActiveChat[(userActiveChat.length) - 2].classList.add("userActive")
        }


    }




    //Evento para los usuarios conectados.
    socket.once('chat send server message', (message) => {
        console.log("Mensaje del servidor", message)
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
        console.log("route_exit_user_data", data)
        console.log(geojson)
    })




    //END SOCKET CODE


    //Añadimos markets
    //Para ubicar los paraderos
    let geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.7018544, 4.512214]
                },
                "properties": {
                    "title": "Ruta 18",
                    "description": "Norte/Sur",
                    "velocidad": 0
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.6684114, 4.5410448]
                },
                "properties": {
                    "title": "Ruta 18",
                    "description": "Norte/Sur",
                    "velocidad": 0
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [-75.6887522, 4.5211966]
                },
                "properties": {
                    "title": "Ruta 18",
                    "description": "Norte/Sur",
                    "velocidad": "0"
                }
            }
        ]
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

            //Posicion radar.
            /*  map.circle([lng, lat], 200, {
                 color: 'red',
                 opacity: 0.7,
                 fillOpacity: 0.2
             }).addTo(map); */


            let popup = new mapboxgl.Popup({
                closeButton: true, // Enable the close button
                closeOnClick: false // Disable closing on clicks outside the popup
            })


            //Para test
            //'https://amigaapp-f2f93-default-rtdb.firebaseio.com/test/-NVoSL4YYLDNDiIcvS_I.json'

            map.loadImage(
                'https://res.cloudinary.com/dl7oqoile/image/upload/v1684509887/iconbus_tt1j60.png',
                (error, image) => {
                    if (error) throw error;

                    // Add the image to the map style.
                    map.addImage('bus-route', image);

                    map.addSource('routemap', {
                        type: 'geojson',
                        // Use a URL for the value for the `data` property.
                        data: geojson

                    });

                    // Add a symbol layer
                    map.addLayer({
                        'id': 'routemap-layer',
                        'type': 'symbol',
                        'source': 'routemap',
                        layout: {
                            'icon-image': 'bus-route', // Nombre del icono personalizado externo
                            'icon-size': 0.04 // Ajusta el tamaño del icono según sea necesario
                        },
                        minzoom: 4, // Set the minimum zoom level for the icons to be visible
                        maxzoom: 21, // Set the maximum zoom level for the icons to be visible
                        paint: {
                            'text-halo-blur': 1 // Set the circle blur to 0 to remove the blur effect
                        }
                    });

                    // When a click event occurs on a feature in the places layer, open a popup at the
                    // location of the feature, with description HTML from its properties.
                    map.on('mouseenter', 'routemap-layer', (e) => {
                        // Copy coordinates array.
                        const coordinates = e.features[0].geometry.coordinates.slice();
                        const description = `<div><h3>${e.features[0].properties.title}</h3><Dirección:<span>${e.features[0].properties.description}</span><br><span>Velocidad: ${e.features[0].properties.velocidad}k/h </span><br><span>Distancia: ${e.features[0].properties.distancia == undefined ? 'N/A' : e.features[0].properties.distancia}m</span></div>`

                        // Ensure that if the map is zoomed out such that multiple
                        // copies of the feature are visible, the popup appears
                        // over the copy being pointed to.
                        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                        }


                        popup.setLngLat(coordinates)
                            .setHTML(description)
                            .addTo(map);
                    });

                    // Change the cursor to a pointer when the mouse is over the places layer.
                    map.on('mouseenter', 'routemap-layer', () => {
                        map.getCanvas().style.cursor = 'pointer';
                    });

                    // Change it back to a pointer when it leaves.
                    map.on('mouseleave', 'routemap-layer', () => {
                        map.getCanvas().style.cursor = '';
                        popup.remove()
                    });
                });

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





        })

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


        //Map scale
        // Add a scale control to the map
        //map.addControl(new mapboxgl.ScaleControl());





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
                notifiyUserProximityRoute(msg.room.replace('_', ' ').toLowerCase())
            }

            let rutaUpdatePosition = geojson.features.findIndex((data) => {
                return data.properties.id === msg.room.replace('_', ' ').toUpperCase()
            })

            console.log(rutaUpdatePosition)
            console.log(geojson.features[rutaUpdatePosition])

            if (rutaUpdatePosition == -1) {
                geojson.features.push(
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                Longitude,
                                Latitude
                            ]
                        },
                        'properties': {
                            'id': msg.room.replace('_', ' ').toUpperCase(),
                            'title': msg.room.replace('_', ' ').toUpperCase(),
                            'description': 'Norte/Sur',
                            'velocidad': Speed == undefined ? '0' : Math.round(Speed * 3.6),
                            'distancia': Math.round(distance * 1000)
                        }
                    }
                );

            } else {
                geojson.features[rutaUpdatePosition] = (
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [
                                Longitude,
                                Latitude
                            ]
                        },
                        'properties': {
                            'id': msg.room.replace('_', ' ').toUpperCase(),
                            'title': msg.room.replace('_', ' ').toUpperCase(),
                            'description': 'Norte/Sur',
                            'velocidad': Speed == undefined ? '0' : Math.round(Speed * 3.6),
                            'distancia': Math.round(distance * 1000)
                        }
                    }
                );
            }


            //UPDATE DIFERENT POINT IN MAP DATA.
            map.getSource('routemap').setData(geojson);

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

    let backPointMarkers = []

})

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
    console.log(chatElement.classList.contains('animatedChatIn'))
    if (chatElement.classList.contains('animatedChatIn')) {
        chatElement.classList.toggle('animatedChatOut')
    } else {
        chatElement.classList.toggle('animatedChatIn')
    }

    chatElement.style.animationFillMode = 'forwards'
}


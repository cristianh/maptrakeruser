window.addEventListener('DOMContentLoaded', () => {



    //SOCKET CODE

    let userChat = []
    let rutaSeleccionada = ""

    var socket = io();

    //LISTO EN FRONT
    onSelectRuta = (e) => {
        console.log("SELECCINADO:", e.target.value.replace(" ", "_"))
        //SAVE ROUTE SELECTED
        rutaSeleccionada = e.target.value.replace(" ", "_")
        console.log(rutaSeleccionada)
        socket.emit('user_conect_room_serve', { room: rutaSeleccionada })
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
        console.log("Salas disponibles", users)
        userChat = users
        console.log("users in chat", userChat)
        loadUserChat()
    })

    //CREADO EVENTO ( FALTA LA IMPLEMENTACION DEL CHAT COMPONENT)
    //DETECTAMOS MENSAJE
    socket.on('message_chat', (message) => {
        //LOAD MESSAGE DIV.
        let mensajeelement = document.querySelector('#messages')
        console.log(message)
        let divuser = document.createElement("div")

        const newtext = document.createTextNode(message);
        divuser.appendChild(newtext);
        let element = document.createElement("div")
        element.classList.add("message")
        element.appendChild(divuser)
        mensajeelement.appendChild(element)
    })

    /**
     * Cargamos la lsita de todos los usuarios en el sistema.
     */
    loadUserChat = () => {

        //LOAD SALAS RUTAS DISPONIBLES.
        const mensaje = document.querySelector('.chat_users')
        //CLEAN CONTENT USERS
        mensaje.innerHTML = ""

        userChat.usersIds.forEach(user => {
            console.log(user)
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
        userActiveChat[(userActiveChat.length) - 1].classList.add("userActive")

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


    //END SOCKET CODE

    const appDiv = document.getElementById('app');
    appDiv.style.display = "none"

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



    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            appDiv.innerHTML += `<p>Latitud: ${pos.coords.latitude}</p>`;
            appDiv.innerHTML += `<p>Longitud: ${pos.coords.longitude}</p>`;
            loadMap(parseFloat(pos.coords.latitude), parseFloat(pos.coords.longitude))
            socket.emit('chat message', { 'lat': pos.coords.latitude, 'log': pos.coords.longitude });
        }, (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.log("User denied the request for Geolocation.")
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
        appDiv.innerHTML += `<h2>WatchPosition( )</h2>`;
        appDiv.innerHTML += `<p>Latitud: ${pos.coords.latitude}</p>`;
        appDiv.innerHTML += `<p>Longitud: ${pos.coords.longitude}</p>`;


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
        });


        map.on('load', async () => {

            // location of the feature, with description HTML from its properties.
            map.on('click', 'places', (e) => {
                alert("click event", e)
                /* // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;
                 
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
                 
                new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(map);
                }); */

            })


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

        // Add zoom and rotation controls to the map.
        map.addControl(new mapboxgl.NavigationControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }));

        //Map scale
        // Add a scale control to the map
        //map.addControl(new mapboxgl.ScaleControl());


        /* const marker = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map); */


        /**
         * ESCUCHAMOS LA INFORMACION ENVIADA DESDE EL SERVIDOR
         */
        socket.on('chat_send_server_message', (msg) => {
            /* console.log("recibiendo datos................", msg) */
            const { Latitude, Longitude, Speed } = msg.data
            const el = document.createElement('div');

            el.style.width = "42px"
            el.style.height = "42px"
            el.style.backgroundImage = "url('../../assets/iconbus.svg')"
            el.style.backgroundSize = "cover"
            el.style.borderRadius = "50%"
            el.style.cursor = "pointer"

            el.className = 'marker';

            to = turf.point([Longitude, Latitude]);
            let options = { units: 'kilometers' };

            let distance = turf.distance(from, to, options);

            //Notificamos que la ruta esta cerca.
            //TODO:OJO deshabilitamos la notificacion cambiar.
            if (distance <= 100) {
                //NOTIFICATION TEST
                //let notifications = new NotificationsPushApp('RUTA AMIGAPP', `La ruta ${msg.room.replace('_', ' ').toUpperCase()} se encuentra cerca a tu ubicación.`)

                //SHOW NOTIFICATION
                //notifications.showNotification()
            }

            //SAVE DIFERENT POINT IN JSON MAP DATA.
            geojson.features[msg.room.replace('_', ' ').toLowerCase()] =
            {
                type: 'Feature',
                geometry: {
                    coordinates: {
                        lat: Latitude,
                        lon: Longitude
                    }
                },
                properties: {
                    title: msg.room.replace('_', ' ').toUpperCase(),
                    description: 'Norte/Sur',
                    velocidad: Speed == undefined ? '0' : Math.round(Speed * 3.6),
                    distancia: Math.round(distance * 1000)
                }
            }

            loadPointMap()
        });
    }

    let backPointMarkers = []

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
            el.id = `popmarketbus_${index}`

            el.className = 'marker';

            //CREATE POPUP
            //<br><span>Velocidad: ${geojson.features[key].properties.velocidad}k/h </span><br><span>Distancia: ${geojson.features[key].properties.distancia == undefined ? 'N/A' : geojson.features[key].properties.distancia}m</span>

            var popupText = new mapboxgl.Popup({ offset: 25 }, {
                closeButton: true,
                closeOnClick: false
            })
                .setLngLat([geojson.features[key].geometry.coordinates.lon, geojson.features[key].geometry.coordinates.lat])
                .setHTML(`<div><h3>${geojson.features[key].properties.title}</h3><Dirección:<span>${geojson.features[key].properties.description}</span></div>`)
                .addTo(map);



            //ADD MERCKER TO MAP
            pointmarcketr = new mapboxgl.Marker(el)
                .setLngLat([geojson.features[key].geometry.coordinates.lon, geojson.features[key].geometry.coordinates.lat])
                .addTo(map)
                .setPopup(popupText);

            //ADD MARKERS GENERATES TO ARRAY (SAVE ALL MARKTES)
            backPointMarkers.push(pointmarcketr)


        })
    }


    var year = new Date().getFullYear();
    
    document.getElementById("year_date").innerHTML = `Rutamigapp. ${year}  @copyrigth todos los derechos reservados.` ;
}) 



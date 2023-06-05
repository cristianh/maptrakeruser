/* The above code is defining a function called `createDivChatElement` that creates a new chat
    message element and appends it to the chat message container. The function takes two parameters:
    `message` (the text content of the message) and `classN` (the CSS class to apply to the message
    element). */
const createDivChatElement = (message, classN) => {
    //LOAD MESSAGE DIV.


    let mensajeelement = document.querySelector('#messages')
    let mesajesContainer = document.querySelector('.container_messages')
    let mesajesContainerInner = document.querySelector('.message_inner')
    let divuser = document.createElement("div")

    divuser.style.wordBreak = "break-all";
    divuser.style.width = "180px";
    divuser.style.padding = "1px";



    let divDate = document.createElement("div")

    const newtext = document.createTextNode(message);
    const newtextDate = document.createTextNode(moment(Date.now()).format('HH:mm'));

    divDate.style.fontSize = '0.7em'
    divDate.style.borderLeft = '1px solid silver'
    divDate.style.color = 'brown'

    divuser.appendChild(newtext);
    divDate.appendChild(newtextDate);
    let element = document.createElement("div")
    element.classList.add(classN)
    element.classList.add("animate__bounceIn")
    element.appendChild(divuser)
    element.appendChild(divDate)
    mesajesContainerInner.appendChild(element)    
    //Scroll rolling down
    mesajesContainerInner.scrollTop = mesajesContainer.scrollHeight;
}


const loadMessageChat = (route) => {

    try {
       
        let routeSelected;
        let elementSelected = document.querySelector('#route')
        document.querySelector('.message_inner').innerHTML = ""
        if (route == null) {
            routeSelected = elementSelected.options[elementSelected.selectedIndex].text.replace(" ", "_")
        } else {
            routeSelected = route
        }



        fetch(`./allChat?ruta=${routeSelected}`).then((resp) => {
            return resp.json()
        })
            .then((response) => {
                let mesajesContainerInner = document.querySelector('.message_inner')
                let mesajesContainer = document.querySelector('.container_messages')
                response.messages.map((message) => {                    
                    createDivChatElement(CryptoJS.AES.decrypt(message, "4PiTh4fmkqf9jTy%%D3q").toString(CryptoJS.enc.Utf8), "message")
                })

                mesajesContainer.scrollTop = mesajesContainerInner.scrollHeight;

            })
    } catch (error) {
        console.log(error)
    }

}
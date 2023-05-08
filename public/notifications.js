
class NotificationsPushApp {
    title = ""
    body = ""
    icon = './assets/icons.png'
    time = 4000
    notification = null
    

    constructor(title, body, icon, time) {
        this.title = title;
        this.body = body;
        this.icon = icon;
        this.time = time;
    }

    checkPermission() {
        Push.Permission.request(this.onGranted, this.onDenied); 
    }

    onGranted() {
        //alert('Permisos concedidos')
        console.log('Permisos concedidos')
    }

    onDenied() {
        //alert('Permisos denegados')
        console.log('Permisos denegados')
    }

    showNotification() {
        this.checkPermission()
            if(Push.Permission.has()){
                this.notification = Push.create(this.title, {
                    tag:'Notification',
                    body: this.body,
                    icon: 'https://res.cloudinary.com/dl7oqoile/image/upload/v1683573913/logo_vhrm0a.png',
                    timeout: this.time,
                    requireInteraction:true,
                    onClick: function () {
                        window.focus();
                        this.close();
                    }
                });
            }
    }

    hiddenNotification() {

        //1. Method
        //Push.close('Notification');

        //2. Method
        /* promise.then(function (notification) {
            notification.close();
        }); */

        //3. Method Close alla notifications
        //Push.clear();
    }

}
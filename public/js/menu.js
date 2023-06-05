window.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.chat_icon').addEventListener('mouseup', () => {
    
        loadMessageChat()
    
        let element = document.querySelector('.chat')
        element.style.display = "flex"
        animateCSS('.chat', 'bounceInUp')
    }, false)


    
    const animateCSS = (element, animation, prefix = 'animate__') =>
        // We create a Promise and return it
        new Promise((resolve, reject) => {
            const animationName = `${prefix}${animation}`;
            const node = document.querySelector(element);

            node.classList.add(`${prefix}animated`, animationName);

            // When the animation ends, we clean the classes and resolve the Promise
            function handleAnimationEnd(event) {
                event.stopPropagation();
                node.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            node.addEventListener('animationend', handleAnimationEnd, { once: true });
        });



    document.querySelector('.chat_title').addEventListener('click', () => {
        // or
        animateCSS('.chat', 'bounceOutDown').then((message) => {
            // Do something after the animation
            document.querySelector('.chat').style.display = 'none';
        });
    });


    animateMenu = () => {
        let x = document.querySelector(".menu-mobile");
        if (x.style.display === "block") {
            x.style.display = "none";
        } else {
            x.style.display = "block";
        }
    }
});
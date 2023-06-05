const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RouteSchema = new Schema({
        name: { type: String, required: [true, 'La ruta es obligatorio'] }, // String is shorthand for {type: String}
});

const MessageSchema = new Schema({
    message: { type: String, required: [true, 'El mensaje es obligatorio'] }, // String is shorthand for {type: String}
    idUserSocket: { type: String },
    date: { type: Date, default: Date.now },
    route: [RouteSchema],
    estado: { type: Boolean, default: true }
});


// Creación de los modelos a partir de los esquemas
const Message = model('messages', MessageSchema);
const Route = mongoose.model('route', RouteSchema);

module.exports =  {Message,Route}
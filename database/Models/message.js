const mongoose = require('mongoose');
const { Schema,model } = mongoose;

const MessageSchema = new Schema({
    route:{ type: String, required: [true, 'La ruta es obligatorio'] }, // String is shorthand for {type: String}
    message: { type: String, required: [true, 'El mensaje es obligatorio'] }, // String is shorthand for {type: String}
    idUserSocket: {type:String},
    date: { type: Date, default: Date.now },
});

module.exports = model('messages',MessageSchema);

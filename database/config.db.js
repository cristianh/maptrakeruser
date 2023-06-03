const mongoose = require('mongoose');
require("dotenv").config();

const dbConnection = async() => {

    try {
        await mongoose.connect(process.env.MONGODB_TEST_LOCAL,{
            useNewUrlParser: true           
        });

        console.log('MONGO CONECTADO')
    } catch (error) {
        console.log(error.message)
        throw new Error('Error en la base de datos.')   
    }
}

module.exports= {
    dbConnection
}
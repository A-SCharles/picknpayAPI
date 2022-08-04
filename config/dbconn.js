require('dotenv').config();
const { createConnection } = require('mysql');
// Create connection variable
let connection;
// Problem solved
(function handleConnection() {
    connection = createConnection({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        port: process.env.dbPORT,
        database: process.env.DBNAME,
        multipleStatements: true
    });
    
    connection.connect( (err)=> {
        if(err) throw err 
    });
    
    connection.on('error', (err)=> {
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            handleConnection();
        }else {
            throw err;
        }
    })    
})(); 
// handleConnection();
module.exports = connection;
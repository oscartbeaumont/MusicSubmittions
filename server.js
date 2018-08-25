console.log("Starting Music Suggestions... Created By Oscar Beaumont!");

// External Dependencies
const http = require('http');
const https = require('https');
const express = require('express');
const resolve = require('path').resolve;
const bodyParser = require('body-parser');
const session = require('express-session');
const socketIO = require('socket.io');
const sharedsession = require('express-socket.io-session');
const FileStore = require('session-file-store')(session);
const low = require('lowdb');
const lowFileSync = require('lowdb/adapters/FileSync')

// Global Varibles and Configuration
const config = require('./config.json');
var app = express();
const db = low(new lowFileSync('db.json'));

// Required For Secure Cookies with A Proxy (Nginx). The Value Is The IP Of Your Proxy Server.
if(config.proxy) {
  app.set('trust proxy', config.proxy)
}
// Disabled The Powered By Express Header
app.disable('x-powered-by');

//Websockets
var httpServer = http.createServer(app);
const io = socketIO(httpServer);

// Bind The Webserver Middleware
let sessions = session({
    name: 'musicSuggestionsID',
    secret: config.sessionSecret,
    store: new FileStore({path : './sessions/'}),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      expires: 7 * 24 * 60 * 60 * 1000 // 1 Week (7 Days)
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessions);
io.use(sharedsession(sessions, { autoSave:true }));

// Initilise The Database Schema (If It Was Created)
db.defaults({ music: [] })
  .write();

if(config.webPath == null || config.webPath == "") {
  config.webPath = __dirname + "/dist";
} else {
  config.webPath = resolve(config.webPath);
}

// Initilise The Spotify API & Start The Reauthenticate Loop
let spotifyApi = require('./internal/spotify.js')(config.spotify.id, config.spotify.secret);

setInterval(() => {
  spotifyApi.authenticate();
}, 20 * 60 * 1000); // Every 20 Minutes Reauthenticate

// Internal Dependencies
require('./internal/api.js')(app, db, config, io, spotifyApi);
require('./internal/ui.js')(app, db, config);
require('./internal/admin.js')(app, db, config);

// Start The Webserver Using The Config
httpServer.listen(config.http, () => console.log("Music Suggestions Is Listening For HTTP Requests On Port " + config.http + "!"));

// Socket IO
io.on('connection', (socket) => {
  if(socket.handshake.session.admin == true) {
     socket.emit('startup', { music: db.get('music').value(), admin: true });
  } else {
    socket.emit('startup', { music: db.get('music').value(), admin: false });
  }
  io.sockets.emit('sessionCountUpdate', Object.keys(io.clients().connected).length);
  socket.on('disconnect', () => io.sockets.emit('sessionCountUpdate', Object.keys(io.clients().connected).length));
});

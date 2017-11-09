// TOOD:
// Store Fonts On Server So Client Doesn't Need Network Access (Check By Taking Clients Offline)
//Pie CHarts On The Admin Page Not Quite Working

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// Start Of File ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
const config = require("./config.js");
const syswidecas = require('syswide-cas');
if(config.cert) {
	syswidecas.addCAs(__dirname + '/cert.pem');
}
const dnsd = require('dnsd');
const https = require('https');
const express = require("express");
const session = require("express-session");
const subdomain = require('express-subdomain');
const auth = require('basic-auth');
const request = require('request');
const SpotifyWebApi = require('spotify-web-api-node');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const opn = require('opn');
const fs = require('fs');
const dns = require('dns');
const useragent = require('useragent');
const { URL } = require('url');
const httpsReq = require('https');
const path = require('path');
const Moment = require('moment-timezone');
const util = require('util');

////////////////////////////
//Varibles
////////////////////////////
var songs = []; //Songs Currently In The List
var songArchive = []; //Songs That Have Already Been Played
var users = {}; //Data About Users Device And Activites

if (config.https) {
  var privateKey  = fs.readFileSync(__dirname + '/ssl_key.pem', 'utf8');
  var certificate = fs.readFileSync(__dirname + '/ssl_cert.pem', 'utf8');
  var credentials = {key: privateKey, cert: certificate};
}

useragent(true);
var disabled = false;
var api_key = "";
var spotifyApi = new SpotifyWebApi({ });
var app = express();
var sessionMiddleware = session({secret: "wqytrwhgwjhgwhjgweytwyeu",
																saveUninitialized: true,
															  resave: false,
															 	maxAge: 604800000 });
var route = express.Router();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var generateRandomString = function(length) { //MOve to New File OF My Custom Functions FOr ALl PRojects
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

function getSubdomain(h) {
	var parts = h.split(".");
	if(parts.length == 2) return "www";
	return parts[0];
}

////////////////////////////
//Functions
////////////////////////////
function song(_name, _artists, _album, _explicit, _albumArt, _uri) {
  this.name = _name;
  this.artists = _artists;
  this.album = _album;
  this.explicit = _explicit;
	this.rank;
	this.votes = 0;
	this.created = (new Date).getTime();
	this.albumArt = _albumArt;
	this.uri = _uri;
	this.disabledvotes = 0;
}

function user(_id, _ip) {
  this.deviceName = "";
	this.ownerName = "";
	this.os;
	this.browser;
	this.id = _id;
	this.ip = _ip;
	this.platform = "";
	this.joined = (new Date).getTime();
	this.admin = false;
	this.adminView = false;
	this.presenter = false;
	this.public = false;
	this.locked = false;
	this.songs = [];
	this.upvotes = [];
	this.downvotes = [];
}

function searchSong(_name, _artist, _ip, callback) {
	/////////////////////////////////////////////////////////
	// Search For It On Spotify And Return Results To User //
	////////////////////////////////////////////////////////
	if (_name != "" && _artist != "") { //If The Seartch Returns Nothing Search Again Without Artist
		spotifyApi.searchTracks('track:' + _name)
			.then(function(data) {
				if (data.body.tracks.items.length == 0) {
					spotifyApi.searchTracks('track:' + _name)
						.then(function(data) {
							if (data.body.tracks.items.length == 0) {
								spotifyApi.searchTracks('artist:' + _artist)
									.then(function(data) {
										if (data.body.tracks.items.length == 0) {
											spotifyApi.searchTracks('Love')
											  .then(function(data) {
													callback(data.body.tracks.items);
											  }, function(err) {
													console.error('Something Went Wrong Search For A Song On The Spotify Database!');
											    console.error(err);
											  });
										} else {
											callback(data.body.tracks.items);
										}
									}, function(err) {
										console.error('Something Went Wrong Search For A Song On The Spotify Database!');
										console.error(err);
									});
							} else {
								callback(data.body.tracks.items);
							}
						}, function(err) {
							console.error('Something Went Wrong Search For A Song On The Spotify Database!');
							console.error(err);
						});
				} else {
					callback(data.body.tracks.items);
				}
			}, function(err) {
				console.error('Something Went Wrong Search For A Song On The Spotify Database!');
				console.error(err);
			});
	} else if (_name != "") {
		spotifyApi.searchTracks('track:' + _name)
			.then(function(data) {
				callback(data.body.tracks.items);
			}, function(err) {
				console.error('Something Went Wrong Search For A Song On The Spotify Database!');
				console.error(err);
			});
	} else if (_artist != "") {
		spotifyApi.searchTracks('artist:' + _artist)
			.then(function(data) {
				callback(data.body.tracks.items);
			}, function(err) {
				console.error('Something Went Wrong Search For A Song On The Spotify Database!');
				console.error(err);
			});
	}
}

function addSong(_name, _artist, _index, _ip, callback) {
	if (config.totalSongLimit >= songs.length + 1) {
		/////////////////////////////////////////////////////////
		// Search For It On Spotify And Return Results To User //
		////////////////////////////////////////////////////////
		searchSong(_name, _artist, _ip, function(_results) {
			var reply = "";
			try {
				reply = _results[_index];
			} catch(e) {
				console.log("Error Index Of Song Was Not Populated!");
			}

			try {
				if (reply.name == "") {
					callback(false, false, false, false);
					return;
				}
			} catch(e) {
				callback(false, false, false, false);
				return;
			}
			var artists = reply.artists.map(function(elem){ return elem.name; }).join(", ");

			//////////////////////////////////
			// Check If Song Exists Already //
			//////////////////////////////////
			for (var i = 0; i < songs.length; i++) {
				if (songs[i].name == reply.name) {
					if (songs[i].artists == artists) {
						callback(true, false, false);
						if (_ip != null) {
							upvote(reply.name, artists, _ip);
						}
						return;
					}
				}
			}

			//////////////////////////////////////////
			// Check If Song Was Recently Requested //
			//////////////////////////////////////////
			for (var i = 0; i < songArchive.length; i++) {
				if (songArchive[i].name == reply.name) {
					if (songArchive[i].artists == artists) {
						if ((new Date).getTime() >= songArchive[i].created + config.songTimeout * 60 * 1000) {
							if (i > -1) {
								songArchive.splice(i, 1);
							}
						} else {
							if (songArchive[i].disabledvotes < config.songRequestTimeout) {
								songArchive[i].disabledvotes = songArchive[i].disabledvotes + 1;
								callback(true, true, false);
								return;
							} else {
								if (i > -1) {
									songArchive.splice(i, 1);
								}
							}
						}
					}
				}
			}

			///////////////////////////////////////////////
			// Add The Song To The Array and Alert Users //
			///////////////////////////////////////////////
			console.log("Added Song " + reply.name + ", By " + artists + "!");
			var url = reply.album.images[0].url;
			var name = url.split("/").pop().split("#")[0].split("?")[0];
			request.head(url, function(err, res, body){
	    	request(url).pipe(fs.createWriteStream(config.artworkCache +  "/" + name + ".jpeg"));
	  	});
			var _song = new song(reply.name, artists, reply.album.name,  reply.explicit, "/artworkCache/" + name, reply.uri);
			songs.push(_song);
			rankSongs();
			io.sockets.emit('update', JSON.stringify(songs));
			callback(false, false, false, reply.explicit);
			if (_ip != null) {
				users[_ip].songs.push(_song);
			}
			return;
		});
	} else {
		disabled = true;
		console.log("Max Event Submittions Hit! Song Submittions are Disabled!");
	}
}

function removeSong(_name, _artists) {
  for (var i = 0; i < songs.length; i++) {
    if (songs[i].name == _name) {
      if (songs[i].artists == _artists) {
        if (i > -1) {
					var song = songs[i];
					spotifyApi.removeTracksFromPlaylist(config.playlist1.split(":")[1], config.playlist1.split(":")[0], [{ uri : song.uri }], {})
					.then(function(data) {
						//
					}, function(err) {
						console.log('Something went wrong!', err);
					});
					spotifyApi.removeTracksFromPlaylist(config.playlist2.split(":")[1], config.playlist2.split(":")[0], [{ uri : song.uri }], {})
					.then(function(data) {
						//
					}, function(err) {
						console.log('Something went wrong!', err);
					});
						songArchive.push(songs[i]);
            songs.splice(i, 1);
						console.log("Removed Song '" + _name + "' By '" + _artists + "'!");
						rankSongs();
						io.sockets.emit('update', JSON.stringify(songs));

						Object.keys(users).forEach(function(key, index) {
							for (var ii = 0; ii < users[key].upvotes.length; ii++) {
								if (users[key].upvotes[i] == _name) {
									users[key].upvotes.splice(ii, 1);
								}
							}

							for (var ii = 0; ii < users[key].downvotes.length; ii++) {
								if (users[key].downvotes[i] == _name) {
									users[key].downvotes.splice(ii, 1);
								}
							}
						});
        }
      }
    }
  }
}

function upvote(_song, _artists, _ip) { //Add Callback
	if (users[_ip] == undefined) {
		//console.log("Couldn't Find User From IP!");
		return;
	}

	///////////////////////////////////
	// Check If User Is Admin Or Not //
	///////////////////////////////////
	if (users[_ip].admin) {
		///////////////////////////////////
		// Upvoted Unlimited For Admins //
		///////////////////////////////////
		for (var i = 0; i < songs.length; i++) {
			if(songs[i].name == _song) {
				if(songs[i].artists == _artists) {
					songs[i].votes = songs[i].votes + 1;
					rankSongs();
					io.sockets.emit('update', JSON.stringify(songs));
					return;
					break;
				}
			}
		}
	} else {
		////////////////////////////////////
		// Get Current Votes For The Song //
		////////////////////////////////////
		var votes;
		var index;
		var downvoted = false;

		for (var i = 0; i < songs.length; i++) {
			if(songs[i].name == _song) {
				if(songs[i].artists == _artists) {
					votes = songs[i].votes;
					index = i;
					break;
				}
			}
		}

		if (index == undefined) {
			console.log("Song Not Found While Upvoting");
			return;
		}

		////////////////////////////////////////////
		// Check If Song Has Already Been Upvoted //
		///////////////////////////////////////////
		for (var i = 0; i < users[_ip].upvotes.length; i++) {
			if(users[_ip].upvotes[i] == _song + "\n\n\n\n" + _artists) {
				return;
				break;
			}
		}

		//////////////////////////////////////////////
		// Check If Song Has Already Been Downvoted //
		/////////////////////////////////////////////
		for (var i = 0; i < users[_ip].downvotes.length; i++) {
			if(users[_ip].downvotes[i] == _song + "\n\n\n\n" + _artists) {
				users[_ip].downvotes.splice(i, 1);
				downvoted = true;
				break;
			}
		}

		////////////////////////////////////////////////////////////
		// If Song Has Not Been Upvoted Or Downvote -> Upvote It  //
		////////////////////////////////////////////////////////////
		if (downvoted == true) {
			votes = votes + 2;
		} else {
			votes = votes + 1;
		}

		//////////////////////////////////////////////
		// Update The Song Class and Alert Clients  //
		//////////////////////////////////////////////
		songs[index].votes = votes;
		rankSongs();
		users[_ip].upvotes.push(_song + "\n\n\n\n" + _artists)
		io.sockets.emit('update', JSON.stringify(songs));
		return;
	}
}

function downvote(_song, _artists, _ip) {
	if (users[_ip] == undefined) {
		//console.log("Couldn't Find User From IP!");
		return;
	}

	///////////////////////////////////
	// Check If User Is Admin Or Not //
	///////////////////////////////////
	if (users[_ip].admin) {
		///////////////////////////////////
		// Upvoted Unlimited For Admins //
		///////////////////////////////////
		for (var i = 0; i < songs.length; i++) {
			if(songs[i].name == _song) {
				if(songs[i].artists == _artists) {
					songs[i].votes = songs[i].votes + 1;
					rankSongs();
					io.sockets.emit('update', JSON.stringify(songs));
					return;
					break;
				}
			}
		}
	} else {
		////////////////////////////////////
		// Get Current Votes For The Song //
		////////////////////////////////////
		var votes;
		var index;
		var upvoted = false;

		for (var i = 0; i < songs.length; i++) {
			if(songs[i].name == _song) {
				if(songs[i].artists == _artists) {
					votes = songs[i].votes;
					index = i;
					break;
				}
			}
		}

		if (index == undefined) {
			console.log(_song + "    " + _artists);
			console.log("Song Not Found While Downvoting");
			return;
		}

		//////////////////////////////////////////////
		// Check If Song Has Already Been Downvoted //
		/////////////////////////////////////////////
		for (var i = 0; i < users[_ip].downvotes.length; i++) {
			if(users[_ip].downvotes[i] == _song + "\n\n\n\n" + _artists) {
				return;
				break;
			}
		}

		////////////////////////////////////////////
		// Check If Song Has Already Been Upvoted //
		///////////////////////////////////////////
		for (var i = 0; i < users[_ip].upvotes.length; i++) {
			if(users[_ip].upvotes[i] == _song + "\n\n\n\n" + _artists) {
				users[_ip].upvotes.splice(i, 1);
				upvoted = true;
				break;
			}
		}

		////////////////////////////////////////////////////////////
		// If Song Has Not Been Upvoted Or Downvote -> Upvote It  //
		////////////////////////////////////////////////////////////
		if (upvoted == true) {
			votes = votes - 2;
		} else {
			votes = votes - 1;
		}

		//////////////////////////////////////////////
		// Update The Song Class and Alert Clients  //
		//////////////////////////////////////////////
		songs[index].votes = votes;
		rankSongs();
		users[_ip].downvotes.push(_song + "\n\n\n\n" + _artists)
		io.sockets.emit('update', JSON.stringify(songs));
		return;
	}
}

function rankSongs() {
	songs.sort(function(obj1, obj2) {
		if (obj2.votes == obj1.votes) {
				return obj1.created - obj2.created;
		} else {
			return obj2.votes - obj1.votes;
		}
	});
	for (var i = 0; i < songs.length; i++) {
		songs[i].rank = i;
	}
}

function loadPlaylist(user, playlistID) {
	spotifyApi.getPlaylist(user, playlistID)
  .then(function(data) {
		for (var i = 0; i < data.body.tracks.items.length; i++) {
			addSong(data.body.tracks.items[i].track.name, data.body.tracks.items[i].track.artists[0].name, 0, null, function() {});
		}
  }, function(err) {
    console.log('Something Eent Wrong Loading A PLaylist!');
		console.log(err);
  });
}

function addToPlaylist(_song, _artist, _user, _playlistID, callback) { //Rewrite With NEw Music Search Setup
	spotifyApi.searchTracks('track:' + _song + ' artist:' + _artist)
		.then(function(data) {
			var reply = data.body.tracks.items;
			for (var i = 0; i < reply.length; i++) {
				if (reply[i].name == _song) {
					for (var ii = 0; ii < reply[i].artists.length; ii++) {
						if (reply[i].artists[ii].name == _artist) {
							spotifyApi.addTracksToPlaylist(_user, _playlistID, [reply[i].uri])
							.then(function(data) {
									callback(true);
									return;
								}, function(err) {
									console.error('Something went wrong!');
									console.error(err);
								});
							return; ////////////////////// This is a really really really bad way of doing it and will break stuff if not fixed!
						}
					}
				}
			}
			callback(false);
			return;
		}, function(err) {
			console.error('Something went wrong!');
			console.error(err);
		});
}

/////////////////////////////
// Application Web Routing //
/////////////////////////////

function spotifyAuth(req, res) {
	var state = generateRandomString(16);
	res.cookie('spotify_auth_state', state);
	res.redirect('https://accounts.spotify.com/authorize?' +
		querystring.stringify({
			response_type: 'code',
			client_id: config.client_id,
			scope: 'user-read-private user-read-email playlist-read-collaborative streaming playlist-read-private playlist-modify-private',
			redirect_uri: "http://" + config.url + ":" + config.httpPort + "/callback",
			state: state
		}));
}

function spotifyCallback(req, res) {
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies['spotify_auth_state'] : null;

	if (state === null || state !== storedState) {
		res.redirect('/#' +
			querystring.stringify({
				error: 'state_mismatch'
			}));
	} else {
		res.clearCookie('spotify_auth_state');
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: "http://" + config.url + ":" + config.httpPort + "/callback",
				grant_type: 'authorization_code'
			},
			headers: {
				'Authorization': 'Basic ' + (new Buffer(config.client_id + ':' + config.client_secret).toString('base64'))
			},
			json: true
		};

		request.post(authOptions, function(error, response, body) {
			if (!error && response.statusCode === 200) {
				api_key = body.access_token;
				spotifyApi.setAccessToken(api_key);
				authenticated = true;
				console.log("Spotify API Authenticated!");
				res.send('<script>window.close();</script>');
			}
		});
	}
}

function expressAuth() {
	app.get("/artworkCache/:id", function(req, res) {
		var id = req.params.id;
		if (id == undefined) {
			res.send("An Error Occured!");
			return;
		}

		var file = config.artworkCache + "/" + id + ".jpeg";
		if(fs.existsSync(file)) {
			res.sendFile(file);
		} else {
			var url = "https://i.scdn.co/image/" + id;
			request.head(url, function(err, res, body){
				request(url).pipe(fs.createWriteStream(config.artworkCache +  "/" + id + ".jpeg"));
			});
			setTimeout(function() { res.sendFile(file); }, 1250)
		}
	});
	app.use(bodyParser.json())
		.use(sessionMiddleware)
		.use(function (req, res, next) {
			var host = req.headers.host;
			if (host == "localhost" + config.httpPort || host == "localhost" + config.httpsPort || host == "localhost" || host == config.url || host == config.url + ":" + config.httpPort || host == config.url + ":" + config.httpsPort) {
				next();
			} else {
				res.redirect("http://" + config.url + ":" + config.httpPort + "/");
			}
		})
	  .use(express.static(__dirname + '/public'))
	  .use(cookieParser())
	  .use(bodyParser.urlencoded({
	    extended: true
	  }))
		.use(function (req, res, next) {
			if (req.path.startsWith("/frameworks/") || req.path.startsWith("/style/") || req.path.startsWith("/script/")) {
				res.sendFile( __dirname + "/html/" + req.path);
			} else {
				next();
			}
		})
	  .use(function (req, res, next) {
			if (req.path == "/auth" || req.path == "/auth/") {
				spotifyAuth(req, res);
			} else if (req.path == "/callback" || req.path == "/callback/") {
				spotifyCallback(req, res);
			} else {
				if (api_key != "") {
					next();
				} else {
					res.sendFile( __dirname + "/html/auth_api.html");
				}
			}
	  })
	  .use(function (req, res, next) {
			var ip = req.connection.remoteAddress.replace("::ffff:", "").replace("::1", "localhost");
	    var id = req.session.id;

	    if (!users[id]) {
	      users[id] = new user(id, ip);

	      var agent = useragent.parse(req.headers['user-agent']);
	      users[id].platform = agent.os.family + " " + agent.os.major + "." + agent.os.minor + "." + agent.os.patch;
				users[id].os = agent.os.family;
				users[id].browser = agent.family;

	      if (ip == "localhost") {
	        users[id].deviceName = "Music Suggestions Server!";
	      } else {
	        dns.reverse(ip, function(err, domains) {
	            if(err) {
	              users[id].deviceName = "noDeviceName";
	            } else {
	              users[id].deviceName = domains[0];
	            }
	            io.sockets.emit("admin-clients", JSON.stringify(users));
	        });
	      }

	      res.redirect("/welcome/");
	    } else {
	      if (users[id].locked == true) {
	        res.sendFile("/blocked/");
	      } else {
	        next();
	      }
	    }
	  })
	  .use("/", route)
}

function socketIO() {
	io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
	});
	io.on('connection', function(socket){
	  var ip = socket.request.session.id;
		try {
			socket.emit('upvotes', JSON.stringify(users[ip].upvotes));
			socket.emit('downvotes', JSON.stringify(users[ip].downvotes));
		} catch(e) {}
	  socket.emit('update', JSON.stringify(songs));
	  if (api_key == "") {
	    socket.emit("auth", "now");
	  }

	  socket.on('upvote', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].locked) {
	      socket.emit("lock", "now");
	    } else {
				var reply = msg.split("\n\n\n\n");
	      upvote(reply[0], reply[1], ip);
	    }
	  });
	  socket.on('downvote', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].locked) {
	      socket.emit("lock", "now");
	    } else {
				var reply = msg.split("\n\n\n\n");
	      downvote(reply[0], reply[1], ip);
	    }
	  });
	  socket.on('admin-remove', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var songData = msg.split("\n\n\n\n");
	      removeSong(songData[0], songData[1]);
	    }
	  });
	  socket.on('admin-playlist1', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var songData = msg.split("\n\n\n\n");
	      addToPlaylist(songData[0], songData[1], config.playlist1.split(":")[1], config.playlist1.split(":")[0], function(success) {
	        if(!success) {
	          console.log("Error Adding To Playlist 1!");
	        }
	      });
	    }
	  });
	  socket.on('admin-playlist2', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var songData = msg.split("\n\n\n\n");
	      addToPlaylist(songData[0], songData[1], config.playlist2.split(":")[1], config.playlist2.split(":")[0], function(success) {
	        if(!success) {
	          console.log("Error Adding To Playlist 2!");
	        }
	      });
	    }
	  });
	  socket.on('admin-downvote', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var reply = msg.split("\n\n\n\n");
	      downvote(reply[0], reply[1], ip);
	    }
	  });
	  socket.on('admin-upvote', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var reply = msg.split("\n\n\n\n");
	      upvote(reply[0], reply[1], ip);
	    }
	  });
	  socket.on('admin-askClients', function(msg){
	    if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
	      socket.emit("admin-clients", JSON.stringify(users));
	    }
	  });
		socket.on('admin-askSongs', function(msg){
	    if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
				var arr = songs;
	      socket.emit("admin-songs", arr.concat(songArchive).length);
	    }
	  });
	  socket.on('admin-lock', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
	      users[msg].locked = true;
	    }
	  });
	  socket.on('admin-unlock', function(msg){
			if (users[ip] == undefined) {
	      //console.log("Couldn't Find User From IP!");
	      return;
	    }

	    if (users[ip].admin) {
	      users[msg].locked = false;
	    }
	  });
	});
}

function expressRoutes() {
	 route.post("/submit/stage1.php", function(req, res) {
 	  var ip = req.session.id;

		if (disabled) {
			return res.send("redirect_client:/submittionsDisabled/");
		}

 	  if (users[ip].songs.length > config.maxSongsPerUser - 1) {
			return res.send("redirect_client:/submittion/max-submittions/");
 	    //return res.redirect(301, "/index.html?maxSongs=true");
 	  } else {
 	    searchSong(req.body.songName, req.body.artist, ip, function(_results) {
				if (!_results.length == 0) {
					var songs = {};

					for (var i = 0; i < _results.length; i++) {
						songs[i] = {};
						songs[i].name = _results[i].name;
						songs[i].artists =  _results[i].artists.map(function(elem){ return elem.name; }).join(", ");
						var id =  _results[i].album.images[0].url.split("/").pop().split("#")[0].split("?")[0];
						var file = config.artworkCache + "/" + id + ".jpeg";
						if(!fs.existsSync(file)) {
							var url = "https://i.scdn.co/image/" + id;
							request.head(url, function(err, res, body){
								request(url).pipe(fs.createWriteStream(config.artworkCache +  "/" + id + ".jpeg"));
							});
						}
						songs[i].albumArt = "/artworkCache/" + _results[i].album.images[0].url.split("/").pop().split("#")[0].split("?")[0];
						songs[i].index = i;
					}
					setTimeout(function() { res.send(JSON.stringify(songs)) }, 1000);
				} else {
					return res.send("redirect_client:/submittion/not-found/");
				}
 	    });
 	  }
 	});

	route.post("/submit/stage2.php", function(req, res) {
		var ip = req.session.id;

		if (users[ip].admin == false && users[ip].public == false) {
			if (users[ip].songs.length > config.maxSongsPerUser - 1) {
	 		 return res.redirect(301, "/index.html?maxSongs=true");
		 }
		}

		if (disabled) {
			return res.sendFile(__dirname + "/html/submittionsDisabled/index.html");
		} else {
			addSong(req.body.songName, req.body.artist, req.body.index, ip, function(_alreadyAdded, _recentlyRequested, _results) {
	     if (_alreadyAdded) {
	 			 if (_recentlyRequested) {
	 			 	return res.send("redirect_client:/submittion/try-latter/");
	 			 } else {
	 			 	return res.send("redirect_client:/submittion/upvotted/");
	 			 }
	 		 } else {
	 		 	return res.send("redirect_client:/submittion/success/");
	 		 }
	 	 });
		}
 });

 route.get("/admin/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 //users[id].adminView = true;
	 //res.send("Admin Mode Enabled!");
	 res.sendFile(__dirname + "/html/admin/index.html")
 });

 route.post("/admin/enable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].adminView = true;
	 users[id].public = false;
	 users[id].presenter = false;
	 res.send("Admin Mode Enabled!");
 });

 route.post("/admin/disable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].adminView = false;
	 res.send("Admin Mode Disabled!");
 });

 route.post("/public/enable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].adminView = false;
	 users[id].public = true;
	 users[id].presenter = false;
	 res.send("Public Mode Enabled!");
 });

 route.post("/public/disable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].public = false;
	 res.send("Public Mode Disabled!");
 });

 route.post("/presenter/enable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].adminView = false;
	 users[id].public = false;
	 users[id].presenter = true;
	 res.send("Presenter Mode Enabled!");
 });

 route.post("/presenter/disable/", function (req, res, next) {
	 webAdminAuth(req, res);
	 var id = req.session.id;
	 users[id].presenter = false;
	 res.send("Presenter Mode Disabled!");
 });

 route.post("/clear-modes/", function (req, res, next) {
	webAdminAuth(req, res);
	var id = req.session.id;
	users[id].adminView = false;
	users[id].public = false;
	users[id].presenter = false;
	res.send("All Modes Disabled!");
 });

 route.post("/clear-songs/", function (req, res, next) {
 webAdminAuth(req, res);
 var id = req.session.id;
 songs = [];
 console.log("Clearing All Suggeted Songs!");
 res.send("All Suggested Songs Cleared!");
 });


/*
clear-songs
*/

 route.post("/submittions-increase/", function (req, res, next) {
	webAdminAuth(req, res);
	config.totalSongLimit = config.totalSongLimit + 50;
	res.send("Submittions Song Limit Increased By 50 Songs to '" + config.totalSongLimit + "'!");
 });

	route.get("/", function (req, res, next) {
		 var ip = req.session.id;
		 if (users[ip].public) {
			 res.sendFile( __dirname + "/html/public/index.html");
		 } else {
			 if (users[ip].presenter) {
				 res.sendFile( __dirname + "/html/presenter/index.html");
			 } else {
				 if (users[ip].adminView) {
					 res.sendFile( __dirname + "/html/admin-display/index.html");
				 } else {
					 res.sendFile( __dirname + "/html/index.html");
				 }
			 }
		 }
	});

	route.use(function (req, res, next) {
 		res.sendFile(__dirname + "/html" + req.path); //May Need / After /html so it id '/html/'
 	});
}

function webAdminAuth(req, res) {
	const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
	const [login, password] = new Buffer(b64auth, 'base64').toString().split(':')

	if (!login || !password || login !== config.adminUsername || password !== config.adminPassword) {
		res.set('WWW-Authenticate', 'Basic realm="nope"')
		res.status(401).send("You Do Not Have Permission To Access This!");
		return
	} else {
		var id = req.session.id;
		users[id].admin = true;
	}
}

function dnsServer() {
	if (config.dns) {
	  dnsd.createServer(function(req, res) {
	    res.end(config.serverIP);
	  }).listen(config.dnsPort, '0.0.0.0');
	  console.log("DNS Server Started!");
	}
}

function backup(_stopping) {
	var time = Moment().tz('Australia/Perth').format('MMMM Do YYYY, h_mm_ss a');

	if (_stopping) {
		fs.writeFileSync(config.backupDir + "/" + time + ".txt", JSON.stringify(songs) + "\n\n\n\n\n\n\n\n\n\n\n\n" + JSON.stringify(songArchive) + "\n\n\n\n\n\n\n\n\n\n\n\n" + JSON.stringify(users));
		fs.writeFileSync(config.backupDir + "/current.txt", fs.readFileSync(config.backupDir + "/" + time + ".txt"));
		console.log("Music Suggestions Config Backed Up To File!");
	} else {
		fs.writeFile(config.backupDir + "/" + time + ".txt", JSON.stringify(songs) + "\n\n\n\n\n\n\n\n\n\n\n\n" + JSON.stringify(songArchive) + "\n\n\n\n\n\n\n\n\n\n\n\n" + JSON.stringify(users), function(err) {
			if (err) {
				console.log("There Was An Error Saving The Backup!");
				console.log(err);
				console.log("Attempting To Try The Backup Again In 10 Seconds");
				setTimeout(function() { backup() }, 10000);
			} else {
				console.log("Music Suggestions Has Been Backed Up At " + time);
			}
		});
	}
}

function restore() {
	if (!fs.existsSync(config.backupDir + "/current.txt")) {
		console.log("There is no file called 'current.txt' in the backup folder. No Backup Loaded!");
		return;
	}

	var backupData = fs.readFileSync(config.backupDir + "/current.txt", 'utf8').split("\n\n\n\n\n\n\n\n\n\n\n\n");
	songs = JSON.parse(backupData[0]);
	songArchive = JSON.parse(backupData[1]);
	users = JSON.parse(backupData[2]);
	console.log("Restored Configuration in Backup File!");
}

////////////////////////////
//Main Code
////////////////////////////
if (!fs.existsSync(config.artworkCache)) {
    console.log("The Artwork Cache Directory Does Not Exist!");
		process.exit(1);
}

if (!fs.existsSync(config.backupDir)) {
		console.log("The Backup Directory Does Not Exist!");
		process.exit(1);
}

var cleanup = require('./cleanup.js').Cleanup(function() { //Stop Shutting Down From No Backup Dir Activitng This
	console.log("Music Suggestions Is Shutting Down!");
	backup(true);
});

restore();
setInterval(function() {
	backup(false);
}, config.backupTimeout * 60000);

setInterval(function() {
	console.log("Reauthenticating With The Spotify API!");
	opn("http://" + config.url + ":" + config.httpPort + "/auth");
}, config.spotifyReauthTimeout * 60000);

expressAuth();
socketIO();
expressRoutes();
dnsServer();

var subdomains = express.Router();
subdomains.get('*', function (req, res) {
  res.redirect("http://" + config.url + ":" + config.httpPort + "/");
});
app.use(subdomain('*', subdomains));
if (config.https) {
  var httpsServer = https.createServer(credentials, app);
  var httpServer = require('http').createServer(app);
  httpServer.listen(config.httpPort);
  httpsServer.listen(config.httpsPort);
	io.attach(httpServer);
	io.attach(httpsServer);
  console.log("The Webserver Has Been Started On HTTP (" + config.httpPort + ") and HTTPS (" + config.httpsPort + ")!");
} else {
  var httpServer = require('http').createServer(app);
  httpServer.listen(config.httpPort);
	io.attach(httpServer);
  console.log("The Webserver Has Been Started On HTTP (" + config.httpPort + ")!");
}

opn("http://" + config.url + ":" + config.httpPort + "/auth");

////////////////////////////
//Load From Playlist Area
////////////////////////////
setTimeout(function() {
	//loadPlaylist("spotify", "37i9dQZEVXbsXgZz9DGVKA");
}, 8000);

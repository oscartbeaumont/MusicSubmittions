const SpotifyWebApi = require('spotify-web-api-node');

module.exports = (app, db, config, io, spotifyApi) => {


  // Search For Track By Title and Artist (Used By The Submittion Page)
  app.post("/api/search", async (req, res) => {
    if(req.body == null || req.body.name == null || req.body.artist == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else {
      return res.json(await spotifyApi.search(req.body.name, req.body.artist));
    }
  });



  // Submit a New Track To The Board (Used By The Submittion Page)
  app.post("/api/music", async(req, res) => {
    if(req.body == null || req.body.id == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else {
      let song = db.get('music').find({ id: req.body.id });
      if(song.value() != null) {
        song.update("votes", n => n + 1).write();
        return res.status(200).send();;
      } else {
        let track = await spotifyApi.getTrack(req.body.id);

        if(track != null) {
          var artists = track.artists.map((elem) => elem.name).join(", ");
          db.get('music')
            .push({
              id: track.uri.split(":")[2],
              name: track.name,
              artists: artists,
              albumArtUrl: track.album.images[0].url,
              explicit: track.explicit,
              votes: 0,
              voteChange: { time: Date.now(), direction: "" },
              voters: {}
            })
            .write() // Add The Track to The Database
          return res.status(200).send();
        } else {
          return res.status(460).send("No Track Was Found!");
        }
      }
    }
  });



  // Vote Up A Track On The Board (Used By The Index Page)
  app.post("/api/upvote", (req, res) => {
    if(req.body == null || req.body.id == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else {
      if(req.session.saveMe != true) { req.session.saveMe = true; }
      let song = db.get('music').find({ id: req.body.id });
      let previousVote = song.value().voters[req.sessionID];
      if(previousVote != null && !req.session.admin) {
        if(previousVote == "upvoted") {
          return res.status(230).send(); // Already Been Upvoted Skipping
        } else {
          song
            .update("votes", n => n + 2) // Cancel The Previous Downvote And Up Vote
            .set('voteChange', { time: Date.now(), direction: "upvoted" }) //Update The Last Voted Time & Direction
            .get('voters').set(req.sessionID, "upvoted").write(); // Log That The User Votted
        }
      } else {
        song
          .update("votes", n => n + 1) // Up Vote
          .set('voteChange', { time: Date.now(), direction: "upvoted" }) //Update The Last Voted Time & Direction
          .get('voters').set(req.sessionID, "upvoted").write(); // Log That The User Votted
      }
      io.sockets.emit('update', { music: db.get('music').value() });
      return res.status(200).send();
    }
  });



  // Vote Up A Track On The Board (Used By The Index Page)
  app.post("/api/downvote", (req, res) => {
    if(req.body == null || req.body.id == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else {
      if(req.session.saveMe != true) { req.session.saveMe = true; }
      let song = db.get('music').find({ id: req.body.id });
      let previousVote = song.value().voters[req.sessionID];
      if(previousVote != null) {
        if(previousVote == "downvoted" && !req.session.admin) {
          return res.status(230).send(); // Already Been Upvoted Skipping
        } else {
          song
            .update("votes", n => n - 2) // Cancel The Previous Upvote And Down Vote
            .set('voteChange', { time: Date.now(), direction: "downvoted" }) //Update The Last Voted Time & Direction
            .get('voters').set(req.sessionID, "downvoted").write(); // Log That The User Votted
        }
      } else {
        song
          .update("votes", n => n - 1) // Down Vote
          .set('voteChange', { time: Date.now(), direction: "downvoted" }) //Update The Last Voted Time & Direction
          .get('voters').set(req.sessionID, "downvoted").write(); // Log That The User Votted
      }
      io.sockets.emit('update', { music: db.get('music').value() });
      return res.status(200).send();
    }
  });



  /////////////////////////////////////////////////
  ////////////////// Admin Areas ///////////////////
  /////////////////////////////////////////////////
  const spotifyOptions = {
    clientId: config.spotify.id,
    clientSecret: config.spotify.secret,
    redirectUri: config.spotify.callback + "/spotify/callback"
  };

  let spotifyUserAPI = {}; //List Of Spotify API Creds For Playlist Loading/Saving



  // Remove A Song (Used By The Index Page)
  app.post("/api/remove", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }

    if(req.body == null || req.body.id == null) {
      res.status(400).send("The Request Body From The Client Is Malformed!");
    } else {
      db.get('music').remove({ id: req.body.id }).write();
      io.sockets.emit('update', { music: db.get('music').value() });
      res.status(200).send();
    }
  });



  // Login To The Spotify User API View
  app.get("/spotify/auth", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }

    spotifyUserAPI[req.session.id] = new SpotifyWebApi(spotifyOptions);
    res.redirect(spotifyUserAPI[req.session.id].createAuthorizeURL([ "playlist-read-collaborative", "playlist-modify-public", "playlist-read-private", "playlist-modify-private" ], ""));
  });



  // The Link Spotify Redirect To Whch Handles The Authentication With The Users Token
  app.get("/spotify/callback", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }
    if(spotifyUserAPI[req.session.id] == null) {
      return res.status(401).send("Please Try Authentication Again. An Error Occurred.");
    }

    spotifyUserAPI[req.session.id].authorizationCodeGrant(req.query.code)
      .then((data) => {
        // Set the access token on the API object to use it in later calls
        spotifyUserAPI[req.session.id].setAccessToken(data.body['access_token']);
        spotifyUserAPI[req.session.id].setRefreshToken(data.body['refresh_token']);

        setTimeout(() => {
          spotifyUserAPI[req.session.id] = null;
        }, 20 * 60 * 1000); // Logout After 20 Minutes And Require It To Be Reactivated

        // Redirect To The View
        res.redirect("/playlist-manager");
      }).catch((err) => {
        console.error("Error Talking To The Spotify User API", err);
        res.status(500).send("Error Talking To The Spotify User API");
      });
  });



  // Get The Users Spotify Details (Used By The PLaylist Manager View)
  app.get("/spotify/user", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }
    if(spotifyUserAPI[req.session.id] == null) {
      return res.status(401).send("You Must Connect Your Spotify Account To Access This.");
    }

    spotifyUserAPI[req.session.id].getMe()
      .then((data) =>{
        res.send(data.body);
      }).catch((err) => {
        console.error("Error Talking To The Spotify User API", err);
        res.status(500).send("Error Talking To The Spotify User API");
      });
  });



  // Imports The Songs In A Playlist To The Board (Used By The PLaylist Manager View)
  app.post("/api/playlist/import", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }

    if(req.body == null || req.body.uri == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else if(spotifyUserAPI[req.session.id] == null) {
      return res.status(401).send("You Must Connect Your Spotify Account To Access This.");
    } else {
      if(req.body.uri != null && req.body.uri != "" && req.body.uri.split(":").length == 5) {
        let playlist_id = req.body.uri.split(":");

        spotifyUserAPI[req.session.id].getPlaylist(playlist_id[2], playlist_id[4])
          .then((data) => {
            let iterations = Math.ceil(data.body.tracks.total / 100);
            for (var i = 0; i < iterations; i++) {
              spotifyUserAPI[req.session.id].getPlaylistTracks(playlist_id[2], playlist_id[4], { offset: i * 100 })
                .then((data) => {
                  for (var i = 0; i < data.body.items.length; i++) {
                    let id = data.body.items[i].track.uri.split(":")[2];
                    let _db = db.get('music');

                    if(_db.find({ id: id }).value() == null) {
                      var artists = data.body.items[i].track.artists.map((elem) => elem.name).join(", ");
                      _db.push({
                        id: id,
                        name: data.body.items[i].track.name,
                        artists: artists,
                        albumArtUrl: data.body.items[i].track.album.images[0].url,
                        explicit: data.body.items[i].track.explicit,
                        votes: 0,
                        voteChange: { time: Date.now(), direction: "" },
                        voters: {}
                      })
                      .write()
                    }
                  }
                }).catch((err) => {
                  console.error("Error Importing A Playlist:");
                  console.error(err);
                  res.status(500).send("Error Talking To The Spotify User API");
                });
            }
            console.log("Imported The Playlist " + playlist_id[2] + "   " + playlist_id[4]);
            io.sockets.emit('update', { music: db.get('music').value() });
            res.status(200).send();
          })
          .catch((err) => {
            console.error("Error Importing A Playlist:");
        		console.error(err);
            res.status(500).send("Error Talking To The Spotify User API");
          });
      }
    }
  });



  // Exports The Songs On The Board To A Playlist (Used By The PLaylist Manager View)
  app.post("/api/playlist/export", (req, res) => {
    if(!req.session.admin) { // Check Admin Authentication
      return res.status(401).redirect("/");
    }

    if(req.body == null || req.body.uri == null) {
      return res.status(400).send("The Request Body From The Client Is Malformed!");
    } else if(spotifyUserAPI[req.session.id] == null) {
      return res.status(401).send("You Must Connect Your Spotify Account To Access This.");
    } else {
      if(req.body.uri != null && req.body.uri != "" && req.body.uri.split(":").length == 5) {
        let playlist_id = req.body.uri.split(":");
        let _db = db.get('music').value();
        let musicToImport = _db.map((e) => "spotify:track:" + e.id);
        let iterations = Math.ceil(musicToImport.length / 100);
        for (var i = 0; i < iterations; i++) {
          spotifyUserAPI[req.session.id].addTracksToPlaylist(playlist_id[2], playlist_id[4], musicToImport.slice(i * 100, (i * 100) + 100))
            .catch((err) =>{
              console.error('Something Went Wrong Exporting To The PLaylist!', err);
              res.status(500).send("Error Talking To The Spotify User API");
            });
        }
        console.log("Exported The Playlist " + playlist_id[2] + "   " + playlist_id[4]);
        io.sockets.emit('update', { music: db.get('music').value() });
        res.status(200).send();
      }
    }
  });

  return this;
}

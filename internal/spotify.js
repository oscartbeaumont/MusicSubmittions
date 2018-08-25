const SpotifyWebApi = require('spotify-web-api-node');

module.exports = (id, secret) => {
  exports.api = new SpotifyWebApi({
    clientId: id,
    clientSecret: secret,
  });

  exports.authenticate();

  return this;
}


exports.authenticate = () => {
  exports.api.clientCredentialsGrant()
    .then((data) => {
      console.log("Authenticated With The Spotify API!");
      exports.api.setAccessToken(data.body['access_token']);
    })
    .catch((err) => {
      console.log('Something went wrong when retrieving an access token', err);
    });
}



exports.search = async (title, artist, internal) => {
  let query = "";
  if(title != null && title != "") {
    query += 'track:' + title;
  }
  if(artist != null && artist != "") {
    if(query != '') { query += " "; }
    query += 'artist:' + artist;
  }

  if(query == '') {
    return {};
  }

  return exports.api.searchTracks(query)
    .then(async (results) => {
      if(internal) {
        return results.body.tracks.items;
      } else if(results.body.tracks.items != 0 && !internal) {
        return results.body.tracks.items;
      } else {
        return await exports.search(title, null, true);
      }
    }).catch((err) => {
      console.error(err);
    });
};



exports.getTrack = (track_id) => {
  if(track_id != null) {
    return exports.api.getTrack(track_id)
      .then((results) => {
        return results.body;
      }).catch((err) => {
        console.error(err);
      });
  }
}

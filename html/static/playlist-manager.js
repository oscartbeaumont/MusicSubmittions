const app = new Vue({
  el: "#app",
  data: {
    user: null,
    statusText: "",
    spotifyUri: ""
  },
  methods: {
    importPlaylist: function() {
      fetch("/api/playlist/import", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uri: this.spotifyUri,
          })
        })
        .then(res => {
          if(res.status === 200) {
            this.statusText = "Finished The Import!";
            setTimeout(() => {
              this.statusText = "";
            }, 3000);
          } else {
            console.error("Error: Importing The Songs From A PLaylist!");
            console.error("Returned The Status Code: " + res.status);
            console.error("And The Body: ", res.body);
            alert("Error Importing The Songs From A PLaylist. Maybe Try Reloading The Page!");
          }
        }).catch(() => {
          console.error("Error: Importing The Songs From A PLaylist! Using Endpoint '/api/playlist/import'");
          console.error(err);
          alert("Error Importing The Songs From A PLaylist. Maybe Try Reloading The Page!");
        });
    },
    exportPlaylist: function() {
      fetch("/api/playlist/export", {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uri: this.spotifyUri,
          })
        })
        .then(res => {
          if(res.status === 200) {
            this.statusText = "Finished The Export!";
            setTimeout(() => {
              this.statusText = "";
            }, 3000);
          } else {
            console.error("Error: Exporting The Songs To A PLaylist!");
            console.error("Returned The Status Code: " + res.status);
            console.error("And The Body: ", res.body);
            alert("Error Exporting The Songs To A PLaylist. Maybe Try Reloading The Page!");
          }
        }).catch(() => {
          console.error("Error: Exporting The Songs To A PLaylist! Using Endpoint '/api/playlist/export'");
          console.error(err);
          alert("Error Exporting The Songs To A PLaylist. Maybe Try Reloading The Page!");
        });
    }
  },
  created() {
    fetch("/spotify/user")
      .then(async (res) => {
        if(res.status === 200) {
          let json = (await res.json());
          if(json.display_name == null) {
            this.user = {
              name: json.id,
              img: json.images[0].url
            }
          } else {
            this.user = {
              name: json.display_name,
              img: json.images[0].url
            }
          }
        } else if(res.status === 401) {
          console.log("Tried To Get Spotify User Details Without Being Logged In.");
        } else {
          console.error("Error: Fetching The Users Spotify Information!");
          console.error("Returned The Status Code: " + res.status);
          console.error("And The Body: ", res.body);
          alert("Error Getting Your Spotify Details. Maybe Try Reloading The Page!");
        }
      }).catch(() => {
        console.error("Error: Fetching The Users Spotify Information! Using Endpoint '/spotify/user'");
        console.error(err);
        alert("Error Getting Your Spotify Details. Maybe Try Reloading The Page!");
      });
  },
});

const app = new Vue({
  el: "#app",
  data: {
    sessionCount: 0,
    admin: false,
    socket: {},
    music: []
  },
  computed: {
    orderedMusic: function () {
      return this.music.sort((a, b) => {
          var n = b.votes - a.votes;
          if (n !== 0) {
              return n;
          }
          
          if(b.voteChange.direction == "downvoted") {
            return b.voteChange.time - a.voteChange.time;
          } else {
            return a.voteChange.time - b.voteChange.time;
          }
      });
    }
  },
  methods: {
    upVote: function (event) {
      if(event && event.currentTarget) {
        let button = event.currentTarget;
        button.disabled = true;
        // Show The Loading Spinner
        let logo = event.currentTarget.getElementsByClassName("logo")[0];
        let spinner = event.currentTarget.getElementsByClassName("fa-spinner")[0];
        if(logo != null && spinner != null) {
          logo.style.display = "none";
          spinner.style.display = "inline-block";
        } else {
          console.error("UI Design Error For Voting Feedback!");
          return;
        }

        // Talk To The API
        fetch("/api/upvote", {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: event.currentTarget.name,
            })
          })
          .then((res) => {
            if (res.status == 230) {
              console.log("Already Upvoted! So You Can't Again");

              button.disabled = false;
              //Hide The Spinner
              logo.style.display = "inline-block";
              spinner.style.display = "none";
            } else if (res.status != 200) {
              console.error("Error Up Voting");
              console.error("Returned The Status Code: " + res.status);
              console.error("And The Body: ", res.body);
              alert("Error Liking The Song. Maybe Try Reloading The Page!");
            } else {
              console.log("Up Voted A Song");
              button.disabled = false;
              //Hide The Spinner
              logo.style.display = "inline-block";
              spinner.style.display = "none";
            }
          }).catch((err) => {
            console.error("Error: Up Voting A Song! Using Endpoint '/api/upvote'");
            console.error(err);
            alert("Error Liking The Song. Maybe Try Reloading The Page!");
          });
      }
    },


    downVote: function (event) {
      if(event && event.currentTarget) {
        let button = event.currentTarget;
        button.disabled = true;
        // Show The Loading Spinner
        let logo = event.currentTarget.getElementsByClassName("logo")[0];
        let spinner = event.currentTarget.getElementsByClassName("fa-spinner")[0];
        if(logo != null && spinner != null) {
          logo.style.display = "none";
          spinner.style.display = "inline-block";
        } else {
          console.error("UI Design Error For Voting Feedback!");
          return;
        }

        // Talk To The API
        fetch("/api/downvote", {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: event.currentTarget.name,
            })
          })
          .then((res) => {
            if (res.status == 230) {
              console.log("Already Downvoted! So You Can't Again");
              button.disabled = false;
              //Hide The Spinner
              logo.style.display = "inline-block";
              spinner.style.display = "none";
            } else if (res.status != 200) {
              console.error("Error Down Voting");
              console.error("Returned The Status Code: " + res.status);
              console.error("And The Body: ", res.body);
              alert("Error Disliking The Song. Maybe Try Reloading The Page!");
            } else {
              console.log("Down Voted A Song");
              button.disabled = false;
              //Hide The Spinner
              logo.style.display = "inline-block";
              spinner.style.display = "none";
            }
          }).catch((err) => {
            console.error("Error: Down Voting A Song! Using Endpoint '/api/downvote'");
            console.error(err);
            alert("Error Disliking The Song. Maybe Try Reloading The Page!");
          });
      }
    },


    removeSong: function (event) {
      if(event && event.currentTarget) {
        // Show The Loading Spinner
        let logo = event.currentTarget.getElementsByClassName("logo")[0];
        let spinner = event.currentTarget.getElementsByClassName("fa-spinner")[0];
        if(logo != null && spinner != null) {
          logo.style.display = "none";
          spinner.style.display = "inline-block";
        } else {
          console.error("UI Design Error For Removing A Song Feedback!");
          return;
        }

        // Talk To The API
        fetch("/api/remove", {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: event.currentTarget.name,
            })
          })
          .then((res) => {
            if (res.status == 200) {
              console.log("Removed A Song");
              //Hide The Spinner
              logo.style.display = "inline-block";
              spinner.style.display = "none";
            } else {
              console.error("Error Removing A Song");
              console.error("Returned The Status Code: " + res.status);
              console.error("And The Body: ", res.body);
              alert("Error Removing The Song. Maybe Try Reloading The Page!");
            }
          }).catch((err) => {
            console.error("Error: Removing A Song! Using Endpoint '/api/remove'");
            console.error(err);
            alert("Error Removing The Song. Maybe Try Reloading The Page!");
          });
      }
    },
  },
  created() {
    this.socket = io.connect();

    this.socket.on("startup", (data) => {
  		this.music = data.music;
      this.admin = data.admin;
  	});

    this.socket.on("update", (data) => {
  		this.music = data.music;
  	});

    this.socket.on("sessionCountUpdate", (data) => {
  		this.sessionCount = data;
  	});

    this.socket.on('disconnect', () => {
      setTimeout(() => {
        this.socket.open();
      }, 5000);
    });
  },
  beforeDestroy() {
    this.socket.close();
  }
});

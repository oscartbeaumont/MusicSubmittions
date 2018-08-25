const app = new Vue({
  el: "#app",
  data: {
    loading: true,
    selectPage: false,
    songName: "", //The Form Data
    artist: "", //The Form Data
    errorMsg: "", //Connected To The UI
    searchResults: [] // Connected To The UI
  },
  methods: {
    lookupSong: async function() {
      this.loading = true;
      this.errorMsg = "";

      if(!(this.songName == "" && this.artist == "")) {
        fetch("/api/search", {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: this.songName,
              artist: this.artist
            })
          })
          .then(async (res) => {
            if(res.status === 200) {
              let json = await res.json();

              if(json.length != 0) {
                this.searchResults = json;
                this.selectPage = true;
                this.errorMsg = "";
                this.loading = false;
              } else {
                this.selectPage = false;
                this.errorMsg = "No Songs Where Found From That Search";
                this.loading = false;
              }
            } else {
              console.error("Error: Searching For Music! Using endpoint '/api/search'");
              console.error("Returned The Status Code: " + res.status);
              console.error("And The Body: ", res.body);
              this.errorMsg = "An Error Occurred, Please Try Again!";
              this.loading = false;
            }
          }).catch((err) => {
            console.error("Error: Searching For Music! Using endpoint '/api/search'");
            console.error(err);
            this.errorMsg = "An Error Occurred, Please Try Again!";
            this.loading = false;
          });
      } else {
        this.errorMsg = "Please Specify Something To Search!";
        this.loading = false;
      }
    },
    searchSong: function(event) {
      if(event) {
        this.selectPage = false;
        this.searchResults = [];
        this.loading = true;
        this.errorMsg = "";
        fetch("/api/music", {
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
            if(res.status === 200) {
              location.href = '/';
            } else if(res.status === 460) {
              this.selectPage = false;
              this.errorMsg = "An Error Adding The Song. It Couldn't Be Found";
              this.loading = false;
            } else {
              console.error("Error: Adding A Song! Using endpoint '/api/music'");
              console.error("Returned The Status Code: " + res.status);
              console.error("And The Body: ", res.body);
              this.errorMsg = "An Error Occurred, Please Try Again!";
              this.loading = false;
            }
          }).catch((err) => {
            console.error("Error: Adding A Song! Using endpoint '/api/music'");
            console.error(err);
            this.errorMsg = "An Error Occurred, Please Try Again!";
            this.loading = false;
          });
      }
    },
  },
  created() {
    this.loading = false;
  },
});

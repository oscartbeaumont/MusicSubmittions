function newSong(songData) {
  var container = document.createElement("tr");
  var innerContainer = document.createElement("th");
  var row = document.createElement("div");
  row.className += "row";

  var data = document.createElement("div");
  data.className += "col-sm-12, col-md-11";

  var artWork = document.createElement("img");
  artWork.src = songData.albumArt;
  artWork.style.width = "100px";
  artWork.style.height = "100px";
  artWork.style.float = "left";
  artWork.style.marginRight = "10px";
  artWork.display = "inline";

  var title = document.createElement("h2");
  title.innerHTML = songData.name;
  title.style.fontFamily = "'Montserrat', sans-serif";
  title.style.fontWeight = "bold";

  var artist = document.createElement("h2");
  artist.innerHTML = songData.artists;
  artist.style.fontFamily = "'Montserrat', sans-serif";

  data.append(artWork);
  data.append(title);
  data.append(artist);

  var buttonContainer = document.createElement("div");
  buttonContainer.className += "col-sm-12, col-md-12";
  buttonContainer.style.marginTop = "10px";

  var button = document.createElement("button");
  button.type = "button";
  button.className += "btn btn-success btn-lg";
  button.innerHTML = "Select This Song!";

  var stage2 = false;
  button.onclick = function() {
    if (stage2 != true) {
      stage2 = true

      var spinner = document.createElement("i");
      spinner.className += "fa fa-spinner fa-spin";
      button.append(spinner);
      button.insertBefore(spinner, button.firstChild);

      var saveData = $.ajax({
            type: 'POST',
            url: "/submit/stage2.php",
            data: { songName: $(".login-form").find('input[name="songName"]').val(), artist: $(".login-form").find('input[name="artist"]').val(), index: songData.index },
            dataType: "text",
            success: function(data) {
              if (data.startsWith("redirect_client:")) {
                 window.location.href = data.replace("redirect_client:", "");
              }
            }
      });
    }
  }

  buttonContainer.append(button);
  row.append(data);
  row.append(buttonContainer);
  innerContainer.append(row);
  container.append(innerContainer);

  return container;
}

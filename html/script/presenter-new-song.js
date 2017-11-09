function newSong(_name, _artists, _albumArt, _rank) {
  var container = document.createElement("tr");
  var innerContainer = document.createElement("th");
  var row = document.createElement("div");
  row.className += "row";

  var data = document.createElement("div");
  data.className += "col-sm-12, col-md-11";

  var rank = document.createElement("h3");
  rank.style.display = "inline";
  rank.innerHTML = _rank + 1;

  var artWork = document.createElement("img");
  artWork.src = _albumArt;
  artWork.style.width = "100px";
  artWork.style.height = "100px";
  artWork.style.float = "left";
  artWork.style.marginRight = "10px";
  artWork.display = "inline";

  var title = document.createElement("h2");
  title.innerHTML = _name;
  title.style.fontFamily = "'Montserrat', sans-serif";
  title.style.fontWeight = "bold";

  var artist = document.createElement("h2");
  artist.innerHTML = _artists;
  artist.style.fontFamily = "'Montserrat', sans-serif";

  data.append(rank);
  data.append(artWork);
  data.append(title);
  data.append(artist);

  var buttonContainer = document.createElement("div");
  buttonContainer.className += "col-sm-12, col-md-12";
  buttonContainer.style.marginTop = "10px";

  row.append(data);
  row.append(buttonContainer);
  innerContainer.append(row);
  container.append(innerContainer);

  return container;
}

function newSong(_name, _artists, _albumArt, _rank, _votes, _explicit) {
  var container = document.createElement("tr");
  var innerContainer = document.createElement("th");
  var row = document.createElement("div");
  row.className += "row";

  var data = document.createElement("div");
  data.className += "col-sm-12, col-md-11";

  var rank = document.createElement("h3");
  rank.style.display = "inline";
  rank.innerHTML = "Rank: " + _rank + 1 + ", Votes: " + _votes;
  rank.style.fontSize = "1.3em";

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

  var like = document.createElement("button");
  like.type = "button";
  like.className += "btn btn-success btn-lg";
  var likeIcon = document.createElement("i");
  likeIcon.className += "fa fa-thumbs-up";
  likeIcon.setAttribute("aria-hidden", "true");

  var likeText = document.createElement("span");
  likeText.innerHTML = " Like"

  like.append(likeIcon);
  like.append(likeText);
  like.onclick = function() {
    socket.emit('admin-upvote', _name + "\n\n\n\n" + _artists);
  }

  var dislike = document.createElement("button");
  dislike.type = "button";
  dislike.className += "btn btn-danger btn-lg btn-dislike";
  var dislikeIcon = document.createElement("i");
  dislikeIcon.className += "fa fa-thumbs-down";
  dislikeIcon.setAttribute("aria-hidden", "true");

  var dislikeText = document.createElement("span");
  dislikeText.innerHTML = " Dislike"

  dislike.append(dislikeIcon);
  dislike.append(dislikeText);
  dislike.onclick = function() {
    socket.emit('admin-downvote', _name + "\n\n\n\n" + _artists);
  }

  var playlistOne = document.createElement("button");
  playlistOne.type = "button";
  playlistOne.className += "btn btn-info btn-lg btn-dislike";
  playlistOne.innerHTML = " Playlist 1"
  playlistOne.onclick = function() {
    socket.emit('admin-playlist1', _name + "\n\n\n\n" + _artists);
  }

  var playlistTwo = document.createElement("button");
  playlistTwo.type = "button";
  playlistTwo.className += "btn btn-info btn-lg btn-dislike";
  playlistTwo.innerHTML = " Playlist 2"
  playlistTwo.onclick = function() {
    socket.emit('admin-playlist2', _name + "\n\n\n\n" + _artists);
  }

  var remove = document.createElement("button");
  remove.type = "button";
  remove.className += "btn btn-danger btn-lg btn-dislike";
  var removeIcon = document.createElement("i");
  removeIcon.className += "fa fa-times";
  removeIcon.setAttribute("aria-hidden", "true");
  var removeText = document.createElement("span");
  removeText.innerHTML = " Remove"
  remove.append(removeIcon);
  remove.append(removeText);
  remove.onclick = function() {
    socket.emit('admin-remove', _name + "\n\n\n\n" + _artists);
  }

  buttonContainer.append(like);
  buttonContainer.append(dislike);
  buttonContainer.append(playlistOne);
  buttonContainer.append(playlistTwo);
  buttonContainer.append(remove);

  if (_explicit) {
    var explicit = document.createElement("button");
    explicit.type = "button";
    explicit.className += "btn btn-danger btn-lg btn-dislike";
    var explicitIcon = document.createElement("i");
    explicitIcon.className += "fa fa-exclamation-triangle";
    explicitIcon.setAttribute("aria-hidden", "true");
    explicit.append(explicitIcon);
    buttonContainer.append(explicit);
  }

  row.append(data);
  row.append(buttonContainer);
  innerContainer.append(row);
  container.append(innerContainer);

  return container;
}

function newSong(_name, _artists, _albumArt, _rank, _votes) {
  var container = document.createElement("tr");
  var innerContainer = document.createElement("th");
  var row = document.createElement("div");
  row.className += "row";

  var data = document.createElement("div");
  data.className += "col-sm-12, col-md-11";

  var rank = document.createElement("h3");
  rank.style.display = "inline";
  rank.innerHTML = "Rank: " + (_rank + 1) + ", Votes: " + _votes;
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
  title.style.fontSize = "1.7em";

  var artist = document.createElement("h2");
  artist.innerHTML = _artists;
  artist.style.fontFamily = "'Montserrat', sans-serif";
  artist.style.fontSize = "1.5em";

  data.append(rank);
  data.append(artWork);
  data.append(title);
  data.append(artist);

  var buttonContainer = document.createElement("div");
  buttonContainer.className += "col-sm-12, col-md-12";
  buttonContainer.style.marginTop = "10px";

  var like = document.createElement("button");
  like.type = "button";
  like.className += "btn btn-success btn-lg upvote";
  like.setAttribute("name", _name);
  like.setAttribute("artists", _artists);
  var likeIcon = document.createElement("i");
  likeIcon.className += "fa fa-thumbs-up";
  likeIcon.setAttribute("aria-hidden", "true");

  var likeText = document.createElement("span");
  likeText.innerHTML = " Like"

  like.append(likeIcon);
  like.append(likeText);
  like.onclick = function() {
    if (!like.classList.contains("disabled")) {
      upvotes.push(_name + "\n\n\n\n" + _artists);
      var index = downvotes.indexOf(_name + "\n\n\n\n" + _artists);
      if (index !== -1) {
        downvotes.splice(index, 1);
      }
      socket.emit('upvote', _name + "\n\n\n\n" + _artists);
      updateVotes();
    }
  }

  var dislike = document.createElement("button");
  dislike.type = "button";
  dislike.className += "btn btn-danger btn-lg btn-dislike downvote";
  dislike.setAttribute("name", _name);
  dislike.setAttribute("artists", _artists);
  var dislikeIcon = document.createElement("i");
  dislikeIcon.className += "fa fa-thumbs-down";
  dislikeIcon.setAttribute("aria-hidden", "true");

  var dislikeText = document.createElement("span");
  dislikeText.innerHTML = " Dislike"

  dislike.append(dislikeIcon);
  dislike.append(dislikeText);
  dislike.onclick = function() {
    if (!dislike.classList.contains("disabled")) {
      downvotes.push(_name + "\n\n\n\n" + _artists);
      var index = upvotes.indexOf(_name + "\n\n\n\n" + _artists);
      if (index !== -1) {
        upvotes.splice(index, 1);
      }
      socket.emit('downvote', _name + "\n\n\n\n" + _artists);
      updateVotes();
    }
  }

  var vottingFeedback = document.createElement("h3");
  vottingFeedback.style.display = "none";
  vottingFeedback.style.color = "green";
  vottingFeedback.style.paddingLeft = "10px";

  buttonContainer.append(like);
  buttonContainer.append(dislike);
  buttonContainer.append(vottingFeedback);
  row.append(data);
  row.append(buttonContainer);
  innerContainer.append(row);
  container.append(innerContainer);

  return container;
}

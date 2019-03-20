function loadf(url, callback, timeout = null, timeoutCallback = null) {
  var xhttp = new XMLHttpRequest();
  xhttp._callback = callback;
  xhttp.onreadystatechange = function() {
    if(this.readyState == 4) {
      this._callback();
    }
  };
  if(timeout != null) {
    xhttp.timeout = timeout;
  }
  if(timeoutCallback != null) {
    xhttp.ontimeout = timeoutCallback;
  }
  xhttp.open("GET", url);
  xhttp.send();
}


function serializeGame() {
  return {
    "map": map.serialize(),
    "player": player.serialize()
  };
}

function deserializeGame(d) {
  map = Map.deserialize(d.map);
  player = Player.deserialize(d.player);
  player.map = map;
  if(typeof hud != "undefined") {
    hud.map = map;
    hud.player = player;
  }
}

function exportGame() {
  var data = JSON.stringify(serializeGame());
  var a = document.createElement("a");
  a.href = "data:application/x-octet-stream;base64," + btoa(data);
  a.download = "game.json";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

var _importGame_callback;
function importGame(callback=undefined) {
  _importGame_callback = callback;
  var fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.onchange = importGameFile;
  fileInput.style.display = "none";
  
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function importGameFile(e) {
  var files = e.target.files;
  if(files.length) {
    var file = files[0];
    var reader = new FileReader();
    
    reader.onloadend = function(e) {
      if(e.target.readyState == FileReader.DONE) {
        try {
          var data = JSON.parse(e.target.result);
          deserializeGame(data);
          if(_importGame_callback != undefined) { _importGame_callback(); }
        } catch(e) {
          //TODO error message
        }
      }
    };

    reader.readAsText(file);
  }
}

function importGameURL(url) {
  loadf(url, function() {
    deserializeGame(JSON.parse(this.responseText));
  });
}

function resetTime() {
  if(typeof timeline != "undefined") {
    timeline = [];
    timelineOffset = performance.now();
  }
}

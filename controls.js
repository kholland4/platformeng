var controlState = {"up": false, "down": false, "left": false, "right": false, "jump": false};
var keyMapping = {
  87: "up", 83: "down", 65: "left", 68: "right", //WASD
  38: "up", 40: "down", 37: "left", 39: "right", //arrow keys
  32: "jump",
  16: "timetravel"
};

function initControls() {
  document.addEventListener("keydown", function(e) {
    if(e.keyCode in keyMapping) {
      controlState[keyMapping[e.keyCode]] = true;
    }
  });
  document.addEventListener("keyup", function(e) {
    if(e.keyCode in keyMapping) {
      controlState[keyMapping[e.keyCode]] = false;
    }
  });
}

function getControls() {
  controlState.any = false;
  var val = false;
  for(var key in controlState) {
    val |= controlState[key];
  }
  controlState.any = val;
  return controlState;
}

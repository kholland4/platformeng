var levelFiles = [
  {name: "Level 1", file: "level1.json"},
  {name: "Level 2", file: "level2.json"},
  {name: "Cancel", file: "null"}
];

function showLevelSelect(el) {
  var bbox = el.getBoundingClientRect();
  var targetX = bbox.left;
  var targetY = bbox.bottom;
  var targetW = bbox.width;
  
  var container = document.createElement("div");
  container.id = "levelSelect";
  container.style.position = "fixed";
  container.style.left = targetX + "px";
  container.style.top = targetY + "px";
  container.style.width = targetW + "px";
  container.style.backgroundColor = "#fff";
  container.style.color = "black";
  
  container.style.fontSize = "14px";
  container.style.fontFamily = "sans-serif";
  
  for(var i = 0; i < levelFiles.length; i++) {
    var data = levelFiles[i];
    var item = document.createElement("div");
    item.style.padding = "5px";
    item.innerText = data.name;
    item.dataset.file = data.file;
    item.onclick = function() {
      hideLevelSelect();
      if(this.dataset.file != "null") {
        importGameURL(this.dataset.file);
        resetTime();
      }
    };
    container.appendChild(item);
  }
  
  document.body.appendChild(container);
}

function hideLevelSelect() {
  var container = document.getElementById("levelSelect");
  document.body.removeChild(container);
}

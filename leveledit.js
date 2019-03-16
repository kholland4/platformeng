var canvas;
var ctx;
var dSize = {"w": 0, "h": 0, "scale": 0.75};
var map;
var player;
var voffset = {"x": 0, "y": 0};

var dragging = false;
var dragTarget = null;
var lastSel = null;
var dragOffset = {"x": 0, "y": 0};
var mouse = {"x": 0, "y": 0};
var smouse = {"x": 0, "y": 0};

function screenToWorld(x, y) {
  x = (x / dSize.scale) + voffset.x;
  y = (y / dSize.scale) + voffset.y;
  return {"x": x, "y": y};
}

function dragStart(e) {
  if(e != undefined) { smouse.x = e.clientX; smouse.y = e.clientY; }
  mouse = screenToWorld(smouse.x, smouse.y);
  
  dragTarget = map.collide(new Box(mouse.x, mouse.y, 1, 1), false);
  if(dragTarget === false) {
    if(player.collide(new Box(mouse.x, mouse.y, 1, 1))) {
      dragTarget = player;
    } else {
      dragTarget = null;
    }
  }
  lastSel = dragTarget;
  
  if(dragTarget != null) {
    var p = dragTarget.getCenter();
    dragOffset.x = p.x - mouse.x;
    dragOffset.y = p.y - mouse.y;
    dragging = true;
  }
  
  showPropsUI();
}
function dragStop(e) {
  dragging = false;
  dragTarget = null;
} 

function dragUpdate(e) {
  if(e != undefined) { smouse.x = e.clientX; smouse.y = e.clientY; }
  mouse = screenToWorld(smouse.x, smouse.y);
  if(dragging && dragTarget != null) {
    dragTarget.setCenter({"x": mouse.x + dragOffset.x, "y": mouse.y + dragOffset.y});
  }
  
  if(document.activeElement == document.body) {
    updatePropsUI();
  }
}

function addObject(obj) {
  mouse = screenToWorld(smouse.x, smouse.y);
  obj.setCenter(mouse);
  map.autoAddObject(obj);
  dragStart();
}

var propsUITarget;
function showPropsUI(obj=lastSel) {
  if(obj == null) { document.getElementById("sidepanel").style.display = "none"; return; }
  
  propsUITarget = obj;
  
  var objName = obj.constructor.name;
  document.getElementById("sp-header").innerText = objName;
  
  var container = document.getElementById("sp-main");
  while(container.firstChild) { container.removeChild(container.firstChild); }
  
  var col1 = document.createElement("div");
  col1.className = "sp-col sp-col1";
  container.appendChild(col1);
  var col2 = document.createElement("div");
  col2.className = "sp-col sp-col2";
  container.appendChild(col2);
  
  for(var key in obj) {
    if(typeof obj[key] == "undefined" || typeof obj[key] == "function" || (typeof obj[key] == "object" && obj[key].constructor.name != "Object")) { continue; }
    if(typeof obj[key] == "object") { continue; } //TODO
    
    var label = document.createElement("div");
    label.className = "sp-col-label";
    label.innerText = key;
    col1.appendChild(label);
    
    var input;
    if(typeof obj[key] != "boolean") {
      input = document.createElement("input");
      input.className = "sp-col-textbox";
      if(typeof obj[key] == "number") { input.type = "number"; } else { input.type = "text"; }
      input.value = obj[key];
    } else {
      input = document.createElement("select");
      input.className = "sp-col-dropdown";
      var opt = document.createElement("option"); opt.value = "true"; opt.innerText = "true"; input.appendChild(opt);
      var opt = document.createElement("option"); opt.value = "false"; opt.innerText = "false"; input.appendChild(opt);
      if(obj[key]) { input.value = "true"; } else { input.value = "false"; }
    }
    
    input.dataset.key = key;
    input.dataset.type = typeof obj[key];
    input.onchange = function() {
      if(this.dataset.type == "string") {
        propsUITarget[this.dataset.key] = String(this.value);
      } else if(this.dataset.type == "number") {
        propsUITarget[this.dataset.key] = parseInt(this.value);
      } else if(this.dataset.type == "boolean") {
        propsUITarget[this.dataset.key] = this.value.toLowerCase() == "true";
      } else {
        propsUITarget[this.dataset.key] = this.value;
      }
    };
    col2.appendChild(input);
  }
  
  var btn = document.createElement("button");
  btn.innerText = "Duplicate";
  btn.onclick = function() {
    if(lastSel != null) {
      addObject(lastSel.constructor.deserialize(lastSel.serialize()));
    }
  };
  container.appendChild(btn);
  
  document.getElementById("sidepanel").style.display = "block";
}
function updatePropsUI(obj=lastSel) {
  if(obj == null) { return; }
  if(obj != propsUITarget) { showPropsUI(obj); return; }
  
  //var objName = obj.constructor.name;
  //document.getElementById("sp-header").innerText = objName;
  
  var container = document.getElementById("sp-main");
  
  var i = 0;
  for(var key in obj) {
    if(typeof obj[key] == "undefined" || typeof obj[key] == "function" || (typeof obj[key] == "object" && obj[key].constructor.name != "Object")) { continue; }
    if(typeof obj[key] == "object") { continue; } //TODO
    
    container.children[1].children[i].value = obj[key];
    i++;
  }
}

function lExportGame() {
  var ospectate = player.spectate;
  var ospeedMul = player.speedMul;
  player.spectate = false;
  player.speedMul = 2;
  exportGame();
  player.spectate = ospectate;
  player.speedMul = ospeedMul;
}

function lImportGame() {
  importGame(function() {
    player.spectate = true;
    player.speedMul = 4;
  });
}

function addCtl(name) {
  if(name == "box") {
    addObject(new Box(0, 0, 300, 50));
  } else if(name == "coin") {
    addObject(new Coin(0, 0));
  } else if(name == "annotation") {
    addObject(new Annotation(0, 0, 100, 100, "image", imgs.unknown));
  }
}

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  
  canvas.addEventListener("mousedown", dragStart);
  canvas.addEventListener("mouseup", dragStop);
  canvas.addEventListener("mousemove", dragUpdate);
  document.addEventListener("keydown", function(e) {
    if(document.activeElement != document.body) { return; }
    if(e.keyCode == 13) {
      if(player.spectate) {
        player.spectate = false;
        player.speedMul = 2;
      } else {
        player.spectate = true;
        player.speedMul = 4;
      }
      player.speed.x = 0;
      player.speed.y = 0;
    } else if(e.key == "b") {
      addCtl("box");
    } else if(e.key == "c") {
      addCtl("coin");
    } else if(e.key == "n") {
      addCtl("annotation");
    }
  });
  
  resize();
  window.addEventListener("resize", resize);
  
  initImgLoader();
  
  //disable WASD - TODO - just disable controls when menu focused
  //delete keyMapping[87]; delete keyMapping[83]; delete keyMapping[65]; delete keyMapping[68];
  initControls();
  map = new Map();
  
  map.background = imgs.bktile;
  
  for(var i = 0; i < 10; i++) {
    map.addBox(new Box(20 + (i * 500), 300 - (i * 150), 300, 50));
  }
  
  player = new Player(map, {speedMul: 4, spectate: true});
  
  animate();
}
document.addEventListener("DOMContentLoaded", init);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dSize.w = window.innerWidth;
  dSize.h = window.innerHeight;
}

var prevTime = performance.now();
var tCounter = 0;
var timelineOffset = 0;

var timeFlow = 1;

function animate() {
  window.requestAnimationFrame(animate);
  
  var time = performance.now();
  var timeDelta = time - prevTime;
  prevTime = time;
  if(timeDelta > 500) {
    timelineOffset += timeDelta - 450;
    timeDelta = 50;
  }
  var timeScale = timeDelta / 1000;
  
  var ttime = time - timelineOffset;
  
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, dSize.w, dSize.h);
  
  voffset.x = player.pos.x - Math.round(dSize.w / 2 / dSize.scale);
  //voffset.y = player.pos.y - Math.round(dSize.h / 2);
  //var target = -Math.round(dSize.h / 2 / dSize.scale);
  var amt = 3;
  if(player.pos.y - (dSize.h / amt / dSize.scale) < voffset.y) {
    voffset.y = player.pos.y - (dSize.h / amt / dSize.scale);
  }
  if(player.pos.y + (dSize.h / amt / dSize.scale) > voffset.y + (dSize.h / dSize.scale)) {
    voffset.y = player.pos.y + (dSize.h * -(1 - (1/amt)) / dSize.scale);
  }
  
  if(timeFlow > 0) {
    timeScale *= timeFlow;
    
    map.animate(ttime, timeScale);
    map.draw(ctx, voffset, dSize.scale);
    
    player.animate(timeScale, getControls());
    player.draw(ctx, voffset, dSize.scale);
    
    //player.coinCount += map.gatherCoins(player);
    //map.interact(player);
  }
  
  if(getControls().any) { dragUpdate(); }
}

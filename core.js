var MODE_UNDO = 0;
var mode = MODE_UNDO;

var canvas;
var ctx;
var dSize = {"w": 0, "h": 0, "scale": 0.75};
var map;
var player;
var hud;
var voffset = {"x": 0, "y": 0};

var timeline = [];

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  
  resize();
  window.addEventListener("resize", resize);
  
  initImgLoader();
  
  initControls();
  map = new Map();
  
  map.background = imgs.bktile;
  
  //---Create map---
  /*map.addBox(new Box(-1500, 500, 300, 50, {animFunc: {y: {range: 200}}}));
  map.addEntity(Entity.fromBox(map.lastBox, 100, 0, Entity.B_PACING));//--------
  map.addBox(new Box(-800, 500, 300, 50, {animFunc: {x: {range: 200}, y: {range: -100}}, bouncy: true}));
  map.addBox(new Box(-2500, 300, 600, 50));
  map.addCoin(Coin.fromBox(map.lastBox, 1, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 2, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 3, 3));
  map.addBox(new Box(-3200, 200, 150, 150, {animFunc: {x: {range: 300}}}));
  map.addBox(new Box(-4350, 300, 600, 50));
  map.addCoin(Coin.fromBox(map.lastBox, 1, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 2, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 3, 3));
  map.addAnnotation(new Annotation(-50, -400, 1000, 500, "image", image("instructions.png"), {autoremove: true}));
  for(var i = 0; i < 10; i++) {
    map.addBox(new Box(20 + (i * 500), 300 - (i * 150), 300, 50));
  }
  map.addAnnotation(new Annotation(5000, -1400, 300, 300, "image", image("instructions2.png")));
  map.addCoin(Coin.fromBox(map.lastBox));
  map.addBox(new Box(1050, -400, 50, 300, {color: "#22ff22", sticky: true}));
  map.addBox(new Box(520, -550, 300, 50));
  map.addBox(new Box(440, -1150, 50, 300, {color: "#22ff22", sticky: true, animFunc: {y: {offset: 500, range: 300}}}));
  map.addBox(new Box(620, -1450, 300, 50));
  map.addCoin(Coin.fromBox(map.lastBox, 1, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 2, 3));
  map.addCoin(Coin.fromBox(map.lastBox, 3, 3));
  
  map.addBox(new Box(-800, -300, 600, 50));
  map.addPortal(new Portal(-750, -490), new Portal(-1000, -1100));
  map.addBox(new Box(-1150, -700, 300, 50));
  //------
  map.addBox(new Box(-5000, 1000, 10000, 50, {tex: imgs.brick, death: true}));*/
  
  player = new Player(map);
  player.pos.x = 20;
  
  hud = new HUD(player, map);
  
  loadf("level1.json", function() {
    try {
      deserializeGame(JSON.parse(this.responseText));
    } catch(e) {}
  });
  
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
  
  //---Time travel control---
  if(getControls().timetravel) {
    timeFlow = -3;
  } else {
    timeFlow = 1;
  }
  
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
    
    map.animate(ttime, timeScale, getControls());
    map.draw(ctx, voffset, dSize.scale);
    
    player.animate(timeScale, getControls());
    player.draw(ctx, voffset, dSize.scale);
    
    player.coinCount += map.gatherCoins(player);
    map.interact(player);
    
    hud.draw(ctx, voffset, dSize.scale);
    
    tCounter += timeScale;
    //if(tCounter >= 0.1) {
      timeline.push(new TimelineState(ttime, player.state, map.state));
      tCounter = 0;
    //}
  } else if(timeFlow < 0) {
    var entry;
    var index = 0;
    for(var i = 0; i < timeline.length - 1; i++) {
      if(timeline[i].time <= ttime && timeline[i + 1].time > ttime) {
        entry = timeline[i];
        index = i;
        break;
      }
    }
    
    if(entry != undefined) {
      player.state = entry.playerData;
      map.state = entry.mapData;
      map.animate(entry.time, 0);
      var tDelta = ttime - entry.time;
      if(tDelta > 0) {
        var numSlices = Math.ceil(tDelta / 120);
        var sliceDelta = tDelta / numSlices;
        for(var i = 0; i < numSlices; i++) {
          map.animate(entry.time + sliceDelta * (i + 1), sliceDelta / 1000);
          player.animate(sliceDelta / 1000);
          map.interact(player);
        }
      }
      
      if(mode == MODE_UNDO) {
        timeline = timeline.slice(0, index + 2);
      }
    }
    
    map.draw(ctx, voffset, dSize.scale);
    player.draw(ctx, voffset, dSize.scale);
    hud.draw(ctx, voffset, dSize.scale);
    
    timelineOffset += timeDelta * timeFlow * -2;
  }
  
  if(timeFlow < 0) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, dSize.w, dSize.h);
    ctx.globalAlpha = 1;
    
    if(ttime < 0) { timelineOffset = time; }
  }
}

class TimelineState {
  constructor(time, playerData, mapData, extra) {
    this.time = time;
    this.playerData = playerData;
    this.mapData = mapData;
    this.extra = extra;
  }
}

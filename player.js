class Player {
  constructor(map, kwargs={}) {
    this.kwarg(kwargs, "speedMul", 2);
    this.kwarg(kwargs, "spectate", false);
    var speedMul = this.speedMul;
    
    this.map = map;
    
    this.pos = {"x": 0, "y": 0, "rot": 0};
    this.speed = {"x": 0, "y": 0, "vy": 0};
    this.maxSpeed = {"x": 250 * speedMul, "y": 250 * speedMul};
    this.accel = {"x": 500 * speedMul, "y": 500 * speedMul};
    this.accelIdle = {"x": 500 * speedMul, "y": 500 * speedMul};

    this.gravity = {"x": 0, "y": 800 * speedMul};
    this.realMaxSpeed = {"x": 500 * speedMul, "y": 500 * speedMul};
    
    this.canJump = false;
    this.jumpSpeed = {"x": 0, "y": -800};
    
    this.drawData = {"radius": 20};
    
    this.coinCount = 0;
  }
  
  set speedMul(speedMul) {
    this._speedMul = speedMul;
    
    this.maxSpeed = {"x": 250 * speedMul, "y": 250 * speedMul};
    this.accel = {"x": 500 * speedMul, "y": 500 * speedMul};
    this.accelIdle = {"x": 500 * speedMul, "y": 500 * speedMul};

    this.gravity = {"x": 0, "y": 800 * speedMul};
    this.realMaxSpeed = {"x": 500 * speedMul, "y": 500 * speedMul};
  }
  
  get speedMul() {
    return this._speedMul;
  }
    
  kwarg(kwargs, name, defaultValue) {
    if(name in kwargs) {
      this[name] = kwargs[name];
    } else {
      this[name] = defaultValue;
    }
  }
  
  animate(timeScale, controls=this.controls) {
    if(controls != undefined) {
      //---Main controls---
      for(var i = 0; i < 2; i++) {
        var d = "x";
        var rd = "x";
        if(i == 1) {
          d = "y";
          rd = "vy";
        }
        
        if((d == "x" && controls.left) || (d == "y" && controls.up)) {
          if(this.speed[rd] > -this.maxSpeed[d]) {
            this.speed[rd] = Math.max(this.speed[rd] - (this.accel[d] * timeScale), -this.maxSpeed[d]);
          }
        } else if((d == "x" && controls.right) || (d == "y" && controls.down)) {
          if(this.speed[rd] < this.maxSpeed[d]) {
            this.speed[rd] = Math.min(this.speed[rd] + (this.accel[d] * timeScale), this.maxSpeed[d]);
          }
        } else {
          if(this.speed[rd] < 0) {
            this.speed[rd] = Math.min(this.speed[rd] + (this.accelIdle[d] * timeScale), 0);
          } else if(this.speed[rd] > 0) {
            this.speed[rd] = Math.max(this.speed[rd] - (this.accelIdle[d] * timeScale), 0);
          }
        }
        
        //---Jumping---
        if(controls.jump && this.canJump) {
          this.canJump = false;
          this.speed.x += this.jumpSpeed.x;
          this.speed.y += this.jumpSpeed.y;
        }
        
        this.controls = controls;
      }
    }
    
    if(this.spectate) {
      //---Contstraints---
      this.speed.x = Math.min(Math.max(this.speed.x, -this.realMaxSpeed.x), this.realMaxSpeed.x);
      this.speed.y = Math.min(Math.max(this.speed.y, -this.realMaxSpeed.y), this.realMaxSpeed.y);
      
      this.pos.x += this.speed.x * timeScale;
      this.pos.y += this.speed.vy * timeScale;
      
      this.pos.rot += ((this.speed.x * timeScale) / (this.drawData.radius * 2 * Math.PI)) * 2 * Math.PI;
      this.pos.rot = this.pos.rot % (Math.PI * 2);
      
      return;
    }
    
    //---Gravity---
    this.speed.x += this.gravity.x * timeScale;
    this.speed.y += this.gravity.y * timeScale;
    
    //---Contstraints---
    this.speed.x = Math.min(Math.max(this.speed.x, -this.realMaxSpeed.x), this.realMaxSpeed.x);
    this.speed.y = Math.min(Math.max(this.speed.y, -this.realMaxSpeed.y), this.realMaxSpeed.y);
    
    var cSpeed = {"x": 0, "y": 0};
    if(this.contactBox != undefined) {
      cSpeed.x = this.contactBox.deltaX;
      cSpeed.y = this.contactBox.deltaY;
    }
    
    //---Moving with box player is on---
    this.pos.x += cSpeed.x;
    this.pos.y += cSpeed.y;
    
    //---Actual motion + jumping logic---
    
    //---X axis---
    var sticky = false;
    var stickySide = 1;
    this.pos.x += this.speed.x * timeScale;
    var c = this.collide();
    if(c) {
      this.contactBox = c;
      this.pos.x -= this.speed.x * timeScale * (1 + cSpeed.x * 0.1);
      if(this.speed.x > 0) {
        stickySide = -1;
      }
      if(!c.bouncy) {
        if(!c.sticky) {
          this.speed.x = this.speed.x * -0.5;
        } else {
          this.speed.x = 0;
        }
      } else {
        this.speed.x = this.speed.x * -1.5;
      }
      if(c.sticky) {
        sticky = true;
      }
    } else {
      this.pos.rot += ((this.speed.x * timeScale) / (this.drawData.radius * 2 * Math.PI)) * 2 * Math.PI;
      this.pos.rot = this.pos.rot % (Math.PI * 2);
    }
    
    //---Y axis---
    var d = "y";
    if(sticky) { d = "vy"; this.speed.y = 0; }
    
    this.canJump = false;
    this.pos.y += this.speed[d] * timeScale;
    var c = this.collide();
    if(c) {
      this.contactBox = c;
      this.pos.y -= this.speed[d] * timeScale;
      if(!c.bouncy) {
        if(this.speed[d] > 0) {
          this.canJump = true;
        }
        this.speed[d] = 0;
      } else {
        this.speed[d] *= -1.5;
      }
    } else {
      if(sticky) {
        this.pos.rot += ((this.speed.vy * stickySide * timeScale) / (this.drawData.radius * 2 * Math.PI)) * 2 * Math.PI;
        this.pos.rot = this.pos.rot % (Math.PI * 2);
      }
    }
    if(sticky) {
      this.canJump = true;
    }
  }
  
  collide(map=this.map) {
    return map.collide(this.boundingBox());
  }
  
  boundingBox() {
    return new Box(Math.round(this.pos.x) - this.drawData.radius, Math.round(this.pos.y) - this.drawData.radius, this.drawData.radius * 2, this.drawData.radius * 2);
  }
  
  draw(ctx, voffset={"x": 0, "y": 0}, scale=1) {
    var xc = (this.pos.x - voffset.x) * scale;
    var yc = (this.pos.y - voffset.y) * scale;
    
    ctx.beginPath();
    ctx.arc(xc, yc, this.drawData.radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    
    var lw = 10;
    
    ctx.beginPath();
    ctx.arc(xc, yc, (this.drawData.radius - (lw / 2)) * scale, this.pos.rot, this.pos.rot + Math.PI);
    ctx.lineWidth = lw * scale;
    ctx.strokeStyle = "#999";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(xc, yc, (this.drawData.radius - (lw / 2)) * scale, this.pos.rot + Math.PI, this.pos.rot + Math.PI * 2);
    ctx.lineWidth = lw * scale;
    ctx.strokeStyle = "#555";
    ctx.stroke();
  }
  
  get state() {
    var data = {
      "pos": {"x": this.pos.x, "y": this.pos.y, "rot": this.pos.rot},
      "speed": {"x": this.speed.x, "y": this.speed.y, "vy": this.speed.vy},
      "canJump": this.canJump,
      "coinCount": this.coinCount
    };
    if(this.controls != undefined) {
      data.controls = JSON.parse(JSON.stringify(this.controls));
    }
    return data;
  }
  
  set state(state) {
    this.pos.x = state.pos.x;
    this.pos.y = state.pos.y;
    this.pos.rot = state.pos.rot;
    this.speed.x = state.speed.x;
    this.speed.y = state.speed.y;
    this.speed.vy = state.speed.vy;
    this.canJump = state.canJump;
    this.coinCount = state.coinCount;
    this.controls = state.controls;
  }
  
  getPos() {
    return {x: this.pos.x, y: this.pos.y};
  }
  
  setPos(x, y) {
    this.pos.x = x;
    this.pos.y = y;
  }
  
  getSpeed() {
    return {x: this.speed.x, y: this.speed.y};
  }
  
  serialize() {
    var data = {};
    for(var key in this) {
      if(typeof this[key] != "undefined" && typeof this[key] != "function" && !(typeof this[key] == "object" && this[key].constructor.name != "Object")) {
        data[key] = this[key];
      }
    }
    return data;
  }
  
  static deserialize(data) {
    var obj = new this();
    for(var key in data) {
      obj[key] = data[key];
    }
    return obj;
  }
}

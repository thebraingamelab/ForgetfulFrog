jsPsych.plugins['memory-map'] = (function(){
    
  var plugin = {};

  plugin.info = {
    name: 'memory-map',
    parameters: {
      game_map:{
        type: jsPsych.plugins.parameterType.ARRAY,
        pretty_name: 'Game map',
        default: null,
        description: "A one dimensional array where -1 -> player, 0 -> floor, 1 -> wall, 2 -> exit"
      },
      row_length:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Row length",
        default: 9,
        description: "The amount of elements in a row of the map"
      },
      column_height:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Column height",
        default: 9,
        description: "The amount of elements in a column of the map"
      },
      blackout_speed:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Time to memorize",
        default: 1000,
        description: "The amount of time in ms that the player gets to memorize the map"
      },
      exit_length:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Exit length",
        default: 5,
        description: "The magnitude of the amount of moves from the start to the exit"
      },
      tutorial:{
        type: jsPsych.plugins.parameterType.BOOLEAN,
        pretty_name: 'Tutorial Marker',
        default: false,
        description: "A flag that indicates if it is a stage to not blackout as a tutorial"
      },
      lives:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Lives',
        default: undefined,
        description: "The number of lives the player has left before game over"
      },
      consecutivewins:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'consecutivewins',
        default: undefined,
        description: "the number of consecutivewins the player has"
      },
      score:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Score',
        default: 0,
        description: "The number of points the player has"
      },
      wins:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'wins',
        default: undefined,
        description: "the number of times the player has won"
      },
      fails:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'fails',
        default: undefined,
        description: "the number of times the player has failed"
      },
      attempts:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'attempts',
        default: 0,
        description: "the number of times the player has played"
      },
      scale:{
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'scale',
        default: 96,
        description: "pixel dimensions of each tile"
      },
      sprites:{
        type: jsPsych.plugins.parameterType.ARRAY,
        pretty_name: 'sprites',
        default: null,
        description: "An array of preloaded character sprites"
      }
    }
  }

  plugin.trial = function(display_element,trial){
    var dom_target = jsPsych.getDisplayElement();
    dom_target.style.height = '100%';

    //creating canvases that buffer paintings, like layers in photoshop
    var ground = document.createElement("canvas").getContext("2d");
    ground.imageSmoothingEnabled = false;
    var pad = document.createElement("canvas").getContext("2d");
    pad.imageSmoothingEnabled = false;
    var frogbuffer = document.createElement("canvas").getContext("2d");
    frogbuffer.imageSmoothingEnabled = false;
    if(document.querySelector("#canbg") == null){
      display_element.innerHTML = "<div id='canbg' style='background-color: #60c8cc;'><canvas id='canvas-board'></canvas><canvas id='charcan'></canvas></div><div id='UI'><div id ='infoBar'><div id='infoBarImage'></div><span id='leveltxt'></span><span class= 'lvnum' id='curlv'></span><span class='dot' id='dot1'></span><span class='dot' id='dot2'></span><span class='dot' id='dot3'></span><span class='dot' id='dot4'></span><span class='dot' id='dot5'></span><span class= 'lvnum' id='nxlv'></span><span id='acctxt'></span><span id='livestxt'></span></div><div id='controlpad'><div id='up'></div><div id='down'></div><div id='left'></div><div id='right'></div><img id = dpad src='img/dpad.svg'></div></div>";
    }
    var board = document.querySelector('#canvas-board').getContext("2d");
    board.imageSmoothingEnabled = false;
    var wipers = document.querySelector('#canvas-board');
    var frogboard = document.querySelector('#charcan').getContext("2d");
    frogboard.imageSmoothingEnabled = false;
    var lives = document.querySelector("#livestxt");
    var levels = document.querySelector("#leveltxt");
    var fullscreen = document.getElementById("fullscreenh");
    var upkey = document.querySelector("#up");
    var downkey = document.querySelector("#down");
    var leftkey = document.querySelector("#left");
    var rightkey = document.querySelector("#right");
    var tutorial = document.getElementById("tutorial");
    var dpad = document.getElementById("dpad");
    var curlv = document.getElementById("curlv");
    var nxlv = document.getElementById("nxlv");
    var accutxt = document.getElementById("acctxt");

    loadWaiter = function(){
      beginGame();
    }
    //blackout time switch
    var bo = false;
    var dead = false;
    var time;
    //LOAD IMG ASSETS
    var check = document.createElement("img");
    check.src = trial.sprites[10].src;
    var cross = document.createElement("img");
    cross.src = trial.sprites[11].src;
    var frog = document.createElement("img");
    frog.src = trial.sprites[0].src;
    var lilypad = document.createElement("img");
    lilypad.src = trial.sprites[8].src;
    var fly = document.createElement("img");
    fly.src = trial.sprites[9].src;
    fly.onload = loadWaiter;
    const infoBar = document.getElementById("infoBar");
  
    //map data
    var level = {
      map: trial.game_map,
      scale: trial.scale,
      x: trial.row_length,
      y: trial.column_height,
      walkable: [0,2],
      learntime: trial.blackout_speed,
      lives: trial.lives,
      consecutivewins: trial.consecutivewins
    }

    //character data
    var char = {
      tx: 1,
      ty: 8
  }

    var trial_data = {
      "success": null,
      "sequence_size": trial.exit_length,
      "mem_time": trial.blackout_speed,
      "inputs": [],
      "steps": 0,
      "map": trial.game_map,
      "startpos": null,
      "input_type": null,
      "device": navigator.userAgent,
      "solution": null,
      "ttp": [], //Time to press a key
      "waited": false //true if they waited for blackout, false if they didn't
    }
  
    drawMap = function() {
      //loop over array, checking val of each index to determine fill color (or image)
      for (let index = 0; index < level.map.length; index ++) {
  
        //REPLACE THIS WITH IMAGES WHEN WE HAVE GRAPHICS

        //check array val for type of tile & set fill color accordingly
        // 1 = black 0 = white 2 = exit
        switch(level.map[index]){
          case -1:
            char.tx = index%level.x;
            char.ty = Math.floor(index/level.x)+1;
            level.map[index] = 0;
            trial_data.startpos = index;
            break;
          case 0:
            //ground.fillRect((index % level.x) * level.scale, Math.floor(index/level.x) * level.scale, level.scale, level.scale);
            ground.drawImage(lilypad, (index % level.x) * level.scale, Math.floor(index/level.x) * level.scale, level.scale, level.scale);
            break;
          case 1:
            //DO NOTHING, BG IS WATER
            break;
          case 2:
            ground.drawImage(fly, (index % level.x) * level.scale, Math.floor(index/level.x) * level.scale, level.scale, level.scale);
            break;
        }
        //filled rectangle shape
      }
      board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
    };
    //Draw Player Character
    charrender = function(){
        //for color changing player, if states to be conveyed
        //ground.fillStyle = "#ff0000"
        charx = char.tx*level.scale;
        chary = (char.ty-1)*level.scale;
        //ground.fillRect(charx, chary, level.scale, level.scale);
        if(dead == false){
          ground.drawImage(lilypad, charx, chary, level.scale, level.scale);
          frogbuffer.drawImage(frog,charx,chary,level.scale,level.scale);
        }
        else{
          //
        }
        board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
        frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
    };

    //redraw moving objects
    redraw = function(){
      if(bo ==false){
        drawMap();
      }
      charrender();
      if(bo == true){
        blackout();
      }
    }

    settime = function(){
      var temptime = performance.now();
      trial_data.ttp.push(temptime-time);
      time = temptime;      
    }

    //checks what key pressed, then moves char as appropriate
    dirCheckK = function(e) {
      settime();
      trial_data.input_type = "keyboard";
      trial_data.steps++;
      if(typeof(e) === "undefined"){
        e = window.event;
      }
      //Calls movement method with movement code
      switch(e.keyCode){
        case 38:
          moveChar(8);
          break;
        case 40:
          moveChar(2);
          break;
        case 37:
          moveChar(4);
          break;
        case 39:
          moveChar(6);
          break;
        case 87:
          moveChar(8);
          break;
        case 83:
          moveChar(2);
          break;
        case 65:
          moveChar(4);
          break;
        case 68:
          moveChar(6);
          break;
      }
    }

    dirCheckM2 = function(e){
      trial_data.input_type = "touch";
      if(typeof(e) === "undefined"){
        e = window.event;
      }
      var touch = e.touches.item(0);
      var touchx = touch.clientX;
      var touchy = touch.clientY;
      if(touchx > 0){
        if(touchy > 0){}
        else{}
      }
      else{
        if(touchy<0){}
        else{}
      }
    }

    //checks where tapped/swiped, then moves char as appropriate
    //non functional
    dirCheckM = function(e){
      settime();
      trial_data.input_type = "touch";
      if(typeof(e) === "undefined"){
        e = window.event;
      }
      //Store to prevent exploit
      var touch = e.touches.item(0);
      var touchx = touch.clientX;
      var touchy = touch.clientY;
      var centerx = document.documentElement.clientWidth/2;
      var centery = document.documentElement.clientHeight/2;
      var xmag = (touchx - centerx)/document.documentElement.clientWidth;
      var ymag = (touchy - centery)/document.documentElement.clientHeight;
      //x axis move
      if(Math.abs(xmag)>Math.abs(ymag)){
        if(xmag > 0){
          //right
          moveChar(6);
        }
        else{
          //left
          moveChar(4);
        }
      }
      else{
        if(ymag>0){
          //up
          moveChar(2);
        }
        else{
          //down
          moveChar(8);
        }
      }
    }

    //returns the tilecode at the input x&y coordinates
    collider = function(ix, iy){
      return level.map[ix+((iy-1)*level.x)];
    }


    //moves that character in the passed direction
    moveChar = function(dir){
      if(!hop.paused){
        hop.currentTime = 0;
        hop.play();
      }
      else{
        hop.play();
      }
      wipeWaiters();
      blackout();
      switch(dir){
        //OPTIMIZE THIS INTO THE SPRITES FOR LOAD OPT
        case 2:
          char.ty = char.ty + 1;
          trial_data.inputs.push("Down");
          dpad.src = "img/dpadD.svg";
          animateHop(Date.now(),1);
          break;
        case 4:
          char.tx = char.tx - 1;
          trial_data.inputs.push("Left");
          dpad.src = "img/dpadL.svg";
          animateHop(Date.now(),2);
          break;
        case 6:
          char.tx = char.tx + 1;
          trial_data.inputs.push("Right");
          dpad.src = "img/dpadR.svg";
          animateHop(Date.now(),3);
          break;
        case 8:
          char.ty = char.ty - 1;
          trial_data.inputs.push("Up");
          dpad.src = "img/dpadU.svg";
          animateHop(Date.now(),4);
          break;
      }
    }

    var totshift = 0;
    
    animateHop = function(timestamp,int){
      //shift should be a multiple level.scale
      //AREA OF CONCERN
      var framesPerHop = 10;
      var shift = (level.scale/framesPerHop);
      //document.ontouchstart = null;
      dPadActive(false);
      document.onkeydown = null;
      var padcheck = false;
      if(!trial.tutorial){
      wipers.style.opacity = 0;
      }
      frogbuffer.clearRect(0,0,frogbuffer.canvas.width,frogbuffer.canvas.height);
      frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
      switch(int){
        case 1:
          if(level.walkable.includes(collider(char.tx,char.ty))){
            padcheck = true;
          }
          frog.src = trial.sprites[7].src;
          chary = chary+shift;
          break;
        case 2:
          if(level.walkable.includes(collider(char.tx,char.ty))){
            padcheck = true;
          }
          frog.src = trial.sprites[5].src;
          charx = charx-shift;
          break;
        case 3:
          if(level.walkable.includes(collider(char.tx,char.ty))){
            padcheck = true;
          }
          frog.src = trial.sprites[6].src;
          charx = charx+shift;
          break;
        case 4:
          if(level.walkable.includes(collider(char.tx,char.ty))){
            padcheck = true;
          }
          frog.src = trial.sprites[4].src;
          chary = chary-shift;
          break;
      }
      totshift = totshift+shift;
      if(padcheck && !trial.tutorial){
        pad.clearRect(0,0,pad.canvas.width,pad.canvas.height);
        pad.drawImage(lilypad, char.tx*level.scale, (char.ty-1)*level.scale, level.scale, level.scale);
        pad.globalAlpha = totshift/level.scale;
        frogboard.drawImage(pad.canvas, 0, 0, pad.canvas.width, pad.canvas.height, 0, 0, frogboard.canvas.width, frogboard.canvas.height);
        pad.clearRect(0,0,pad.canvas.width,pad.canvas.height);
      }
      frogbuffer.drawImage(frog,charx,chary,level.scale,level.scale);
      frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
      if(Math.round(totshift)<level.scale){
        switch(int){
          case 1:
            window.requestAnimationFrame(animateHopD);
            break;
          case 2:
            window.requestAnimationFrame(animateHopL);
            break;
          case 3:
            window.requestAnimationFrame(animateHopR);
            break;
          case 4:
            window.requestAnimationFrame(animateHopU);
            break;
        }
      }
      else{
        charx = Math.round(charx);
        chary = Math.round(chary);
        switch(frog.src.split("/").pop().split(".")[0]){
          case "frogJ":
            frog.src = trial.sprites[0].src;
            break;
          case "frogDJ":
            frog.src = trial.sprites[3].src;
            break;
          case "frogLJ":
            frog.src = trial.sprites[1].src;
            break;
          case "frogRJ":
            frog.src = trial.sprites[2].src;
            break;
        }    
        frogbuffer.clearRect(0,0,frogbuffer.canvas.width,frogbuffer.canvas.height);
        frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
        pad.drawImage(lilypad, char.tx*level.scale, (char.ty-1)*level.scale, level.scale, level.scale);
        frogboard.drawImage(pad.canvas, 0, 0, pad.canvas.width, pad.canvas.height, 0, 0, frogboard.canvas.width, frogboard.canvas.height);
        frogbuffer.drawImage(frog,charx,chary,level.scale,level.scale);
        frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
        start = null;
        totshift = 0;
        document.onkeydown = dirCheckK;
        dpad.src = "img/dpad.svg";
        dPadActive(true);
        if(level.walkable.includes(collider(char.tx,char.ty))){
          wincheck();
        }
        else{
          die();
        }
      }
    }

    //Wrapped functions for event based calls
    animateHopD = function(){
      animateHop(Date.now(),1);
    }
    animateHopL = function(){
      animateHop(Date.now(),2);
    }
    animateHopR = function(){
      animateHop(Date.now(),3);
    }
    animateHopU = function(){
      animateHop(Date.now(),4);
    }
    moveU = function(){
      moveChar(8);
    }
    moveD = function(){
      moveChar(2);
    }
    moveL = function(){
      moveChar(4);
    }
    moveR = function(){
      moveChar(6);
    }

    dPadActive = function(bool){
      if(bool){
        upkey.onclick = moveU;
        downkey.onclick = moveD;
        leftkey.onclick = moveL;
        rightkey.onclick = moveR;
      }
      else{
        upkey.onclick = null;
        downkey.onclick = null;
        leftkey.onclick = null;
        rightkey.onclick = null;
      }
    }

    //handles loss
    die = function(){
      document.onkeydown = null;
      dPadActive(false);
      bo = false;
      dead = true;
      wipers.style.opacity = 1;
      frogbuffer.clearRect(0,0,frogbuffer.canvas.width,frogbuffer.canvas.height);
      frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
      splash.play();
      cross.src = trial.sprites[13].src;
      ground.drawImage(cross, charx,chary, level.scale, level.scale);
      board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
      window.requestAnimationFrame(animateSplash);
      bo = false;
      delay(500,lose);
    }

    var splashVal = 1;

    animateSplash = function(timestamp){
      if(splashVal<4){
        console.log("DRAW FRAME 1");
        cross.src = trial.sprites[11].src;
      }
      else if(splashVal<7){
        console.log("DRAW FRAME 2");
        cross.src = trial.sprites[12].src;
      }
      else if(splashVal<10){
        console.log("DRAW FRAME 3");
        cross.src = trial.sprites[13].src;
      }
      ground.clearRect(0,0,ground.canvas.width,ground.canvas.height);
      board.clearRect(0,0,board.canvas.width,board.canvas.height);
      board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
      ground.drawImage(cross, charx,chary, level.scale, level.scale);
      board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
      if(splashVal < 16){
        splashVal++;
        window.requestAnimationFrame(animateSplash);
      }
      else{
        splashVal = 1;
        cross.src = trial.sprites[11];
      }
    }

    lose = function(){
      trial_data.map[trial_data.startpos] = -1;
      trial_data.success = false;
      jsPsych.finishTrial(trial_data);
    }

    //generates an array to be mapped
    mapGen = function(){
      //dfsGen returns a ~~tuple~~ array [map,solution]
      var data = dfsGen(level.x,level.y,trial.exit_length);
      level.map = data[0];
      trial_data.solution = data[1];
      trial_data.map = level.map;
    }

    //Separate check for win, so you are actualy displayed ON the wincon
    wincheck = function(){
      if(level.map[char.tx+((char.ty-1)*level.x)] == 2){
        //block input whilewin screen is up
        wipers.style.opacity = 1;
        document.onkeydown = null;
        dPadActive(false);
        bo = false;
        if(tutover){updateInfo();}
        frogbuffer.drawImage(check,0,0,ground.canvas.width,ground.canvas.height);
        frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
        ding.play();
        bo = false;
        delay(500,win);
      }
    }

    win = function(){
      trial_data.map[trial_data.startpos] = -1;
      trial_data.success = true;
      jsPsych.finishTrial(trial_data);
    }

    remap = function(){
      bo = false;
      mapGen();
      resize();
      delay(level.learntime,blackoutrec);
    }

    blackoutrec = function(){
      if(!trial.tutorial){
        trial_data.waited = true;
      }
      else{
        trial_data.waited = null;
      }
      blackout();
    }

    blackout = function(){
      //board.fillStyle = "#000000";
      if(!trial.tutorial){
        /*
        board.clearRect(0,0,board.canvas.width,board.canvas.height);
        ground.clearRect(0,0,ground.canvas.width,ground.canvas.height);
        ground.drawImage(lilypad, charx, chary, level.scale, level.scale);
        frogbuffer.drawImage(frog,charx,chary,level.scale,level.scale);
        frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
        board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);*/ 
        frogbuffer.drawImage(lilypad, char.tx*level.scale, (char.ty-1)*level.scale, level.scale, level.scale);
        frogbuffer.drawImage(frog,charx,chary,level.scale,level.scale);
        frogboard.drawImage(frogbuffer.canvas, 0, 0, frogbuffer.canvas.width, frogbuffer.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
        wipers.style.opacity = 0;
        bo = true;
        //insert screen blackout here
        document.onkeydown = dirCheckK;
        //document.ontouchstart = dirCheckM;
        dPadActive(true);
      }
      else{
        document.onkeydown = dirCheckK;
        //document.ontouchstart = dirCheckM;
        dPadActive(true);
      }
    }
  
    var canvasdim;
    //function that keeps the canvas element sized appropriately
    resize = function(event){
      var ratio = 1;
      //ORIENTATION DETECTION
      if(window.innerHeight < window.innerWidth){
        canvasdim = Math.floor(display_element.clientHeight);
        ratio = window.innerHeight/window.innerWidth;
        board.canvas.style.top = "0px";
        frogboard.canvas.style.top = "0px";
        frogboard.canvas.width = Math.floor(display_element.clientHeight);
        frogboard.canvas.height = frogboard.canvas.width;
        board.canvas.width = frogboard.canvas.width;
        board.canvas.height = frogboard.canvas.height;
        infoBar.style.width = "30%";
        infoBar.style.height = "15%";
        levels.width = infoBar.width;
        levels.height = infoBar.height;
        lives.width = infoBar.width;
        lives.height = infoBar.height;
        board.canvas.style.left = ((display_element.clientWidth/2) - document.querySelector('#canvas-board').offsetWidth/2)/1.25 + "px";
        frogboard.canvas.style.left = board.canvas.style.left;
        if(window.innerHeight < 390){
          lives.style.fontSize = "80%";
          accutxt.style.fontSize = "80%";
          curlv.style.fontSize = "80%";
          nxlv.style.fontSize = "80%";
          levels.style.fontSize = "80%";
        } 
        if(window.innerHeight > 700){
          lives.style.fontSize = "130%";
          accutxt.style.fontSize = "130%";
          curlv.style.fontSize = "130%";
          nxlv.style.fontSize = "130%";
          levels.style.fontSize = "130%";
        }
      }
      else{
        canvasdim = Math.floor(display_element.clientWidth);
        ratio = window.innerWidth/window.innerHeight;
        board.canvas.style.left = "0px";
        frogboard.canvas.style.left = "0px";
        frogboard.canvas.width = Math.floor(display_element.clientWidth);
        frogboard.canvas.height = Math.floor(display_element.clientWidth);
        board.canvas.width = frogboard.canvas.width;
        board.canvas.height = frogboard.canvas.height;
        infoBar.style.width = "45%";
        infoBar.style.height = "10%";
        //tutorial.style.width = "90%";
        //tutorial.style.height = "20%";
        levels.width = infoBar.width;
        levels.height = infoBar.height;
        lives.width = infoBar.width;
        lives.height = infoBar.height;
        board.canvas.style.top = ((display_element.clientHeight/2) - document.querySelector('#canvas-board').offsetHeight/2)/2 + "px";
        frogboard.canvas.style.top = board.canvas.style.top;
        if(window.innerWidth < 390){
          lives.style.fontSize = "80%";
          accutxt.style.fontSize = "80%";
          curlv.style.fontSize = "80%";
          nxlv.style.fontSize = "80%";
          levels.style.fontSize = "80%";
        } 
        if(window.innerWidth > 700){
          lives.style.fontSize = "130%";
          accutxt.style.fontSize = "130%";
          curlv.style.fontSize = "130%";
          nxlv.style.fontSize = "130%";
          levels.style.fontSize = "130%";
        }
      }
      if(((level.x > level.y)&&(window.innerHeight>window.innerWidth))||((level.y>level.x)&&(window.innerWidth>window.innerHeight))){
        if(window.innerHeight>window.innerWidth){}
        if(window.innerHeight<window.innerWidth){}
      }
      redraw();
    }



    //dir, 0 = ccw 1 = cw
    rotate = function(map, dir){
      var new_map = map;
	    for(let j = 0; j < level.y-1; j++){
		    for (let i = 0; i < level.x-1; i++){
          new_map[((i*level.x)-1)+j] = map[(j*level.x)+i];
        }
      }
      return new_map;
    }

    //0 = portrait
    orientationCheck = function(){
      if(window.innerHeight > innerWidth){
        return 0;
      }
      else{
        return 1;
      }
    }

    var RAFid = [];
    restart = function(){
      wipeWaiters();
      //if or fix
      remap();
      beginGame();
    }

    //Thanks to detectmobilebrowsers.com for the Open-Source regex
    window.mobileAndTabletcheck = function(){
      var check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    }

    wipeWaiters = function(){
      RAFid.forEach(element => {
        cancelAnimationFrame(element);
      });
      RAFid = [];
    }

    var start = null;
    delay = function(int,func){
      if(start == null){
        start = Date.now();
      }
      var progress = Date.now() - start;
      if(progress < int){
        //anon func t prevent glob
        id = requestAnimationFrame(function(timestamp){
          delay(int,func);
        });
        RAFid.push(id);
      }
      else{
        start = null;
        func();
        return;
      }
    }

    updateInfo = function(){
      var dot;
      for(let i = 0; i<5;i++){
        switch(i){
          case 0:
            dot = document.querySelector("#dot1");
            break;
          case 1:
            dot = document.querySelector("#dot2");
            break;
          case 2:
            dot = document.querySelector("#dot3");
            break;
          case 3:
            dot = document.querySelector("#dot4");
            break;
          case 4:
            dot = document.querySelector("#dot5");
            break;
        }
        if(i <= trial.consecutivewins+1){
          dot.style.backgroundColor = "green";
        }
        else{
          dot.style.backgroundColor = "red";
        }
      }
    }
  
    beginGame = function(){
      time = performance.now();
      if(display_element.clientHeight>display_element.clientWidth){
        canvasdim = Math.floor(display_element.clientWidth);  
        level.scale = Math.floor(display_element.clientWidth/trial.row_length);// + Math.floor(.5*display_element.clientWidth/trial.row_length);
      }
      else{
        canvasdim = Math.floor(display_element.clientHeight);
        level.scale = Math.floor(display_element.clientHeight/trial.row_length);
      }
      orientation = orientationCheck();
      //canvas = size * dimension of array
      ground.canvas.width = Math.floor(canvasdim);
      ground.canvas.height = Math.floor(canvasdim);
      pad.canvas.width = Math.floor(canvasdim);
      pad.canvas.height = Math.floor(canvasdim);
      frogbuffer.canvas.width = Math.floor(canvasdim);
      frogbuffer.canvas.height = Math.floor(canvasdim);
      lives.innerText = "LIVES";
      levels.innerText = "LEVEL  :";
      if(trial.game_map != null){
        level.map = trial_data.map;
      }
      else{
        mapGen();
      }
      infoBar.style.left = 0 + "px";
      infoBar.style.top = 5 + "px";
      var dot;
      curlv.innerText = trial.exit_length-4;
      for(let i = 0; i<5;i++){
        switch(i){
          case 0:
            dot = document.querySelector("#dot1");
            break;
          case 1:
            dot = document.querySelector("#dot2");
            break;
          case 2:
            dot = document.querySelector("#dot3");
            break;
          case 3:
            dot = document.querySelector("#dot4");
            break;
          case 4:
            dot = document.querySelector("#dot5");
            break;
        }
        if(i <= trial.consecutivewins){
          dot.style.backgroundColor = "green";
        }
        else{
          dot.style.backgroundColor = "red";
        }
      }
      nxlv.innerText = trial.exit_length-3;
      //SCORE TEXT LIVES TEXT
      accutxt.innerText = "Accuracy:";
      lives.innerText = trial.wins+"/"+trial.attempts;//"LIVES: "+trial.lives;
      if(!tutover){
        tutorial.style.opacity = 1;
        document.getElementById("infoBar").style.opacity = 0;
      }
      else{        
        tutorial.style.opacity = 0;
        document.getElementById("infoBar").style.opacity = 1;
      }
      //this calls resize everytime the window changes size
      window.addEventListener("resize", resize, {passive:true});
      if(!(window.mobileAndTabletcheck())){
        document.querySelector("#nxlv").style.right = '10%';
        var all = document.getElementsByClassName('dot');
        //THIS DOES NOT FUNCTION PROPERLY, RUNS AND COMPARES Height = "" to Width = ""
        for (var i = 0; i < all.length; i++) {
          if(all[i].style.height > all[i].style.width){
            all[i].style.width = all[i].style.height;
          }
          else if(all[i].style.height < all[i].style.width){
            all[i].style.height = all[i].style.width;
          }
        }
      }
      /*//moved to html scope
      if(window.mobileAndTabletcheck()){
        //fullscreen.ontouchstart = toggleFullScreen;
      }
      else{
        //fullscreen.onclick = toggleFullScreen;
        document.querySelector("#dpad").style.opacity = 0;
        dPadActive(false);
      }*/
      initSounds();
      //window.addEventListener("orientationchange", restart, {passive:true});
      
      //this sizes up the window properly the first time
      resize();
      bo = false;
      document.onkeydown = dirCheckK;
      //document.ontouchstart = dirCheckM;
      dPadActive(true);
      delay(level.learntime,blackoutrec);
    }
  }

  return plugin;
  
  })();
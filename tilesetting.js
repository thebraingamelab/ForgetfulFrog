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
        default: 16,
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
      }
    }
  };

  plugin.trial = function(display_element,trial){
    var ground = document.createElement("canvas").getContext("2d");
    var board = document.querySelector("canvas").getContext("2d");
    const check = document.getElementById("check");
    var bo = false;
  
    //map data
    var level = {
      map: trial.game_map,
      scale: 64,
      x: trial.row_length,
      y: trial.column_height,
      walkable: [0,2],
      learntime: trial.blackout_speed
    }

    //character data
    var char = {
      tx: 1,
      ty: 8
  }
  
    //canvas = size * dimension of array
    ground.canvas.width = level.x * level.scale;
    ground.canvas.height = level.y * level.scale;
  
    drawMap = function() {
      //loop over array, checking val of each index to determine fill color (or image)
      for (let index = 0; index < level.map.length; index ++) {
  
        //REPLACE THIS WITH IMAGES WHEN WE HAVE GRAPHICS

        //check array val for type of tile & set fill color accordingly
        // 1 = black 0 = white 2 = exit
        switch(level.map[index]){
          case -1:
            //BUG: incorrect math to determine tx and ty from index,x,y
            //console.log(index);
            //console.log(level.x);
            char.tx = index%level.x;
            //console.log(char.tx);
            char.ty = Math.floor(index/level.x)+1;
            //console.log(char.ty);
            level.map[index] = 0;
            ground.fillStyle = "#ffffff";
            break;
          case 0:
            ground.fillStyle = "#ffffff";
            break;
          case 1:
            ground.fillStyle = "#000000";
            break;
          case 2:
            ground.fillStyle = "#0000ff";
            break;
        }
        //filled rectangle shape
        ground.fillRect((index % level.x) * level.scale, Math.floor(index/level.x) * level.scale, level.scale, level.scale);
      }
      board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);
      //charrender();
  
    };

    //Draw Player Character
    charrender = function(){
        //for color changing player, if states to be conveyed
        ground.fillStyle = "#FF0000"
        charx = char.tx*level.scale;
        chary = (char.ty-1)*level.scale;
        ground.fillRect(charx, chary, level.scale, level.scale);
        board.drawImage(ground.canvas, 0, 0, ground.canvas.width, ground.canvas.height, 0, 0, board.canvas.width, board.canvas.height);

        /*
        //THIS IS FOR CIRCLE, UNNECESSARY ISSUES ESP IF GRAPHICS WILL BE IN RECTANGULAR BOUNDING BOX
        var startloc = 32;
        context.fillStyle = "#ff0000";
        context.beginPath();
        //context.arc((startloc%x)*size, Math.floor(startloc/y)*size, 30, 0, 2 * Math.PI);
        cx = (startloc%x)*size;
        cy = Math.floor(startloc/y)*size;
        console.log("cx: "+cx);
        console.log("cy: "+cy);
        context.arc(30, 440, 25, 0, 2 * Math.PI);
        context.fill();
        */
    };

    //redraw moving objects
    redraw = function(){
        drawMap();
        charrender();
        if(bo == true){
          blackout();
        }
    }

    //checks what key pressed, then moves char as appropriate
    dirCheckK = function(e) {
      if(typeof(e) === "undefined"){
        e = window.event;
      }
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
      }
    }

    //checks where tapped/swiped, then moves char as appropriate
    //non functional
    dirCheckM = function(e){
      if(typeof(e) === "undefined"){
        e = window.event;
      }
      switch(e.targetTouches){}
    }

    //returns the tilecode at the input x&y coordinates
    collider = function(ix, iy){
      console.log(ix+((iy-1)*level.x));
      return level.map[ix+((iy-1)*level.x)];
    }

    //moves that character in the passed direction
    moveChar = function(dir){
      var temp;
      switch(dir){
        case 2:
          temp = char.ty + 1;
          if(level.walkable.includes(collider(char.tx,temp))){
            char.ty = char.ty + 1;
          }
          else{
            die();
          }
          break;
        case 4:
          temp = char.tx - 1;
          if(level.walkable.includes(collider(temp,char.ty))){
            char.tx = char.tx - 1;
          }
          else{
            die();
          }
          break;
        case 6:
          temp = char.tx + 1;
          if(level.walkable.includes(collider(temp,char.ty))){
            char.tx = char.tx + 1;
          }
          else{
            die();
          }
          break;
        case 8:
            temp = char.ty - 1;
            if(level.walkable.includes(collider(char.tx,temp))){
              char.ty = char.ty - 1;
            }
            else{
              die();
            }
          break;
      }
      redraw();
      wincheck();
    }

    //handles loss
    die = function(){
      console.log("u ded");
    }

    //generates an array to be mapped
    mapGen = function(){
      level.map = boundedWalk(level.x,level.y,Math.floor((level.x * level.y)/2),trial.exit_length);
    }

    //Separate check for win, so you are actualy displayed ON the wincon
    wincheck = function(){
      if(level.map[char.tx+((char.ty-1)*level.x)] == 2){
        console.log("YOU WIN!");
        //block input whilewin screen is up
        document.onkeydown = null;
        document.ontouchstart = null;
        board.drawImage(check,128,64,board.canvas.width/1.5,board.canvas.height/1.1);
        bo = false;
        setTimeout(remap, 500);
        //jsPsych.finishTrial()
      }
      else{}
    }

    remap = function(){
      mapGen();
      resize();
      setTimeout(blackout, level.learntime);
    }

    blackout = function(){
      board.fillStyle = "#000000";
      board.fillRect(0,0,board.canvas.width,board.canvas.height);
      bo = true;
      //insert screen blackout here
      document.onkeydown = dirCheckK;
      document.ontouchstart = dirCheckM;
    }
  
    //function that keeps the canvas element sized appropriately
    resize = function(event) {
  
      board.canvas.width = Math.floor(document.documentElement.clientWidth - 32);
  
      if (board.canvas.width > document.documentElement.clientHeight) {
  
        board.canvas.width = Math.floor(document.documentElement.clientHeight);
  
      }
  
      board.canvas.height = Math.floor(board.canvas.width * 0.5625);
  
      redraw();
  
    };
  
    //this calls resize everytime the window changes size
    window.addEventListener("resize", resize, {passive:true});
    //this sizes up the window properly the first time
    //mapGen();
    resize();
    document.onkeydown = dirCheckK;
    //touchmove is currently experimental and unsupported of firefox as well as other browsers
    //document.ontouchmove = dirCheckM;
    document.ontouchstart = dirCheckM;
  }
  
  })();
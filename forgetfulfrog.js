// This IIFE (aka closure) is for style preference only; it helps to prevent
// things inside from polluting the global namespace. It is completely optional.

// The leading semicolon is also a defensive measure when concatenating several
// JavaScript files into one.
;(function () {

    // This line enables 'strict mode'. It helps you to write cleaner code,
    // like preventing you from using undeclared variables.
    "use strict";

    // Initialize the resizer
    resizer.init();


    // Initialize the template
    template.init();


    //////////////////////////
    // Variable declarations
    //////////////////////////

    // Grab some important values from the resizer
    /*
    let myCanvas = resizer.getCanvas();
    let myContext = myCanvas.getContext("2d");
    */

    //ground buffers non-player elements that are drawn at the start of a level and wiped
    var gameCanvas = resizer.getCanvas()[0].getContext("2d");
    gameCanvas.imageSmoothingEnabled = false;
    var bufferCanvas = resizer.getCanvas()[1].getContext("2d");
    bufferCanvas.imageSmoothingEnabled = false;
    //pad buffers the pad that the player hops to, allowing for independent fading
    var pad = resizer.getCanvas()[4].getContext("2d");
    pad.imageSmoothingEnabled = false;
    //frogbuffer buffers player elements
    var frogboard = resizer.getCanvas()[2].getContext("2d");
    frogboard.imageSmoothingEnabled = false;
    var frogBuffer = resizer.getCanvas()[3].getContext("2d");
    frogBuffer.imageSmoothingEnabled = false;

    // Is the game volume muted?
    let volumeMuted = false;

    let gameSettings = {
        map: null,
        blackout_speed: 1000,
        exit_length: 5,
        row_length: 9,
        column_height: 9,
        scale: 96,
        walkable: [0,2]
    }

    //character data
    let char = {
        tx: 1,
        ty: 8
    }

    //vars to hold the position of the frog in pixels
    let charx = char.tx*gameSettings.scale;
    let chary = (char.ty-1)*gameSettings.scale;

    //an object that holds that data to collect from one individual level
    let trial_data = {
        success: null,
        sequence_size: gameSettings.exit_length,
        mem_time: gameSettings.blackout_speed,
        inputs: [],
        steps: 0,
        map: gameSettings.game_map,
        startpos: null,
        input_type: null,
        device: navigator.userAgent,
        solution: null,
        ttp: [], //Time to press a key
        waited: false //true if they waited for blackout, false if they didn't
    }

    let data_collection = [];

    //generates the sprite sheet for the game
    let sprites = preloadImages(["img/frog.png", "img/frogL.png", "img/frogR.png", "img/frogD.png", "img/frogJ.png", "img/frogLJ.png", "img/frogRJ.png", "img/frogDJ.png", "img/padonly.svg", "img/flypad.png", "img/check.png", "img/splash1.svg", "img/splash2.svg", "img/splash3.svg", "img/sparkle1.svg", "img/sparkle2.svg"]);

    //LOAD IMG ASSETS
    //this method of preloading nd storing images is an optimization that speeds up load times
    //as well as avoiding the issue where 
    let splish = document.createElement("img");
    splish.src = sprites[14].src;
    let check = document.createElement("img");
    check.src = sprites[10].src;
    let cross = document.createElement("img");
    cross.src = sprites[11].src;
    let frog = document.createElement("img");
    frog.src = sprites[0].src;
    let lilypad = document.createElement("img");
    lilypad.src = sprites[8].src;
    let fly = document.createElement("img");
    fly.src = sprites[9].src;
    //fly.onload = loadWaiter;
    const infoBar = document.getElementById("infoBar");

    //dpad hit regions
    let upkey = document.querySelector("#up");
    let downkey = document.querySelector("#down");
    let leftkey = document.querySelector("#left");
    let rightkey = document.querySelector("#right");

    //sounds
    let hop = document.createElement("AUDIO");
    hop.src = "audio/hop.wav";
    let ding = document.createElement("AUDIO");
    ding.src = "audio/ding.wav";
    let splash = document.createElement("AUDIO");
    splash.src = "audio/splash.wav"
    let bgm = document.createElement("AUDIO");
    bgm.src = "audio/bga2.wav"

    //flag for if audio is turned off
    let silenced = false;

    //flag for tracking if we have erased the lilypads with blackout function
    let bo = false;

    //flag for if the frog is dead
    let dead = false;

    //an array to store the id's of dalyed functions
    let RAFids = [];

    //stores the current time
    let time = null;

    //////////////////////////
    // Resize events
    //////////////////////////

    // Every time the Resizer resizes things, do some extra
    // recaculations to position the sample button in the center
    resizer.addResizeEvent(template.resizeBarButtons);

    // Manual resize to ensure that our resize functions are executed
    // (could have also just called resizerBarButtons() but this will do for demonstration purposes)
    resizer.resize();


    //////////////////////////
    // Button events
    //////////////////////////

    // Remove not implemented menus for those buttons we are implementing
    template.removeNotImplemented(template.menuButtons.restart);
    template.removeNotImplemented(template.menuButtons.exit);
    template.removeNotImplemented(template.menuButtons.volume);

    // Confirm the user wants to restart the game
    // (restart not yet implemented, so show "not implemented" menu)
    template.addConfirm(template.menuButtons.restart, "RESTART", function() {
        template.showMenu(template.menus.notImplemented);
    });

    // Confirm if the user wants to exit the game (takes user to main website)
    template.addConfirm(template.menuButtons.exit, "EXIT", template.goToBGL);

    // Change icon of volume button on click
    template.menuButtons.volume.addEventListener("click", function () {
        volumeMuted = !volumeMuted;

        if (volumeMuted) {
            template.setIcon(template.menuButtons.volume, "no-volume-icon");
        }
        else {
            template.setIcon(template.menuButtons.volume, "volume-icon");
        }
    }, false);

    

    /////////////////////////////////////
    //                                 //
    /*     Function definitions        */
    //                                 //
    /////////////////////////////////////

    /////////////////////////////////////
    // RANDOM GENERATION FUNCTIONS     //
    /////////////////////////////////////


    //calculates the bounds of a given array so wall tiles surround the field
    //requires an x & y specification of the array's dimensions
    //returns an array of all indices in the given array that form a bounding box around it
    let calculateBounds = function(arr,x,y){
        var bounds = [];
        var imax = arr.length;
        for(let i = 0; i < imax; i++){
            //|| ((i+1)%y == 0)
            if(((i+1)%x == 0) || (i%x == 0) || (i <= x-1) || (i >= ((x*y)-(x+1)))){
                bounds.push(i);
            }
        }
        return bounds;
    }

    //helper function to generate a random int
    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    //Quaternary Doubly Deep Depth First Search Generator
    function dfsGen(x,y,dist){
        var map = [];
        //fills the map with walls
        for(let i = 0; i < x*y; i++){
            map.push(1);
        }
        var bounds = calculateBounds(map,x,y);
        //pos is a variable that stores the index of the current tile that
        //the depth-first algorithm is pointing to
        var pos = 0;
        //everytime pos is in the bounds, generate a new pos
        //0 will always be in the bounds, so this will always run once
        while(bounds.includes(pos)){
            pos = getRandomInt(map.length);
        }
        //save the start location for final map generation
        var start = pos;
        //nogo is an arry that is used to hold the index of every node in 
        //the map that can NOT have a lilypad
        var nogo = [];
        //path is an array that is used to hold the index of
        //every node that DOES have a lilypad
        var path = [];
        //posse is an array that is used to hold the index of all nodes adjacent to pos
        var posse = [];
        //possibles is an array that is used to hold all of the possible nodes we can visit from pos
        var possibles = [];
        //dirnames is an array that is used to hold the character representations of
        //of the correct inputs for jsPsych data storing and analysis later
        var dirnames = [];
        nogo.push(start);
        path.push(start);
        nogo.push(start);
        var temp;
        while(path.length-1 < dist){
            possibles = [];
            //if there we have no position to check,
            //generate a new random one
            if(pos === undefined){
                //set to 0, which will always be contained by the bounds
                var pos = 0;
                //everytime pos is in the bounds, generate a new pos
                while(bounds.includes(pos)){
                    pos = getRandomInt(map.length);
                }
                start = pos;
                nogo = [];
                path = [];
                posse = [];
                possibles = [];
                nogo.push(start);
                path.push(start);
                nogo.push(start);
            }
            //dirs stores character representations for all possible movements a player can make
            var dirs = ["D","U","R","L"];
            //podirs is used to store the possible character representation of movements that can be made to win
            var podirs = [];
            //calculate and store the index of each possible adjacent pad location
            posse.push(pos + x);
            posse.push(pos - x);
            posse.push(pos + 1);
            posse.push(pos - 1);
            //for each possible pad location: if it is in the boundary tiles, already marked as unusable, or already has a pad then
            //do not push it into the array of possible pad locations.
            for(let i = 0; i < posse.length; i++){
                if(!(bounds.includes(posse[i]) || nogo.includes(posse[i]) || path.includes(posse[i]))){
                    possibles.push(posse[i]);
                    podirs.push(dirs[i]);
                }
            }
            //clear posse now that it has been used
            posse = [];

            //if we run out of possible options, we must restart the algorithm from a new start point
            if(possibles.length == 0){
                nogo.push(pos);
                if(pos === undefined){
                    var pos = 0;
                    //0 is assumed to be part of bounds as written
                    while(bounds.includes(pos)){
                        pos = getRandomInt(map.length);
                    }
                    start = pos;
                    nogo = [];
                    path = [];
                    posse = [];
                    possibles = [];
                    nogo.push(start);
                    path.push(start);
                    nogo.push(start);
                }
                pos = path.pop();
                dirnames.pop();
            }
            else{
                //otherwise, we randomly select one of the possible options and continue
                let randy = getRandomInt(possibles.length);
                pos = possibles[randy];
                path.push(pos);
                dirnames.push(podirs[randy]);
            }
            //we store the currently examined location in a temporary variable
            //so that it is not counted in determining if the current location is legal
            var temp = path.pop();
            //we store the previous location in backtrack in case we need to
            //roll back map generation in the case we have generated an illegal map
            var backtrack = path.pop();
            //if there is a pad adjacent to the current one already
            //(excepting the one we popped into temp)
            //then this pad is illegal
            if((path.includes(temp+x))
                ||(path.includes(temp-x))
                ||(path.includes(temp+1))
                ||(path.includes(temp-1))){
                    //if the pad is illegal, mark it in nogo
                    nogo.push(temp);
                    //replace the previous pad
                    path.push(backtrack);
                    //remove the previously stored character
                    dirnames.pop();
                    //move our inspected index back to when the map was not illegal
                    pos = backtrack;
            }
            else{
                //if the map is legal, we push everything back on
                path.push(backtrack);
                path.push(temp);
                pos = temp;
            }
        }
        //once the critical features are generate, we fill the map with numbers
        //that represent what game piece exists on the tile of the relevant index
        for(let i = 0; i < path.length; i++){
            //all lilypads are stored as zeros
            map[path[i]] = 0;
        }
        //the starting location is marked with a -1
        map[start] = -1;
        //the goal location is marked with a 2
        map[path[dist]] = 2;
        //the algorithm then returns the map with the character based solution
        var data = [map,dirnames];
        return data;
    }

    
    /////////////////////////////////////
    // RENDER FUNCTIONS                //
    /////////////////////////////////////

    //preloads images specified in an array and returns the loaded list
    //useful for optimizing load times and preventing ghost graphics
    function preloadImages(array) {
        if (!preloadImages.list) {
            preloadImages.list = [];
        }
        let list = preloadImages.list;
        let loadedlist = [];
        for (let i = 0; i < array.length; i++) {
            let img = new Image();
            img.onload = function() {
                let index = list.indexOf(this);
                if (index !== -1) {
                    list.splice(index, 1);
                }
            }
            list.push(img);
            img.src = array[i];
            loadedlist.push(img);
        }
        return loadedlist;
      }

      var start = null;
      //delays a function func for int long in ms, and stores the id so they may be wiped later
      function delay(int,func){
        if(start == null){
          start = Date.now();
        }
        var progress = Date.now() - start;
        if(progress < int){
          //anon func t prevent glob
          let animId = requestAnimationFrame(function(timestamp){
            delay(int,func);
          });
          RAFids.push(animId);
        }
        else{
          start = null;
          func();
          return;
        }
      }

    function drawMap(){
        //loop over array, checking val of each index to determine fill color (or image)
        for (let index = 0; index < gameSettings.map.length; index ++) {
  
          //check array val for type of tile & set fill color accordingly
          // 1 = black 0 = white 2 = exit
          switch(gameSettings.map[index]){
            case -1:
              char.tx = index%gameSettings.row_length;
              char.ty = Math.floor(index/gameSettings.row_length)+1;
              gameSettings.map[index] = 0;
              trial_data.startpos = index;
              break;
            case 0:
              bufferCanvas.drawImage(lilypad, (index % gameSettings.row_length) * gameSettings.scale, Math.floor(index/gameSettings.row_length) * gameSettings.scale, gameSettings.scale, gameSettings.scale);
              break;
            case 1:
              //DO NOTHING, BG IS WATER
              break;
            case 2:
              bufferCanvas.drawImage(fly, (index % gameSettings.row_length) * gameSettings.scale, Math.floor(index/gameSettings.row_length) * gameSettings.scale, gameSettings.scale, gameSettings.scale);
              break;
          }
          //filled rectangle shape
        }
        gameCanvas.drawImage(bufferCanvas.canvas, 0, 0, bufferCanvas.canvas.width, bufferCanvas.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
        console.log("map drawn");
      };

      //Draw Player Character
      function charrender(){
          //for color changing player, if states to be conveyed
          //ground.fillStyle = "#ff0000"
          charx = char.tx*gameSettings.scale;
          chary = (char.ty-1)*gameSettings.scale;
          //removed if conditinal, may cause bug where frog is displayed while splash should replace it
          bufferCanvas.drawImage(lilypad, charx, chary, gameSettings.scale, gameSettings.scale);
          frogBuffer.drawImage(frog,charx,chary,gameSettings.scale,gameSettings.scale);
          if(dead == false){
            bufferCanvas.drawImage(lilypad, charx, chary, gameSettings.scale, gameSettings.scale);
            frogBuffer.drawImage(frog,charx,chary,gameSettings.scale,gameSettings.scale);
          }
          else{
            //
          }
          gameCanvas.drawImage(bufferCanvas.canvas, 0, 0, bufferCanvas.canvas.width, bufferCanvas.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
          frogboard.drawImage(frogBuffer.canvas, 0, 0, frogBuffer.canvas.width, frogBuffer.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
      };

    //makes lilypads disappear and records that the user waited the full time duration
    function blackoutrec(){
        //TUTORIAL FLAG CONDITIONAL
        if(true){
          trial_data.waited = true;
        }
        else{
          trial_data.waited = null;
        }
        blackout();
      }
  
      //makes lilypads disappear 
      function blackout(){
        //TUTORIAL FLAG CONDITIONAL
        if(true){
          frogBuffer.drawImage(lilypad, char.tx*gameSettings.scale, (char.ty-1)*gameSettings.scale, gameSettings.scale, gameSettings.scale);
          frogBuffer.drawImage(frog,charx,chary,gameSettings.scale,gameSettings.scale);
          frogboard.drawImage(frogBuffer.canvas, 0, 0, frogBuffer.canvas.width, frogBuffer.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
          //wipers.style.opacity = 0;
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

    /////////////////////////////////////
    // GAME FUNCTION                   //
    /////////////////////////////////////

    //returns the tilecode at the input x&y coordinates
    function collider(ix, iy){
        return gameSettings.map[ix+((iy-1)*gameSettings.row_length)];
    }

    //moves that character in the passed direction
    function moveChar(dir){
        if(!hop.paused){
          hop.currentTime = 0;
          hop.play();
        }
        else{
          hop.play();
        }
        //wipeWaiters();
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
  
      //variable that stores the incremental shift of the frog for animation and scaling
      let totshift = 0;
      
      //this function animates the hop, and does so using the buffered canvas method
      function animateHop(timestamp,int){
        //shift should be a multiple scale
        //AREA OF CONCERN
        var framesPerHop = 10;
        var shift = (gameSettings.scale/framesPerHop);
        //document.ontouchstart = null;
        dPadActive(false);
        document.onkeydown = null;
        var padcheck = false;
        frogBuffer.clearRect(0,0,frogBuffer.canvas.width,frogBuffer.canvas.height);
        frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
        switch(int){
          case 1:
            if(gameSettings.walkable.includes(collider(char.tx,char.ty))){
              padcheck = true;
            }
            frog.src = sprites[7].src;
            chary = chary+shift;
            break;
          case 2:
            if(gameSettings.walkable.includes(collider(char.tx,char.ty))){
              padcheck = true;
            }
            frog.src = sprites[5].src;
            charx = charx-shift;
            break;
          case 3:
            if(gameSettings.walkable.includes(collider(char.tx,char.ty))){
              padcheck = true;
            }
            frog.src = sprites[6].src;
            charx = charx+shift;
            break;
          case 4:
            if(gameSettings.walkable.includes(collider(char.tx,char.ty))){
              padcheck = true;
            }
            frog.src = sprites[4].src;
            chary = chary-shift;
            break;
        }
        totshift = totshift+shift;
        if(padcheck){
          pad.clearRect(0,0,pad.canvas.width,pad.canvas.height);
          pad.drawImage(lilypad, char.tx*gameSettings.scale, (char.ty-1)*gameSettings.scale, gameSettings.scale, gameSettings.scale);
          pad.globalAlpha = totshift/gameSettings.scale;
          frogboard.drawImage(pad.canvas, 0, 0, pad.canvas.width, pad.canvas.height, 0, 0, frogboard.canvas.width, frogboard.canvas.height);
          pad.clearRect(0,0,pad.canvas.width,pad.canvas.height);
        }
        frogBuffer.drawImage(frog,charx,chary,gameSettings.scale,gameSettings.scale);
        frogboard.drawImage(frogBuffer.canvas, 0, 0, frogBuffer.canvas.width, frogBuffer.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
        if(Math.round(totshift)<gameSettings.scale){
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
              frog.src = sprites[0].src;
              break;
            case "frogDJ":
              frog.src = sprites[3].src;
              break;
            case "frogLJ":
              frog.src = sprites[1].src;
              break;
            case "frogRJ":
              frog.src = sprites[2].src;
              break;
          }    
          frogBuffer.clearRect(0,0,frogBuffer.canvas.width,frogBuffer.canvas.height);
          frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
          pad.drawImage(lilypad, char.tx*gameSettings.scale, (char.ty-1)*gameSettings.scale, gameSettings.scale, gameSettings.scale);
          frogboard.drawImage(pad.canvas, 0, 0, pad.canvas.width, pad.canvas.height, 0, 0, frogboard.canvas.width, frogboard.canvas.height);
          frogBuffer.drawImage(frog,charx,chary,gameSettings.scale,gameSettings.scale);
          frogboard.drawImage(frogBuffer.canvas, 0, 0, frogBuffer.canvas.width, frogBuffer.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
          start = null;
          totshift = 0;
          document.onkeydown = dirCheckK;
          dpad.src = "img/dpad.svg";
          dPadActive(true);
          if(gameSettings.walkable.includes(collider(char.tx,char.ty))){
            wincheck();
          }
          else{
            die();
          }
        }
      }
  
      //Wrapped functions for event based calls
      function animateHopD(){
        animateHop(Date.now(),1);
      }
      function animateHopL(){
        animateHop(Date.now(),2);
      }
      function animateHopR(){
        animateHop(Date.now(),3);
      }
      function animateHopU(){
        animateHop(Date.now(),4);
      }
      function moveU(){
        moveChar(8);
      }
      function moveD(){
        moveChar(2);
      }
      function moveL(){
        moveChar(4);
      }
      function moveR(){
        moveChar(6);
      }

    //value to indicate progress into splash animation for recursive animation render function 
    let splashVal = 1;

    function animateSplash(timestamp){
      if(splashVal<4){
        console.log("DRAW FRAME 1");
        cross.src = sprites[11].src;
      }
      else if(splashVal<7){
        console.log("DRAW FRAME 2");
        cross.src = sprites[12].src;
      }
      else if(splashVal<10){
        console.log("DRAW FRAME 3");
        cross.src = sprites[13].src;
      }
      bufferCanvas.clearRect(0,0,bufferCanvas.canvas.width,bufferCanvas.canvas.height);
      gameCanvas.clearRect(charx,chary,gameSettings.scale,gameSettings.scale);
      gameCanvas.drawImage(bufferCanvas.canvas, 0, 0, bufferCanvas.canvas.width, bufferCanvas.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
      bufferCanvas.drawImage(cross, charx,chary, gameSettings.scale, gameSettings.scale);
      gameCanvas.drawImage(bufferCanvas.canvas, 0, 0, bufferCanvas.canvas.width, bufferCanvas.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
      if(splashVal < 16){
        splashVal++;
        window.requestAnimationFrame(animateSplash);
      }
      else{
        splashVal = 1;
        cross.src = sprites[11];
      }
    }

      //activate or deactivates the dpad based on the boolean value parameter
      //true = dpad on
      function dPadActive(bool){
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

    function setTime(){
      var temptime = performance.now();
      trial_data.ttp.push(temptime-time);
      time = temptime;      
    }

      //checks what key pressed, then moves char as appropriate
    function dirCheckK(e){
      setTime();
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
  

    /////////////////////////////////////
    // GAME INITIALIZATION             //
    /////////////////////////////////////

    function initSounds(){
      //hop = document.getElementById("hop");
      hop.volume = .5;
      bgm.volume = 0.7;
      //should be moved to an onclick for user interaction to set it off
      /*
      if(bgm.paused && !silenced){
        bgm.play();
      }
      */
    }

    // Game Starter
    function beginGame(){

      // Get the game field width/height.
      // Note that the logical ingame width/height will always be as they are in config.js
      // (in this example it is 540x960). Logical ingame pixels automatically scale to
      // physical canvas style size.
      const GAME_WIDTH = resizer.getGameWidth();
      const GAME_HEIGHT = resizer.getGameHeight();

        // 10px margin on all sides
      const margin = 10;

      //set proper pixel scaling
      if(GAME_WIDTH < GAME_HEIGHT){
        gameSettings.scale = Math.floor(GAME_WIDTH/gameSettings.row_length);// + Math.floor(.5*display_element.clientWidth/trial.row_length);
      }
      else{
        gameSettings.scale = Math.floor(GAME_HEIGHT/gameSettings.row_length);
      }

      //generate a map, and output an array [map, solution]
      let data = dfsGen(gameSettings.row_length, gameSettings.column_height, gameSettings.exit_length);
      //save the map in the trial_data while also storing it as the map to be used for this iteration of the game
      trial_data.map, gameSettings.map = data[0];
      //save the solution in the trial_data
      trial_data.solution = data[1];

      drawMap();
      charrender();
      initSounds();

      //blackout flag must be set before begin
      bo = false;
      document.onkeydown = dirCheckK;
      //document.ontouchstart = dirCheckM;
      dPadActive(true);
      time = performance.now();
      delay(gameSettings.blackout_speed,blackoutrec);

    }

    //void return function that manages data on player success and then ends the map
    function win(){
        //wipeTimeouts();
        trial_data.map[trial_data.startpos] = -1;
        trial_data.success = true;
        jsPsych.finishTrial(trial_data);
    }
    
    //Separate check for win, so you are actualy displayed ON the wincon
    function wincheck(){
        if(gameSettings.map[char.tx+((char.ty-1)*gameSettings.x)] == 2){
          //block input whilewin screen is up
          //wipers.style.opacity = 1;
          document.onkeydown = null;
          dPadActive(false);
          bo = false;
          if(tutover){updateInfo();}
          frogBuffer.drawImage(check,0,0,bufferCanvas.canvas.width,bufferCanvas.canvas.height);
          frogboard.drawImage(frogBuffer.canvas, 0, 0, frogBuffer.canvas.width, frogBuffer.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
          ding.play();
          bo = false;
          delay(500,win);
        }
    }
      
    //void return function that manages data on player failure and then ends the map
    function lose(){
        //wipeTimeouts();
        //trial_data.map[trial_data.startpos] = -1;
        trial_data.success = false;
        //jsPsych.finishTrial(trial_data);
    }

    //draws relevant failure based graphics and animations, plays the splash sound, and calls the lose function
    function die(){
        document.onkeydown = null;
        dPadActive(false);
        bo = false;
        dead = true;
        //wipers.style.opacity = 1;
        frogBuffer.clearRect(0,0,frogBuffer.canvas.width,frogBuffer.canvas.height);
        frogboard.clearRect(0,0,frogboard.canvas.width,frogboard.canvas.height);
        splash.play();
        cross.src = sprites[13].src;
        bufferCanvas.drawImage(cross, charx,chary, gameSettings.scale, gameSettings.scale);
        gameCanvas.drawImage(bufferCanvas.canvas, 0, 0, bufferCanvas.canvas.width, bufferCanvas.canvas.height, 0, 0, gameCanvas.canvas.width, gameCanvas.canvas.height);
        window.requestAnimationFrame(animateSplash);
        bo = false;
        delay(500,lose);
    }



    /////////////////////////////////////
    // Mainline logic
    /////////////////////////////////////

    // Begin the arbitrary thing example loop
    beginGame();


// Close and execute the IIFE here
})();
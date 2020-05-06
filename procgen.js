//random generation algorithms


//calculates the bounds of a given array so wall tiles surround the field
//requires an x & y specification of the array's dimensions
//returns an array of all indices in the given array that form a bounding box around it
calculateBounds = function(arr,x,y){
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
dfsGen = function(x,y,dist){
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
            randy = getRandomInt(possibles.length);
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


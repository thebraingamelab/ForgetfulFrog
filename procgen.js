//random generation algorithms
//requires dimensional input
drunkardWalk = function(x,y,pathlen,exitlength){
    var map = [];
    //fills the map with walls
    for(let i = 0; i < x*y; i++){
        map.push(1);
    }
    var pos = getRandomInt(map.length);
    //console.log("start: "+pos);
    var start = pos;
    //console.log("pos: "+pos);
    for(let i = 0; i < pathlen; i++){
        if(i == exitlength){
            map[pos] = 2;
            //if length of ENTIRE MAP is one path to the exit
            //break;
        }
        else{
            switch(getRandomInt(4)){
                //move up
                case 0:
                    pos = pos - x;
                    map[pos] = 0;
                    break;
                //move down
                case 1:
                    pos = pos + x;
                    map[pos] = 0;
                    break;
                //move left
                case 2:
                    pos = pos - 1;
                    map[pos] = 0;
                    break;
                //move right
                case 3:
                    pos = pos + 1;
                    map[pos] = 0;
                    break;
            }
        }
    }
    map[start] = -1;
    return map;
}


var walkable = [-1,0,2];
var walkqueue = [];
var targets = [];
var bounds = [];

boundedWalk = function(x,y,pathlen,exitlength){
    var map = [];
    //fills the map with walls
    for(let i = 0; i < x*y; i++){
        map.push(1);
    }
    var bounds = calculateBounds(map,x,y);
    //console.log(bounds);
    var pos = 0;
    while(bounds.includes(pos)){
        pos = getRandomInt(map.length);//(x*y)/2;
    }
    //console.log("start: "+pos);
    var start = pos;
    var end;
    //console.log("pos: "+pos);
    var temp;
    for(let i = 0; i < pathlen; i++){
        if((pos < 0) || (pos > map.length)){
            //console.log("problem child: "+pos);
        }
        if(i == exitlength){
            //end = pos;
            //if length of ENTIRE MAP is one path to the exit
            //break;
        }
        else{
            //console.log("cleared spaces: "+i);
            var dir = getRandomInt(4);
            switch(dir){
                //move up
                case 0:
                    temp = pos - x;
                    if(bounds.includes(temp)){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        break;
                    }
                //move down
                case 1:
                    temp = pos + x;
                    if(bounds.includes(temp)){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        break;
                    }
                //move left
                case 2:
                    temp = pos - 1;
                    if(bounds.includes(temp)){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        break;
                    }
                //move right
                case 3:
                    temp = pos + 1;
                    if(bounds.includes(temp)){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        break;
                    }
            }
        }
    }
    map[start] = -1;
    //BUG: Can start on end
    //map[end] = 2;
    end = randEnd(map,x,start,exitlength);
    if(end === undefined){
        return boundedWalk(x,y,pathlen+exitlength,exitlength);
    }
    else{
        map[end] = 2;
    }
    return map;
}

randEnd = function(arr,x,startpos,exitlength){
    visited = [];
    targets = [];
    unusables = [];
    genEndpointRadii(arr,exitlength,x,startpos);
    //console.log("Endpoints: "+targets);
    var exit = targets[Math.floor(Math.random()*targets.length)];
    //console.log(exit);
    return exit;
}

genEndpointRadii = function(arr,magnitude,x,start){
    walkqueue.push({
        pos: start,
        walks: 0
    });
    walk(arr,magnitude,x);
}

boundsCheck = function(index,x,y){
    if((index>(x*y))||(index<0)){
        return false;
    }
    else{
        return true;
    }
}

var visited = [];
//must not be working
walkcheck = function(arr,pos){
    if(!(visited.includes(arr[pos])) && (arr[pos] < 1) && !(bounds.includes(arr[pos]))){
        return true;
    }
    else{
        return false;
    }
}

var unusables = [];
//add thing to check if a visited thing is in targets and remove it if below magnitude walks
walk = function(arr,mag,x){
    var loc = walkqueue.shift();
    //console.log("POS: "+loc.pos);
    //console.log("VAL: "+arr[loc.pos]);
    if(walkcheck(arr,loc.pos)){
        if((loc.walks == mag) && !(unusables.includes(loc.pos))){
            if(!targets.includes(loc.pos)){targets.push(loc.pos);}
            //shouldn't return, always only one result
            //return;
        }
        else{
            unusables.push(loc.pos);
            if(visited.includes(loc.pos)){
                //console.log("BLOCKED!")
            }
            else{
                if(targets.includes(loc.pos)){
                    targets.filter(function(val){
                        return val != loc.pos;
                    })
                }
                visited.push(loc.pos);
                //console.log("visited: "+visited);
                if(walkcheck(arr,loc.pos+x)){
                    walkqueue.push({
                        pos: loc.pos + x,
                        walks: loc.walks + 1
                    });
                }
                if(walkcheck(arr,loc.pos-x)){
                    walkqueue.push({
                        pos: loc.pos - x,
                        walks: loc.walks + 1
                    });
                }
                if(walkcheck(arr,loc.pos+1)){
                    walkqueue.push({
                        pos: loc.pos + 1,
                        walks: loc.walks + 1
                    });
                }
                if(walkcheck(arr,loc.pos-1)){
                    walkqueue.push({
                        pos: loc.pos - 1,
                        walks: loc.walks + 1
                    });
                }
            }
        }
    }
    if((walkqueue.length > 0)){
        walk(arr,mag,x);
    }
}

//CURRENTLY BROKEN, DO NOT USE
//MINIMAL TIME HAS BEEN SPENT ON THIS
//INFINITE LOOP HAZARD
soberWalk = function(x,y,pathlen,exitlength){
    var map = [];
    //fills the map with walls
    for(let i = 0; i < x*y; i++){
        map.push(1);
    }
    var bounds = calculateBounds(map,x,y);
    //console.log(bounds);
    var pos = 0;
    while(bounds.includes(pos)){
        pos = getRandomInt(map.length);
    }
    //console.log("start: "+pos);
    var start = pos;
    var nogo = [];
    //console.log("pos: "+pos);
    var temp;
    for(let i = 0; i < pathlen; i++){
        if((pos < 0) || (pos > map.length)){
            //console.log("problem child: "+pos);
        }
        if(i == exitlength){
            //end = pos;
            //if length of ENTIRE MAP is one path to the exit
            //break;
        }
        else{
            //console.log("cleared spaces: "+i);
            var dir = getRandomInt(4);
            switch(dir){
                //move up
                case 0:
                    temp = pos - x;
                    if((bounds.includes(temp)) || (nogo.includes(temp))){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        nogo.push(pos);
                        break;
                    }
                //move down
                case 1:
                    temp = pos + x;
                    if((bounds.includes(temp)) || (nogo.includes(temp))){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        nogo.push(pos);
                        break;
                    }
                //move left
                case 2:
                    temp = pos - 1;
                    if((bounds.includes(temp)) || (nogo.includes(temp))){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        nogo.push(pos);
                        break;
                    }
                //move right
                case 3:
                    temp = pos + 1;
                    if((bounds.includes(temp)) || (nogo.includes(temp))){
                        i--;
                        //console.log("bounded");
                        break;
                    }
                    else{
                        pos = temp;
                        map[pos] = 0;
                        nogo.push(pos);
                        break;
                    }
            }
        }
    }
    map[start] = -1;
    //BUG: Can start on end
    //map[end] = 2;
    map[randEnd(map,x,start,exitlength)] = 2;
    return map;
}


dijkstraWalk = function(arr, startpos, x, mag){
    //create vertex set q
    var q = vertFind(arr,startpos);
    var temp = 999999999;
    var u;
    while(q.length>0){
        for(let i = 0; i < q.length; i++){
            if(q[i].dist < temp){
                u = q[i];
            }
            //UNFINISHED
        }
    }
}

getNeighbors = function(){}

vertFind = function(arr,startpos){
    var verts = [];
    for(let i = 0; i < arr.length; i++){
        if(arr[i] == 0){
            if(i == startpos){
                verts.push({
                    index: startpos,
                    dist: 0,
                    prev: undefined
                })}
            else{
                verts.push({
                    index: i,
                    dist: 999999,
                    prev: undefined
                });
            }
        }
    }
    return verts;
}

perlinNoise = function(){}

//var safetyLatch = 0;
//Quaternary Doubly Deep Depth First Search Generator
dfsGen = function(x,y,dist){
    var map = [];
    //fills the map with walls
    for(let i = 0; i < x*y; i++){
        map.push(1);
    }
    var bounds = calculateBounds(map,x,y);
    //console.log(bounds);
    var pos = 0;
    //0 is assumed to be part of bounds as written
    while(bounds.includes(pos)){
        pos = getRandomInt(map.length);
    }
    var start = pos;
    safetyLatch = 0;
    var nogo = [];
    var path = [];
    var posse = [];
    var possibles = [];
    var sol = [];
    nogo.push(start);
    path.push(start);
    nogo.push(start);
    var temp;
    while(path.length-1 < dist){
        possibles = [];
        if(pos === undefined){
            var pos = 0;
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
        var dirs = ["D","U","R","L"];
        var podirs = [];
        posse.push(pos + x);
        posse.push(pos - x);
        posse.push(pos + 1);
        posse.push(pos - 1);
        for(let i = 0; i < posse.length; i++){
            if(!(bounds.includes(posse[i]) || nogo.includes(posse[i]) || path.includes(posse[i]))){
                possibles.push(posse[i]);
                podirs.push(dirs[i]);
            }
        }
        posse = [];

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
            sol.pop();
        }
        else{
            randy = getRandomInt(possibles.length);
            pos = possibles[randy];
            path.push(pos);
            sol.push(podirs[randy]);
        }
        var temp = path.pop();
        var backtrack = path.pop();
        if((path.includes(temp+x))
            ||(path.includes(temp-x))
            ||(path.includes(temp+1))
            ||(path.includes(temp-1))){
                nogo.push(temp);
                path.push(backtrack);
                sol.pop();
                pos = backtrack;
                //console.log("RETRACING, BACKTRACK: "+temp);
        }
        else{
            path.push(backtrack);
            path.push(temp);
            pos = temp;
        }
    }
    for(let i = 0; i < path.length; i++){
        map[path[i]] = 0;
    }
    map[start] = -1;
    map[path[dist]] = 2;
    var data = [map,sol];
    return data;
}

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


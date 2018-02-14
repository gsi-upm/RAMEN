/// <reference path="../../lib/three.d.ts" />
/// <reference path="human.ts" />

module BP3D.Three {
    export var LoadMovement = function (scene, model) {

        var scene = scene;
        var model = model;

        var movementJSON;
        var allRooms;
        var allRooms2;
        var allRooms3;

        var steps;
        var type = scene.type;

        var human;
        var outBuilding;
        var fire;

        function init() {
            //Loading JSON with the rooms assignation
            if(scene.rooms == undefined){
                $.ajax('/js/maps/rooms.json', {
                    async: false,
                    dataType: 'text',
                    success: function (data) {
                        allRooms2 = data;
                    }
                });
                allRooms3 = JSON.parse(allRooms2);
                allRooms = allRooms3.room;
                scene.rooms = allRooms;
            }


            if (scene.realTime){
                //Creating agents
                human = new Human(scene, model, [], type, scene.rooms);
            }
            else{
                var jsonMove = JSON.parse(scene.movementJSON);
                steps = jsonMove.steps;
                type = jsonMove.type;
                //Creating agents
                human = new Human(scene, model, steps, type, scene.rooms);
            }
            human.setOutBuilding(whichRoom("outBuilding"));


        }

        //Reading movements
        this.moveAll = function (step) {
            //Only execute one time each step
            if (scene.flag == 1) {
                var stepArr;
                //Taking the current step
                if(scene.realTime){
                    stepArr = scene.realSteps;
                }
                else{
                    stepArr = steps[step];
                }
                console.log("stepArr", stepArr);
                if (stepArr && stepArr.length != 0) {
                    //Reading actions of the step
                    for (var i = 0; i < stepArr.length; i++) {
                        if (stepArr[i].agent != undefined) {
                            //Add new agent if not defined
                            if (scene.meshes[stepArr[i].agent] == undefined) {
                                addNewAgent(stepArr, i);
                            }
                            //Move agent
                            else {
                                //Rooms or Coordinates
                                if (type == 0 || type == 1) {
                                    moveAgentByRoomOrCoordinates(stepArr, i, step);
                                }
                                //Direction and speed
                                else {
                                    moveAgentByDirection(stepArr, i);
                                }
                            }
                        }

                        //Lights ON or OFF
                        if (stepArr[i].light != undefined) {
                            let roomNumber;
                            if (stepArr[i].room != undefined){
                                let room = whichRoom(stepArr[i].room);
                                roomNumber = human.getRoom(room.x, room.y);
                            }
                            else if(stepArr[i].position != undefined){
                                roomNumber = human.getRoom(stepArr[i].position.x, stepArr[i].position.y);
                            }
                            setRoomLight(roomNumber, stepArr[i].light);
                        }

                        //Turn ON TV
                        if (stepArr[i].video != undefined) {
                            if(stepArr[i].room != undefined){
                                var roomCoordinates = whichRoom(stepArr[i].room);
                            }
                            else if(stepArr[i].position != undefined){
                                var roomCoordinates = {"x":stepArr[i].position.x, "y": stepArr[i].position.y};
                            }
                            var video = new Video(scene, model, human.getRoom(roomCoordinates.x, roomCoordinates.y));
                        }

                        //FIRE
                        if (stepArr[i].fire != undefined) {
                            if (stepArr[i].fire == true) {
                                if (fire == undefined) {
                                    fire = new Fire(scene, model);
                                }
                                var position = stepArr[i].position;
                                fire.setFire(position);
                            }
                        }
                        scene.flag = 0;
                    }
                }
            }
            //Move meshes every render
            human.moveMeshes();
        };

        function addNewAgent(stepArr, i){
            //Setting position
            console.log("stepArr", stepArr, "i", i);
            if(stepArr[i].position != undefined){
                if (type == 0) {
                    var room = whichRoom(stepArr[i].position);
                    var x = room.x;
                    var y = room.y;
                }
                //Type 1 or 2
                else {
                    var x = stepArr[i].position.x;
                    var y = stepArr[i].position.y;
                }
                //Setting sentiment and rotation
                var sentiment = stepArr[i].sentiment;
                var rotation = stepArr[i].rotation;

            }
            //Position not defined, choose the position form the moveTo
            else {
                console.log("AQUI");
                if (type == 0) {
                    var position = stepArr[i].moveTo;
                    let room = whichRoom(position);
                    var x = room.x;
                    var y = room.y;
                }
                //Type 1
                else {
                    var position = stepArr[i].moveTo;
                    var x = position.x;
                    var y = position.y;
                }
                //Setting sentiment and rotation
                var sentiment = stepArr[i].sentiment;
                var rotation = stepArr[i].rotation;
            }
            //Adding agent
            human.addIndividualModelToScene(stepArr[i].agent, x, y, sentiment, rotation)
        }

        //Movement of type 0 or 1
        function moveAgentByRoomOrCoordinates(stepArr, i, step){
            if (stepArr[i].moveTo != undefined && stepArr[i].toStep != undefined) {
                let time = (stepArr[i].toStep - step) * scene.stepTime;
                //Setting coordinates to move and speed
                if (type == 0) {
                    var xTo = whichRoom(stepArr[i].moveTo).x;
                    var yTo = whichRoom(stepArr[i].moveTo).y;
                    var speed = human.calculateSpeed(scene.meshes[stepArr[i].agent].position.x, scene.meshes[stepArr[i].agent].position.y, xTo, yTo, time);
                }
                //Type 1
                else {
                    var xTo = stepArr[i].moveTo.x;
                    var yTo = stepArr[i].moveTo.y;
                    var speed = human.calculateSpeed(scene.meshes[stepArr[i].agent].position.x, scene.meshes[stepArr[i].agent].position.y, xTo, yTo, time);

                }
                //Setting rotation and outBuilding
                var rotation = getRotation(stepArr[i].rotation);
                var out = getOutBuilding(stepArr[i].outBuilding);
                //Adding movement of mesh to the list
                human.pushMeshesMoving({
                    "agent": stepArr[i].agent,
                    "to": {"x": xTo, "y": yTo},
                    "speed": speed,
                    "startTime": Date.now(),
                    "time": time,
                    "finalStep": stepArr[i].toStep,
                    "rotation": rotation,
                    "outBuilding": out
                });
            }
            //Setting sentiment
            if (stepArr[i].sentiment != undefined) {
                human.changeColorEmotion2(stepArr[i].sentiment, stepArr[i].agent);
            }

        }
        //Movement of type 2
        function moveAgentByDirection(stepArr, i) {
            //Setting rotation and outBuilding
            var rotation = getRotation(stepArr[i].rotation);
            var out = getOutBuilding(stepArr[i].outBuilding);
            var mixers = human.getMixers();
            if (stepArr[i].direction != undefined && stepArr[i].speed != undefined) {
                var movingMeshes = human.getMeshesMoving();
                //Setting direction and speed
                var direction = stepArr[i].direction;
                var sp = stepArr[i].speed;
                //Erase previous movement
                for (var j = 0; j < movingMeshes.length; j++) {
                    if (movingMeshes[j].agent == stepArr[i].agent) {
                        movingMeshes.splice(j, 1);
                        human.setMeshesMoving(movingMeshes);
                    }
                }
                //Adding new movement
                human.pushMeshesMoving({
                    "agent": stepArr[i].agent,
                    "direction": direction,
                    "speed": sp,
                    "rotation": rotation,
                    "outBuilding": out
                });
            }
            //Setting sentiment
            if (stepArr[i].sentiment != undefined) {
                human.changeColorEmotion2(stepArr[i].sentiment, stepArr[i].agent);
            }
            //Stop Agent
            if (stepArr[i].stop != undefined && stepArr[i].stop == true) {
                var stop = stepArr[i].stop;
                var movingMeshes = human.getMeshesMoving();
                for (var j = 0; j < movingMeshes.length; j++) {
                    if (movingMeshes[j].agent == stepArr[i].agent) {
                        //Stop Animation
                        mixers[stepArr[i].agent].clipAction(human.getClip()).stop();
                        human.setMixers(mixers);
                        //Erase from list of movements
                        movingMeshes.splice(j, 1);
                        human.setMeshesMoving(movingMeshes);
                        //Setting rotation
                        if(stepArr[i].rotation != undefined){
                            scene.meshes[stepArr[i].agent].rotation.y = getDirection(stepArr[i].rotation);
                        }
                    }
                }
            }
            //Erase agent if outBuilding
            if (out && out == true) {
                //Stop animation
                mixers[stepArr[i].agent].clipAction(human.getClip()).stop();
                human.setMixers(mixers);
                //Remove agent
                scene.remove(scene.meshes[stepArr[i].agent]);
                scene.meshes[stepArr[i].agent] = null;
            }
        }

        //TRUE -> Light ON, FALSE -> Light OFF
        function getRoomLight(room){
            var texture = model.floorplan.getRooms()[room].getTexture().url;
            return texture == "rooms/textures/hardwood.png";
        }

        function setRoomLight(room, on){
            //Getting the walls
            var walls = model.floorplan.getRooms()[room].updateWallsTexture();
            for (var i = 0; i<walls.length; i++){
                //Check where is the wall headed
                if(walls[i].to == false){
                    //Turn on
                    if(on == "high"){
                        walls[i].backEdge.setTexture("rooms/textures/wallmap.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood.png", true, 300);
                    }
                    //Turn medium
                    else if (on == "medium"){
                        walls[i].backEdge.setTexture("rooms/textures/walllightmap_medium.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_medium.png", true, 300);
                    }
                    //Turn off
                    else if (on == "low"){
                        walls[i].backEdge.setTexture("rooms/textures/walllightmap_dark.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_dark.png", true, 300);
                    }
                }
                else{
                    //Turn on
                    if(on == "high"){
                        walls[i].frontEdge.setTexture("rooms/textures/wallmap.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood.png", true, 300);
                    }
                    //Turn medium
                    else if (on == "medium"){
                        walls[i].frontEdge.setTexture("rooms/textures/walllightmap_medium.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_medium.png", true, 300);
                    }
                    //Turn off
                    else if (on == "low"){
                        walls[i].frontEdge.setTexture("rooms/textures/walllightmap_dark.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_dark.png", true, 300);

                    }
                }
            }

        }

        //Return the center of the room
        function whichRoom(room) {
            for (var j = 0; j < scene.rooms.length; j++) {
                if (room == scene.rooms[j].name) {
                    var x = scene.rooms[j].x;
                    var y = scene.rooms[j].y;
                    return {"x": x, "y": y};
                }
            }
        }

        function getRotation(rotationValue){
            var rotation = undefined;
            if (rotationValue != undefined){
                rotation = getDirection(rotationValue);
            }
            return rotation;
        }

        function getOutBuilding(outBuildingValue){
            var out = undefined;
            if (outBuildingValue != undefined){
                out = outBuildingValue;
            }
            return out;
        }

        function getDirection(direction) {
            switch(direction){
                case "N":
                    return Math.PI;
                case "NE":
                    return 3*Math.PI/4;
                case "E":
                    return Math.PI/2;
                case "SE":
                    return Math.PI/4;
                case "S":
                    return 0;
                case "SW":
                    return -Math.PI/4;
                case "W":
                    return -Math.PI/2;
                case "NW":
                    return -3*Math.PI/4;
            }
        }

        init();
    }
}
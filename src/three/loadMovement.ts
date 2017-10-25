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
        var type;

        var human;
        var outBuilding;
        var fire;

        function init() {

            //Loading JSON with the movement
            $.ajax('/js/lab_move2.json', {
                async: false,
                dataType: 'text',
                success: function (data2) {
                    movementJSON = data2;
                }
            });

            var jsonMove = JSON.parse(movementJSON);
            steps = jsonMove.steps;
            type = jsonMove.type;

            $.ajax('/js/rooms_Lab.json', {
                async: false,
                dataType: 'text',
                success: function (data) {
                    allRooms2 = data;
                }
            });

            allRooms3 = JSON.parse(allRooms2);
            allRooms = allRooms3.room;

            human = new Human(scene, model, steps, type, allRooms);
            human.setOutBuilding(whichRoom("outBuilding"));

        }

        this.moveAll = function (step) {
            var step2 = step;
            if (scene.flag == 1) {
                var stepArr = steps[step];
                if (stepArr && stepArr.length != 0) {
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
                                    moveAgentByRoomOrCoordinates(stepArr, i, step2);
                                }
                                //Direction and speed
                                else {
                                    moveAgentByDirection(stepArr, i);
                                }
                                scene.flag = 0;
                            }
                        }

                        //Lights ON or OFF
                        if (stepArr[i].light != undefined) {
                            let room = whichRoom(stepArr[i].room);
                            let roomNumber = human.getRoom(room.x, room.y);
                            setRoomLight(roomNumber, stepArr[i].light);
                        }

                        //Turn ON TV
                        if (stepArr[i].video != undefined) {
                            var roomCoordinates = whichRoom(stepArr[i].room);
                            // var room = getRoom(roomCoordinates.x, roomCoordinates.y);
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
                    }
                }
            }
            human.moveMeshes();
        };

        function addNewAgent(stepArr, i){

            if(stepArr[i].position != undefined){
                if (type == 0) {
                    var room = whichRoom(stepArr[i].position);
                    var x = room.x;
                    var y = room.y;
                }
                else {
                    var x = stepArr[i].position.x;
                    var y = stepArr[i].position.y;
                }
                var sentiment = stepArr[i].sentiment;
                var rotation = stepArr[i].rotation;

            } else {
                if (type == 0) {
                    var position = stepArr[i].moveTo;
                    let room = whichRoom(position);
                    var x = room.x;
                    var y = room.y;
                }
                else {
                    var position = stepArr[i].moveTo;
                    var x = position.x;
                    var y = position.y;
                }

                var sentiment = stepArr[i].sentiment;
                var rotation = stepArr[i].rotation;
            }
            human.addIndividualModelToScene(stepArr[i].agent, x, y, sentiment, rotation)

        }

        function moveAgentByRoomOrCoordinates(stepArr, i, step){
            if (stepArr[i].moveTo != undefined && stepArr[i].toStep != undefined) {
                let time = (stepArr[i].toStep - step) * scene.stepTime;
                if (type == 0) {
                    var xTo = whichRoom(stepArr[i].moveTo).x;
                    var yTo = whichRoom(stepArr[i].moveTo).y;
                    var speed = human.calculateSpeed(scene.meshes[stepArr[i].agent].position.x, scene.meshes[stepArr[i].agent].position.y, xTo, yTo, time);

                }
                else {
                    var xTo = stepArr[i].moveTo.x;
                    var yTo = stepArr[i].moveTo.y;
                    var speed = human.calculateSpeed(scene.meshes[stepArr[i].agent].position.x, scene.meshes[stepArr[i].agent].position.y, xTo, yTo, time);

                }

                var rotation = getRotation(stepArr[i].rotation);
                var out = getOutBuilding(stepArr[i].outBuilding);

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
            if (stepArr[i].sentiment != undefined) {
                human.changeColorEmotion2(stepArr[i].sentiment, stepArr[i].agent);
            }

        }

        function moveAgentByDirection(stepArr, i) {
            var rotation = getRotation(stepArr[i].rotation);
            var out = getOutBuilding(stepArr[i].outBuilding);
            console.log("OUTQ", out);
            var mixers = human.getMixers();
            if (stepArr[i].direction != undefined && stepArr[i].speed != undefined) {
                var movingMeshes = human.getMeshesMoving();
                var direction = stepArr[i].direction;
                var sp = stepArr[i].speed;

                for (var j = 0; j < movingMeshes.length; j++) {
                    if (movingMeshes[j].agent == stepArr[i].agent) {
                        movingMeshes.splice(j, 1);
                        human.setMeshesMoving(movingMeshes);
                    }
                }

                human.pushMeshesMoving({
                    "agent": stepArr[i].agent,
                    "direction": direction,
                    "speed": sp,
                    "rotation": rotation,
                    "outBuilding": out
                });

            }
            if (stepArr[i].sentiment != undefined) {
                human.changeColorEmotion2(stepArr[i].sentiment, stepArr[i].agent);
            }

            if (stepArr[i].stop != undefined && stepArr[i].stop == true) {
                var stop = stepArr[i].stop;
                var movingMeshes = human.getMeshesMoving();
                for (var j = 0; j < movingMeshes.length; j++) {
                    if (movingMeshes[j].agent == stepArr[i].agent) {
                        mixers[stepArr[i].agent].clipAction(human.getClip()).stop();
                        human.setMixers(mixers);
                        movingMeshes.splice(j, 1);
                        human.setMeshesMoving(movingMeshes);
                        if(stepArr[i].rotation != undefined){
                            scene.meshes[stepArr[i].agent].rotation.y = getDirection(stepArr[i].rotation);
                        }

                    }
                }
            }
            if (out && out == true) {
                mixers[stepArr[i].agent].clipAction(human.getClip()).stop();
                human.setMixers(mixers);
                scene.remove(scene.meshes[stepArr[i].agent]);
                scene.meshes[stepArr[i].agent] = null;
            }
        }

        function getRoomLight(room){
            var texture = model.floorplan.getRooms()[room].getTexture().url;
            //TRUE -> Light ON, FALSE -> Light OFF
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

        function whichRoom(room) {
            for (var j = 0; j < allRooms.length; j++) {
                if (room == allRooms[j].name) {
                    var x = allRooms[j].x;
                    var y = allRooms[j].y;
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
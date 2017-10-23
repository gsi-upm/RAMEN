/// <reference path="../../lib/three.d.ts" />

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

            human = new Human(scene, model, steps, type);

            $.ajax('/js/rooms_Lab.json', {
                async: false,
                dataType: 'text',
                success: function (data) {
                    allRooms2 = data;
                }
            });

            allRooms3 = JSON.parse(allRooms2);
            allRooms = allRooms3.room;

        }

        this.moveAll = function (step) {
            if (scene.flag == 1) {
                var stepArr = steps[step];
                if (stepArr && stepArr.length != 0) {
                    for (var i = 0; i < stepArr.length; i++) {
                        //Add new agent if not defined
                        if (stepArr[i].agent != undefined) {
                            if (scene.meshes[stepArr[i].agent] == undefined) {
                                addNewAgent(stepArr, i);
                            }
                            //Move agent
                            else {
                                //Rooms or Coordinates
                                if (type == 0 || type == 1) {
                                    moveAgentByRoomOrCoordinates(stepArr, i);
                                }
                                //Direction and speed
                                else {
                                    moveAgentByDirection(stepArr, i);
                                }
                                scene.flag = 0;
                            }
                        }
                    }
                }
                if (stepArr[i].light != undefined){
                    let room = whichRoom(stepArr[i].room);
                    let roomNumber = human.getRoom(room.x, room.y);
                    human.setRoomLight(roomNumber, stepArr[i].light);
                }

                if (stepArr[i].video != undefined){
                    var roomCoordinates = whichRoom(stepArr[i].room);
                    // var room = getRoom(roomCoordinates.x, roomCoordinates.y);
                    var video = new Video(scene, model, human.getRoom(roomCoordinates.x, roomCoordinates.y));
                }

                if (stepArr[i].fire != undefined){
                    if (stepArr[i].fire == true) {
                        if(human.fire == undefined){
                            human.fire = new Fire(scene, model);
                        }
                        var position = stepArr[i].position;
                        human.fire.setFire(position);
                    }
                }
            }
            human.moveMeshes();
        }

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

        function moveAgentByRoomOrCoordinates(stepArr, i){
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

                human.meshesMoving.push({
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
                human.changeColorEmotion(stepArr[i].sentiment, stepArr[i].agent);
            }

        }

        function moveAgentByDirection(stepArr, i) {
            var rotation = getRotation(stepArr[i].rotation);
            var out = getOutBuilding(stepArr[i].outBuilding);
            if (stepArr[i].direction != undefined && stepArr[i].speed != undefined) {
                var direction = stepArr[i].direction;
                var sp = stepArr[i].speed;
                for (var j = 0; j < human.meshesMoving.length; j++) {
                    if (human.meshesMoving[j].agent == stepArr[i].agent) {
                        human.meshesMoving.splice(j, 1);
                    }
                }
                human.meshesMoving.push({
                    "agent": stepArr[i].agent,
                    "direction": direction,
                    "speed": sp,
                    "rotation": rotation,
                    "outBuilding": out
                });
            }
            if (stepArr[i].stop != undefined && stepArr[i].stop == true) {
                var stop = stepArr[i].stop;
                for (var j = 0; j < human.meshesMoving.length; j++) {
                    if (human.meshesMoving[j].agent == stepArr[i].agent) {
                        human.mixers[stepArr[i].agent].clipAction(human.clip).stop();
                        human.meshesMoving.splice(j, 1);
                    }
                }
            }
            if (out && out == true) {
                for (var j = 0; j < human.meshesMoving.length; j++) {
                    if (human.meshesMoving[j].agent == stepArr[i].agent) {
                        human.mixers[stepArr[i].agent].clipAction(human.clip).stop();
                        human.meshesMoving.splice(j, 1);
                        scene.remove(scene.meshes[stepArr[i].agent]);
                        scene.meshes[stepArr[i].agent] = null;
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
                rotation = rotationValue;
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

        init();
    }
}
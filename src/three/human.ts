/// <reference path="../../lib/three.d.ts" />
/// <reference path="loadMovement.ts" />
/// <reference path="../core/utils.ts" />

module BP3D.Three {
    export var Human = function (scene, model) {

        // var meshes = [];
        var mixers = [];
        var items = [];
        var doors = [];
        var scene = scene;
        var model = model;

        var prevTime = Date.now();
        var angleRadians;
        var floorplan;
        var clip;
        var m = 1;
        var video;

        var testing;
        var movementJSON;
        var steps;
        // var speed = 12;
        var allRooms3;
        var allRooms2;
        var allRooms;

        var meshesMoving = [];
        var outBuilding;
        var geometry1;
        // var path = ["C_5","Office4","C_5", "CI_41", "CI_42","CI_5","Lab8_2","CI_5", "Lab7","CI_5","CI_12","Lab1","CI_12"];

        var path = [ "CI_5","Lab8_2"];
        var flag = 1;

        function init() {
            $.ajax('/js/rooms.json', {
                async: false,
                dataType: 'text',
                success: function (data) {
                    allRooms2 = data;
                }
            });

            allRooms3 = JSON.parse(allRooms2);
            allRooms = allRooms3.room;
            //Loading JSON with the movement
            $.ajax('/js/movement.json', {
                async: false,
                dataType: 'text',
                success: function (data2) {
                    movementJSON = data2;
                }
            });

            var jsonMove = JSON.parse(movementJSON);
            steps = jsonMove.steps;


            // Loading JSON 3DModel
            var jsonLoader = new THREE.JSONLoader();
            jsonLoader.load( "/models/js/walkmorphcolor.json", addModelToScene);

            //Loading JSON with the doors
            $.ajax('/js/design(18).blueprint3d', {
                async: false,
                dataType: 'text',
                success: function (data) {
                    testing = data;
                }
            });

            model.floorJSON = testing;
            var json = JSON.parse(testing);
            items = json.items;
            for(var i=0; i<items.length; i++){
                if(items[i].item_name == "Open Door"){
                    doors.push(items[i]);
                }
            }

            outBuilding = whichRoom("outBuilding");

        }

        function addModelToScene( geometry, materials) {
            // Preparing animation
            for (let i = 0; i < materials.length; i++){
                materials[i].morphTargets = true;
            }
            clip = THREE.AnimationClip.CreateFromMorphTargetSequence('walk', geometry.morphTargets, 27, false);
            geometry1 = geometry;

            //Adding Mesh
            for(let j = 0; j < steps[0].length; j++){
                let material1 = new THREE.MeshLambertMaterial();
                material1.morphTargets =true;
                let mesh = new THREE.SkinnedMesh( geometry, material1 );
                mesh.scale.set(55,65,55);
                scene.add(mesh);
                scene.meshes.push(mesh);
                //Setting mesh position
                let position = steps[0][j].position;
                for(let k = 0; k < allRooms.length; k++){
                    if(position == allRooms[k].name){
                        mesh.position.x = allRooms[k].x;
                        mesh.position.z = allRooms[k].y;
                    }
                }

                //Mesh Animation
                let mixer = new THREE.AnimationMixer( mesh );
                mixers.push(mixer);

                //Mesh Emotion
                if(steps[0][j].sentiment != undefined){
                    let sentiment = steps[0][j].sentiment;
                    changeColorEmotion(sentiment, j);
                }
                //DEFAULT: happiness
                else{
                    changeColorEmotion("happiness", j);
                }

            }
            //Setting the initial time of the simulation
            scene.initialTime = Date.now();



        }

        function addIndividualModelToScene(agent, room, sentiment) {

            //Adding Mesh
            let material1 = new THREE.MeshLambertMaterial();
            material1.morphTargets =true;
            let mesh = new THREE.SkinnedMesh( geometry1, material1 );
            mesh.scale.set(55,65,55);
            scene.add(mesh);
            scene.meshes[agent] = mesh;

            //Setting mesh position
            let position = whichRoom(room);
            mesh.position.x = position.x;
            mesh.position.z = position.y;

            //Mesh Animation
            let mixer = new THREE.AnimationMixer( mesh );
            mixers[agent] = mixer;

            //Mesh Emotion
            if(sentiment != undefined){
                changeColorEmotion(sentiment, agent);
            }
            //DEFAULT: happiness
            else{
                changeColorEmotion("happiness", agent);
            }

        }

        function isValidPosition(vec3, mesh) {
            var corners = getCorners('x', 'z', vec3, mesh);

            // check if we are in a room
            var rooms = model.floorplan.getRooms();
            var isInARoom = false;
            for (var i = 0; i < rooms.length; i++) {
                if (Core.Utils.pointInPolygon(vec3.x, vec3.z, rooms[i].interiorCorners) &&
                    !Core.Utils.polygonPolygonIntersect(corners, rooms[i].interiorCorners)) {
                    isInARoom = true;
                }
            }
            //check if it is a door
            for (var j = 0; j<doors.length; j++){

                if(vec3.x > doors[j].xpos - 55  && vec3.x < doors[j].xpos + 55  && vec3.z > doors[j].zpos - 55  && vec3.z < doors[j].zpos + 55 ){
                    return true;
                }
            }
            if (!isInARoom) {
                //console.log('object not in a room');
                return false;
            }

            // check if we are outside all other objects
            /*
             if (this.obstructFloorMoves) {
             var objects = this.model.items.getItems();
             for (var i = 0; i < objects.length; i++) {
             if (objects[i] === this || !objects[i].obstructFloorMoves) {
             continue;
             }
             if (!utils.polygonOutsidePolygon(corners, objects[i].getCorners('x', 'z')) ||
             utils.polygonPolygonIntersect(corners, objects[i].getCorners('x', 'z'))) {
             //console.log('object not outside other objects');
             return false;
             }
             }
             }*/

            return true;
        }

        function getCorners(xDim, yDim, position,mesh) {

            position = position || this.position;

            var halfSize = objectHalfSize(mesh);

            var c1 = new THREE.Vector3(-halfSize.x, 0, -halfSize.z);
            var c2 = new THREE.Vector3(halfSize.x, 0, -halfSize.z);
            var c3 = new THREE.Vector3(halfSize.x, 0, halfSize.z);
            var c4 = new THREE.Vector3(-halfSize.x, 0, halfSize.z);

            var transform = new THREE.Matrix4();
            //console.log(this.rotation.y);
            //  transform.makeRotationY(this.rotation.y); //  + Math.PI/2)

            c1.applyMatrix4(transform);
            c2.applyMatrix4(transform);
            c3.applyMatrix4(transform);
            c4.applyMatrix4(transform);

            c1.add(position);
            c2.add(position);
            c3.add(position);
            c4.add(position);

            //halfSize.applyMatrix4(transform);

            //var min = position.clone().sub(halfSize);
            //var max = position.clone().add(halfSize);

            var corners = [
                { x: c1.x, y: c1.z },
                { x: c2.x, y: c2.z },
                { x: c3.x, y: c3.z },
                { x: c4.x, y: c4.z }
            ];

            return corners;
        }

        this.move = function (mesh, i, speed) {
            var time = Date.now();

            // Translation Movement
            var moveDistance = speed;
            // var moveDistance = 4;
            scene.meshes[i].translateZ(moveDistance);

            // Animation
            for (var z=0; z<mixers.length; z++){
                mixers[z].update((time - prevTime)*0.0005);
            }

            prevTime = time;

        }


        this.moveToPosition = function(mesh, i, x, y, z, speed, startTime, time, finalStep) {
            //Get floorplan for isValidPosition
            if (floorplan == undefined) {
                floorplan = model.floorplan;
            }
            //Mesh Position
            var meshX = mesh.position.x;
            var meshZ = mesh.position.z;

            let speed2 = speed / scene.fps;
            //Check if the mesh is not in a wall
            if (isValidPosition(mesh.position, mesh)) {
                //Check if the mesh is not in the final position
                if (Math.abs(meshX - x) > speed2 - 1 || Math.abs(meshZ - z) > speed2 - 1) {
                    mixers[i].clipAction(clip).play();
                    //Angle Calculation
                    angleRadians = Math.atan2(x - meshX, z - meshZ);
                    var rotationAngle = angleRadians - mesh.rotation.y;
                    if (rotationAngle > Math.PI) {
                        rotationAngle -= 2 * Math.PI;
                    }
                    else if (rotationAngle < -Math.PI) {
                        rotationAngle += 2 * Math.PI;
                    }
                    //Rotation Movement
                    if (Math.abs(rotationAngle) > 0.7) {
                        if (rotationAngle > 0) {
                            // mesh.rotation.y += 0.75;
                            mesh.rotation.y += Math.PI/4;
                        } else {
                            // mesh.rotation.y -= 0.75;
                            mesh.rotation.y -= Math.PI/4;
                        }
                    }
                    // else if (Math.abs(rotationAngle) > 0.051) {
                    //     if (rotationAngle > 0) {
                    //         mesh.rotation.y += 0.05;
                    //     } else {
                    //         mesh.rotation.y -= 0.05;
                    //     }
                    // } else if (Math.abs(rotationAngle) < 0.051 && Math.abs(rotationAngle) > 0.006) {
                    //     if (rotationAngle > 0) {
                    //         mesh.rotation.y += 0.005;
                    //     } else {
                    //         mesh.rotation.y -= 0.005;
                    //     }
                    // }
                    else {
                        //Translation Movement and Animation
                        let thisTime = Date.now();
                        // let timeElapsed = thisTime+400-startTime;
                        let timeElapsed = thisTime-startTime;
                        // if(scene.step == finalStep){
                        //     mesh.position.x = x;
                        //     mesh.position.z = z;
                        //     mixers[i].clipAction(clip).stop();
                        //     return true;
                        // }
                        if(time - timeElapsed>0){
                            // speed2 = calculateSpeed(meshX, meshZ, x, z, time-(timeElapsed)-100) / scene.fps;
                            speed2 = calculateSpeed(meshX, meshZ, x, z, time-(timeElapsed)) / scene.fps;

                            this.move(mesh, i, speed2);
                        }

                        else{
                            mesh.position.x = x;
                            mesh.position.z = z;
                            mixers[i].clipAction(clip).stop();
                            return true;
                        }
                    }
                }
                //Stop the animation if the mesh has stopped
                else {
                    mesh.position.x = x;
                    mesh.position.z = z;
                    mixers[i].clipAction(clip).stop();
                    if(mesh.position.x == outBuilding.x && mesh.position.z == outBuilding.y){
                        scene.remove(mesh);
                        scene.meshes[i] = null;
                    }
                    return true;
                }
                //Stop the animation if the mesh is in a Wall
            } else {
                mixers[i].clipAction(clip).stop();
            }
        }

        this.moveMeshes = function(){
            for(let i = 0; i< meshesMoving.length; i++){
                var j = meshesMoving[i].agent;
                if(this.moveToPosition(scene.meshes[j], j, meshesMoving[i].to.x, 0, meshesMoving[i].to.y,meshesMoving[i].speed, meshesMoving[i].startTime, meshesMoving[i].time, meshesMoving[i].startStep)
                || meshesMoving[i].finalStep == scene.step){
                    meshesMoving.splice(i, 1);
                    mixers[j].clipAction(clip).stop();
                }


            }
        }

        this.moveAll = function(step) {
            if(scene.flag == 1){
                var stepArr = steps[step];

                if(stepArr && stepArr.length != 0){

                    for (let i = 0; i < stepArr.length; i++){
                        if (stepArr[i].agent != undefined){
                            if(scene.meshes[stepArr[i].agent] == undefined){
                                if(stepArr[i].position != undefined){
                                    var position = stepArr[i].position;
                                    var sentiment = stepArr[i].sentiment;
                                }else{
                                    var position = stepArr[i].moveTo;
                                    var sentiment = stepArr[i].sentiment;
                                }

                                addIndividualModelToScene(stepArr[i].agent,  position, sentiment)
                            }
                            else{
                                if(stepArr[i].moveTo != undefined && stepArr[i].toStep != undefined){
                                    let time = (stepArr[i].toStep - step) * scene.stepTime;
                                    let room = whichRoom(stepArr[i].moveTo);
                                    let speed = calculateSpeed(scene.meshes[stepArr[i].agent].position.x ,scene.meshes[stepArr[i].agent].position.y , room.x, room.y, time);
                                    meshesMoving.push({"agent":stepArr[i].agent, "to":{"x": room.x,"y": room.y}, "speed": speed, "startTime": Date.now(), "time": time, "finalStep": stepArr[i].toStep});
                                    scene.flag = 0;
                                }
                                if (stepArr[i].sentiment != undefined){
                                    changeColorEmotion(stepArr[i].sentiment, stepArr[i].agent);
                                }
                            }

                        }
                        if (stepArr[i].light != undefined){
                            let room = whichRoom(stepArr[i].room);
                            let roomNumber = getRoom(room.x, room.y);
                            setRoomLight(roomNumber, stepArr[i].light);
                        }

                        if (stepArr[i].video != undefined){
                            var roomCoordinates = whichRoom(stepArr[i].room);
                            var room = getRoom(roomCoordinates.x, roomCoordinates.y);
                            var video = new Video(scene, model, room);
                        }

                    }
                }
            }

            this.moveMeshes();

            // //Check if the meshes exist
            // if(scene.meshes[0]){
            //     for(var i=0; i<humans.length; i++){
            //         var number = scene.movement[i].number;
            //         var time = scene.movement[i].time;
            //         var position = humans[i].positions;
            //         var timeStopped = humans[i].timeStopped[number];
            //         var sentiment = humans[i].sentiment[number];
            //         var speed = humans[i].speed[number];
            //         //Move Mesh and check if it is in its final position
            //         if(this.moveToPosition(scene.meshes[i], i, position[number].x, 0, position[number].y, speed)){
            //             //Update time variable if the mesh has to be stopped
            //             if(timeStopped!=0 && scene.movement[i].time == 0){
            //                 scene.movement[i].time = Date.now();
            //             }
            //             //if the timeStopped has expired, changeColor and roomLight
            //             else if(Date.now() - time >= timeStopped){
            //                 if(scene.movement[i].number < humans[i].positions.length-1){
            //                     changeColorEmotion(sentiment, i);
            //                     var room = getRoom(scene.meshes[i]);
            //                     if(getRoomLight(room) != humans[i].actions[number].light){
            //                         setRoomLight(room, humans[i].actions[number].light);
            //                         var prueba = new Video(scene, model, room);
            //                     }
            //                     scene.movement[i].number +=1;
            //                     scene.movement[i].time = 0;
            //                 }
            //             }
            //
            //         }
            //     }
            // }
        }

        function whichRoom(room){
            for (var j = 0; j < allRooms.length; j++) {
                if (room == allRooms[j].name) {
                    var x = allRooms[j].x;
                    var y = allRooms[j].y;
                    return {"x": x, "y": y};
                }
            }
        }

        function changeColor(r, g, b, i){
            //Change mesh color
            scene.meshes[i].material.color.r = r;
            scene.meshes[i].material.color.g = g;
            scene.meshes[i].material.color.b = b;


        }

        function changeColorEmotion (emotion, mesh){
            //Change color according to the emotion
            switch (emotion){
                case "happiness":
                    //YELLOW
                    changeColor(250/255, 218/255, 77/255, mesh);
                    break;
                case "sadness":
                    //DARK BLUE
                    changeColor(0/255, 70/255, 255/255, mesh);
                    break;
                case "surprise":
                    //LIGHT BLUE
                    changeColor(66/255, 163/255, 191/255, mesh);
                    break;
                case "fear":
                    //GREEN
                    changeColor(57/255, 162/255, 81/255, mesh);
                    break;
                case "disgust":
                    //PURPLE
                    changeColor(131/255, 0/255, 255/255, mesh);
                    break;
                case "anger":
                    //RED
                    changeColor(227/255, 52/255, 84/255, mesh);
                    break;
            }


        }

        function getRoomLight(room){
            var texture = model.floorplan.getRooms()[room].getTexture().url;
            //TRUE -> Light ON, FALSE -> Light OFF
            return texture == "rooms/textures/hardwood.png";

        }

        function setRoomLight(room, on){

            //Getting the walls
            console.log("ROOMLIGHT", room);
            console.log("ROOMS: ",model.floorplan.getRooms());
            var walls = model.floorplan.getRooms()[room].updateWallsTexture();

            for (var i = 0; i<walls.length; i++){
                //Check where is the wall headed
                if(walls[i].to == false){
                    //Turn on
                    if(on == true){
                        walls[i].backEdge.setTexture("rooms/textures/wallmap.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood.png", true, 300);
                    }
                    //Turn off
                    else{
                        walls[i].backEdge.setTexture("rooms/textures/walllightmap_dark.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_dark.png", true, 300);
                    }
                }
                else{
                    //Turn on
                    if (on == true){
                        walls[i].frontEdge.setTexture("rooms/textures/wallmap.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood.png", true, 300);
                    }
                    //Turn off
                    else{
                        walls[i].frontEdge.setTexture("rooms/textures/walllightmap_dark.png", true, 1);
                        model.floorplan.getRooms()[room].setTexture("rooms/textures/hardwood_dark.png", true, 300);

                    }
                }
            }

        }

        // function getRoom(mesh){
        //     //Mesh position
        //     var x = mesh.position.x;
        //     var y = mesh.position.z;
        //     //Array with all the Rooms
        //     var rooms = model.floorplan.getRooms();
        //     for (var i = 0; i<rooms.length; i++){
        //         //Obtain the min and max coordinates of the room
        //         var corners = rooms[i].interiorCorners;
        //         var xMin = corners[0].x;
        //         var xMax = corners[0].x;
        //         var yMin = corners[0].y;
        //         var yMax = corners[0].y;
        //         for (var j=1; j<corners.length; j++){
        //             if (xMin > corners[j].x){
        //                 xMin = corners[j].x;
        //             }
        //             if (xMax < corners[j].x){
        //                 xMax = corners[j].x;
        //             }
        //             if (yMin > corners[j].y){
        //                 yMin = corners[j].y;
        //             }
        //             if (yMin < corners[j].y){
        //                 yMax = corners[j].y;
        //             }
        //         }
        //         //Check if the mesh is inside the room
        //         if( x > xMin && x < xMax && y > yMin && y < yMax){
        //             return i;
        //         }
        //     }
        //     return null;
        // }

        function getRoom(x, y){
            //Array with all the Rooms
            var rooms = model.floorplan.getRooms();
            for (var i = 0; i<rooms.length; i++){
                //Obtain the min and max coordinates of the room
                var corners = rooms[i].interiorCorners;
                var xMin = corners[0].x;
                var xMax = corners[0].x;
                var yMin = corners[0].y;
                var yMax = corners[0].y;
                for (var j=1; j<corners.length; j++){
                    if (xMin > corners[j].x){
                        xMin = corners[j].x;
                    }
                    if (xMax < corners[j].x){
                        xMax = corners[j].x;
                    }
                    if (yMin > corners[j].y){
                        yMin = corners[j].y;
                    }
                    if (yMin < corners[j].y){
                        yMax = corners[j].y;
                    }
                }
                //Check if the mesh is inside the room
                if( x > xMin && x < xMax && y > yMin && y < yMax){
                    return i;
                }
            }
            return null;
        }

        function calculateSpeed(x1, y1, x2, y2, time){
            var distance = Core.Utils.distance(x1, y1, x2, y2);
            // var speed = distance*1000 / (time-800)/scene.fps;
            var speed = distance*1000 / time;
            return speed;
        }

        function objectHalfSize(mesh): THREE.Vector3 {
            var objectBox = new THREE.Box3();
            objectBox.setFromObject(mesh);
            return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
        }

        init();
    }
}

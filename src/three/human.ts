/// <reference path="../../lib/three.d.ts" />
/// <reference path="../core/utils.ts" />

module BP3D.Three {
    // export var Human = function (scene, model, steps, type, allRooms) {
    export var Human = function (scene, model, steps, type, allRooms) {
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

        // var testing;
        var steps = steps;

        // var allRooms3;
        // var allRooms2;
        var allRooms = allRooms;


        var outBuilding;
        var geometry1;

        var flag = 1;
        var type = type;
        var fire;

        var meshesMoving = [];

        function init() {


            // Loading JSON 3DModel
            var jsonLoader = new THREE.JSONLoader();
            jsonLoader.load( "/models/js/walkmorphcolor.json", addModelToScene);

            // //Loading JSON with the doors
            // $.ajax('/js/LabGSI.blueprint3d', {
            //     async: false,
            //     dataType: 'text',
            //     success: function (data) {
            //         testing = data;
            //     }
            // });
            //
            // model.floorJSON = testing;
            // var json = JSON.parse(testing);
            // items = json.items;
            // for(var i=0; i<items.length; i++){
            //     if(items[i].item_name == "Open Door"){
            //         doors.push(items[i]);
            //     }
            // }
            //
            meshesMoving = [];
            var fire = new Fire(scene, model);

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
                if (steps[0][j].agent != undefined){
                    let material1 = new THREE.MeshLambertMaterial();
                    material1.morphTargets =true;
                    let mesh = new THREE.SkinnedMesh( geometry, material1 );
                    mesh.scale.set(55,65,55);
                    scene.add(mesh);
                    scene.meshes.push(mesh);
                    //Setting mesh position
                    let position = steps[0][j].position;
                    if(type == 0){
                        for(let k = 0; k < allRooms.length; k++){
                            if(position == allRooms[k].name){
                                mesh.position.x = allRooms[k].x;
                                mesh.position.z = allRooms[k].y;
                            }
                        }
                    }
                    else{
                        mesh.position.x = position.x;
                        mesh.position.z = position.y;
                    }

                    if(steps[0][j].rotation != undefined){
                        mesh.rotation.y = steps[0][j].rotation;
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
                // else if (steps[0][j].light != undefined){
                //     let room = this.whichRoom(steps[0][j].room);
                //     let roomNumber = this.getRoom(room.x, room.y);
                //     this.setRoomLight(roomNumber, steps[0][j].light);
                // }

            }
            //Setting the initial time of the simulation
            scene.initialTime = Date.now();

        }

        this.addIndividualModelToScene = function(agent, x, y, sentiment, rotation){
        // function addIndividualModelToScene(agent, x, y, sentiment, rotation) {

            //Adding Mesh
            let material1 = new THREE.MeshLambertMaterial();
            material1.morphTargets = true;
            let mesh = new THREE.SkinnedMesh( geometry1, material1 );
            mesh.scale.set(55,65,55);
            scene.add(mesh);
            scene.meshes[agent] = mesh;

            //Setting mesh position
            mesh.position.x = x;
            mesh.position.z = y;
            mesh.rotation.y = 3.14;

            //Mesh Animation
            let mixer = new THREE.AnimationMixer( mesh );
            mixers[agent] = mixer;

            if(rotation != undefined){
                mesh.rotation.y = rotation;
            }

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

        };


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
            // if (isValidPosition(mesh.position, mesh)) {
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
                    if(type == 0){
                        if (!rotateMesh(mesh, rotationAngle)){
                            //Translation Movement and Animation
                            let thisTime = Date.now();
                            let timeElapsed = thisTime-startTime;
                            if(time - timeElapsed>0){
                                speed2 = this.calculateSpeed(meshX, meshZ, x, z, time-(timeElapsed)) / scene.fps;

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
                    else{
                        if(!rotateMesh(mesh, rotationAngle)){
                            //Translation Movement and Animation
                            let thisTime = Date.now();
                            let timeElapsed = thisTime-startTime;
                            if(time - timeElapsed>0){
                                speed2 = this.calculateSpeed(meshX, meshZ, x, z, time-(timeElapsed)) / scene.fps;

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
            // } else {
            //     mixers[i].clipAction(clip).stop();
            // }
        };

        this.getMeshesMoving = function () {
            return meshesMoving;
        };

        this.pushMeshesMoving = function(arrElement){
            meshesMoving.push(arrElement);
        };

        this.setMeshesMoving = function(arr){
            meshesMoving = arr;
        };

        this.getMixers = function () {
            return mixers;
        };

        this.setMixers = function (arr){
            mixers = arr;
        };

        this.getClip = function(){
            return clip;
        };

        this.setOutBuilding = function(out){
            outBuilding = out;
        };



        function rotateMesh(mesh, rotationAngle){
            if (type == 0){
                if (Math.abs(rotationAngle) > 0.7) {
                    if (rotationAngle > 0) {
                        mesh.rotation.y += Math.PI/4;
                    } else {
                        mesh.rotation.y -= Math.PI/4;
                    }
                    return true;
                }else{
                    return false;
                }
            }
            else if(type == 1){
                if (Math.abs(rotationAngle) > 0.5) {
                    if (rotationAngle > 0) {
                        mesh.rotation.y += 0.45;
                    } else {
                        mesh.rotation.y -= 0.45;
                    }
                    return true;
                }
                else if (Math.abs(rotationAngle) > 0.051) {
                    if (rotationAngle > 0) {
                        mesh.rotation.y += 0.05;
                    } else {
                        mesh.rotation.y -= 0.05;
                    }
                    return true;
                } else if (Math.abs(rotationAngle) < 0.051 && Math.abs(rotationAngle) > 0.006) {
                    if (rotationAngle > 0) {
                        mesh.rotation.y += 0.005;
                    } else {
                        mesh.rotation.y -= 0.005;
                    }
                    return true;
                } else{
                    return false;
                }
            }
            else{
                if (Math.abs(rotationAngle) > 0.38) {
                    if (rotationAngle > 0) {
                        mesh.rotation.y += Math.PI/8;
                    } else {
                        mesh.rotation.y -= Math.PI/8;
                    }
                    return true;
                }else{
                    return false;
                }

            }
        }

        this.moveDirection = function(mesh, i, direction, speed){
            let movementSpeed = (speed*109.8559) / scene.fps;

            let rotationAngle = getDirection(direction) - mesh.rotation.y;
            if (rotationAngle > Math.PI) {
                rotationAngle -= 2 * Math.PI;
            }
            else if (rotationAngle < -Math.PI) {
                rotationAngle += 2 * Math.PI;
            }
            if (!rotateMesh(mesh, rotationAngle)){
                mixers[i].clipAction(clip).play();
                this.move(mesh, i, movementSpeed);
            }


        };

        this.moveMeshes = function(){
            if(type == 0 || type == 1){
                for(let i = 0; i< meshesMoving.length; i++){
                    var j = meshesMoving[i].agent;
                    if(this.moveToPosition(scene.meshes[j], j, meshesMoving[i].to.x, 0, meshesMoving[i].to.y,meshesMoving[i].speed, meshesMoving[i].startTime, meshesMoving[i].time, meshesMoving[i].startStep)
                        || meshesMoving[i].finalStep == scene.step){

                        if(meshesMoving[i].rotation != undefined){
                            scene.meshes[meshesMoving[i].agent].rotation.y = meshesMoving[i].rotation;
                        }

                        if(meshesMoving[i].outBuilding != undefined){
                            if(meshesMoving[i].outBuilding == true){
                                scene.remove(scene.meshes[meshesMoving[i].agent]);
                                scene.meshes[meshesMoving[i].agent] = null;
                            }
                        }

                        meshesMoving.splice(i, 1);
                        mixers[j].clipAction(clip).stop();
                    }
                }
            }
            else{
                for(let i = 0; i< meshesMoving.length; i++){
                    var agent = meshesMoving[i].agent;
                    this.moveDirection(scene.meshes[agent], agent, meshesMoving[i].direction, meshesMoving[i].speed);
                    if(meshesMoving[i].rotation != undefined){
                        scene.meshes[meshesMoving[i].agent].rotation.y = meshesMoving[i].rotation;
                    }
                    if(meshesMoving[i].outBuilding != undefined){
                        if(meshesMoving[i].outBuilding == true){

                            scene.remove(scene.meshes[meshesMoving[i].agent]);
                            scene.meshes[meshesMoving[i].agent] = null;
                        }
                    }
                    // meshesMoving.splice(i, 1);
                }
            }

        };

        this.whichRoom = function(room){
        // function whichRoom(room) {
            for (var j = 0; j < allRooms.length; j++) {
                if (room == allRooms[j].name) {
                    var x = allRooms[j].x;
                    var y = allRooms[j].y;
                    return {"x": x, "y": y};
                }
            }
        };

        function changeColor(r, g, b, i){
            //Change mesh color
            scene.meshes[i].material.color.r = r;
            scene.meshes[i].material.color.g = g;
            scene.meshes[i].material.color.b = b;

        }

        this.changeColorEmotion2 = function(emotion, mesh){
            changeColorEmotion(emotion, mesh);
        };

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
                case "dead":
                    //BLACK
                    changeColor(0, 0, 0, mesh);
                    break;
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

        this.getRoom = function(x,y){
        // function getRoom(x, y){
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
        };

        this.calculateSpeed = function(x1, y1, x2, y2, time){
        // function calculateSpeed(x1, y1, x2, y2, time){
            var distance = Core.Utils.distance(x1, y1, x2, y2);
            // var speed = distance*1000 / (time-800)/scene.fps;
            var speed = distance*1000 / time;
            return speed;
        };

        function objectHalfSize(mesh): THREE.Vector3 {
            var objectBox = new THREE.Box3();
            objectBox.setFromObject(mesh);
            return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
        }

        init();
    }
}

/// <reference path="../../lib/three.d.ts" />
/// <reference path="loadMovement.ts" />

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
        var humans;

        function init() {
            //Loading JSON with the movement
            $.ajax('/js/movement.json', {
                async: false,
                dataType: 'text',
                success: function (data2) {
                    movementJSON = data2;
                }
            });

            var jsonMove = JSON.parse(movementJSON);
            humans = jsonMove.humans;

            // Loading JSON 3DModel
            var jsonLoader = new THREE.JSONLoader();
            jsonLoader.load( "/models/js/walkmorphcolor.json", addModelToScene);

            //Loading JSON with the doors
            $.ajax('/js/floor5.json', {
                async: false,
                dataType: 'text',
                success: function (data) {
                    testing = data;
                }
            });

            var json = JSON.parse(testing);
            items = json.items;
            for(var i=0; i<items.length; i++){
                if(items[i].item_name == "Open Door"){
                    doors.push(items[i]);
                }
            }
        }

        function addModelToScene( geometry, materials) {
            // Preparing animation
            for (var i = 0; i < materials.length; i++){
                materials[i].morphTargets = true;
            }
            // var material = new THREE.MeshFaceMaterial( materials );
            var material = new THREE.MultiMaterial( materials );
            clip = THREE.AnimationClip.CreateFromMorphTargetSequence('walk', geometry.morphTargets, 27, false);

            // Adding Meshes
            for (var j=0; j<humans.length; j++){
                var mesh = new THREE.SkinnedMesh( geometry, material );
                mesh.scale.set(50,50,50);
                scene.add(mesh);
                mesh.position.x = humans[j].positions.x[0];
                mesh.position.z = humans[j].positions.y[0];
                scene.meshes.push(mesh);
                scene.movement.push({number:1, time: 0});
            }

            // Starting Animation
            var mixer = new THREE.AnimationMixer( mesh );
            mixers.push(mixer);

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
                if(vec3.x > doors[j].xpos - 39  && vec3.x < doors[j].xpos + 39  && vec3.z > doors[j].zpos - 39  && vec3.z < doors[j].zpos + 39 ){
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

        this.move = function (mesh, i) {
            var time = Date.now();

            // Translation Movement
            var moveDistance = 3;
            scene.meshes[i].translateZ(moveDistance);

            // Animation
            for (var z=0; z<mixers.length; z++){
                mixers[z].update((time - prevTime)*0.0005);
            }

            prevTime = time;
        }


        this.moveToPosition = function(mesh, i, x, y, z) {
            //Get floorplan for isValidPosition
            if (floorplan == undefined) {
                floorplan = model.floorplan;
            }
            //Mesh Position
            var meshX = mesh.position.x;
            var meshZ = mesh.position.z;
            //Check if the mesh is not in a wall
            if (isValidPosition(mesh.position, mesh)) {
                //Check if the mesh is not in the final position
                if (Math.abs(meshX - x) > 2 || Math.abs(meshZ - z) > 2) {
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
                    if (Math.abs(rotationAngle) > 0.5) {
                        if (rotationAngle > 0) {
                            mesh.rotation.y += 0.45;
                        } else {
                            mesh.rotation.y -= 0.45;
                        }
                    }
                    else if (Math.abs(rotationAngle) > 0.051) {
                        if (rotationAngle > 0) {
                            mesh.rotation.y += 0.05;
                        } else {
                            mesh.rotation.y -= 0.05;
                        }
                    } else if (Math.abs(rotationAngle) < 0.051 && Math.abs(rotationAngle) > 0.006) {
                        if (rotationAngle > 0) {
                            mesh.rotation.y += 0.005;
                        } else {
                            mesh.rotation.y -= 0.005;
                        }
                    }

                    this.move(mesh, i);
                }
                //Stop the animation if the mesh has stopped
                else {
                    mixers[i].clipAction(clip).stop();
                    changeColor(0.5, 0.5, 0.8, i);
                    return true;
                }
                //Stop the animation if the mesh is in a Wall
            } else {
                mixers[i].clipAction(clip).stop();
            }
        }

        this.moveAll = function() {
            //Check if the meshes exist
            if(scene.meshes[0]){
                for(var i=0; i<humans.length; i++){

                    var number = scene.movement[i].number;
                    var time = scene.movement[i].time;
                    var position = humans[i].positions;
                    var move = humans[i].movement[number];
                    var timeStopped = humans[i].timeStopped[number];
                    
                    if(this.moveToPosition(scene.meshes[i], i, position.x[number], 0, position.y[number])){
                        if(!move && scene.movement[i].time == 0){
                            scene.movement[i].time = Date.now();
                        }else if(Date.now() - time >= timeStopped){
                            scene.movement[i].number +=1;
                            scene.movement[i].time = 0;
                        }
                    }
                }
            }
        }

        function changeColor(r, g, b, i){
            //Change mesh color
            // meshes[i].material.materials[0].color.r = r;
            // meshes[i].material.materials[0].color.g = g;
            // meshes[i].material.materials[0].color.b = b;

            if(m==1){
                m+=1;
                changeColorEmotion("disgust", i);
                var room = getRoom(scene.meshes[i]);
                roomLight(room, false);
            }
        }

        function changeColorEmotion (emotion, mesh){
            switch (emotion){
                case "happiness":
                    //YELLOW
                    scene.meshes[mesh].material.materials[0].color.r = 250/255;
                    scene.meshes[mesh].material.materials[0].color.g = 218/255;
                    scene.meshes[mesh].material.materials[0].color.b = 77/255;
                    break;
                case "sadness":
                    //DARK BLUE
                    scene.meshes[mesh].material.materials[0].color.r = 0/255;
                    scene.meshes[mesh].material.materials[0].color.g = 70/255;
                    scene.meshes[mesh].material.materials[0].color.b = 255/255;
                    break;
                case "surprise":
                    //LIGHT BLUE
                    scene.meshes[mesh].material.materials[0].color.r = 66/255;
                    scene.meshes[mesh].material.materials[0].color.g = 163/255;
                    scene. meshes[mesh].material.materials[0].color.b = 191/255;
                    break;
                case "fear":
                    //GREEN
                    scene.meshes[mesh].material.materials[0].color.r = 57/255;
                    scene. meshes[mesh].material.materials[0].color.g = 162/255;
                    scene. meshes[mesh].material.materials[0].color.b = 81/255;
                    break;
                case "disgust":
                    //PURPLE
                    scene.meshes[mesh].material.materials[0].color.r = 131/255;
                    scene. meshes[mesh].material.materials[0].color.g = 0/255;
                    scene. meshes[mesh].material.materials[0].color.b = 255/255;
                    break;
                case "anger":
                    //RED
                    scene. meshes[mesh].material.materials[0].color.r = 227/255;
                    scene. meshes[mesh].material.materials[0].color.g = 52/255;
                    scene.meshes[mesh].material.materials[0].color.b = 84/255;
                    break;
            }


        }

        function roomLight(room, on){

            //Getting the walls
            var walls = model.floorplan.getRooms()[room].updateWallsTexture();
            for (var i = 0; i<walls.length; i++){
                //Check where is the wall headed
                if(walls[i].to == false){
                    //Turn on
                    if(on == true){
                        walls[i].backEdge.setTexture("rooms/textures/walllightmap.jpg", true, 1);
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
                        walls[i].frontEdge.setTexture("rooms/textures/walllightmap.jpg", true, 1);
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

        function getRoom(mesh){
            //Mesh position
            var x = mesh.position.x;
            var y = mesh.position.z;
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

        function objectHalfSize(mesh): THREE.Vector3 {
            var objectBox = new THREE.Box3();
            objectBox.setFromObject(mesh);
            return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
        }

        init();
    }
}

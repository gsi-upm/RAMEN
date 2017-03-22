/// <reference path="../../lib/three.d.ts" />

module BP3D.Three {
  export var Human = function (scene, model) {

    var meshes = [];
    var mixers = [];
    var scene = scene;
    var model = model;

    var prevTime = Date.now();
    var angleRadians;
    var floorplan;
    var clip;

    function init() {
      // Loading JSON 3DModel
      var jsonLoader = new THREE.JSONLoader();
      jsonLoader.load( "/models/js/walkmorphcolor.json", addModelToScene);
    }

    function addModelToScene( geometry, materials) {
      // Preparing animation
    	for (var i = 0; i < materials.length; i++){
    		materials[i].morphTargets = true;
      }

      // var material = new THREE.MeshFaceMaterial( materials );
      var material = new THREE.MultiMaterial( materials );
      clip = THREE.AnimationClip.CreateFromMorphTargetSequence('walk', geometry.morphTargets, 27, false);
      for (var j = 0; j<100; j++){
        // Adding Meshes
        var mesh = new THREE.SkinnedMesh( geometry, material );

        var mesh2 = new THREE.SkinnedMesh( geometry, material );


        mesh.scale.set(50,50,50);
        mesh2.scale.set(50,50,50);
        scene.add(mesh);
        scene.add(mesh2);
        mesh2.position.set(290, 0,-300);
        mesh.position.x = 300 - 100*j;
        mesh.position.z = 0;
        meshes.push(mesh);

        // Starting Animation
        var mixer = new THREE.AnimationMixer( mesh );
        mixer.clipAction(clip).play();
        mixers.push(mixer);
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
      //for (var y=0; y<meshes.length; y++) {
        var moveDistance = 2.5;
        meshes[i].translateZ(  moveDistance );
        // meshes[y].translateZ(  moveDistance );
        //meshes[y].rotateY( 0.01 );
      // }

      // Animation
      for (var z=0; z<mixers.length; z++){
        mixers[z].update((time - prevTime)*0.0005);
      }
      prevTime = time;
    }


    this.moveToPosition = function(x, y, z) {
      if (floorplan == undefined) {
        floorplan = model.floorplan;
      }
      for (var i = 0; i < meshes.length; i++) {
        var meshX = meshes[i].position.x;
        var meshZ = meshes[i].position.z;
        if (isValidPosition(meshes[i].position, meshes[i])) {

          if (Math.abs(meshX - x) > 2 || Math.abs(meshZ - z) > 2) {
            angleRadians = Math.atan2(x - meshX, z - meshZ);
            var rotationAngle = angleRadians - meshes[i].rotation.y;
            if (rotationAngle > Math.PI) {
              rotationAngle -= 2 * Math.PI;
            }
            else if (rotationAngle < -Math.PI) {
              rotationAngle += 2 * Math.PI;
            }
            if (Math.abs(rotationAngle) > 0.051) {
              if (rotationAngle > 0) {
                meshes[i].rotation.y += 0.05;
              } else {
                meshes[i].rotation.y -= 0.05;
              }
            } else if (Math.abs(rotationAngle) < 0.051 && Math.abs(rotationAngle) > 0.006) {
              if (rotationAngle > 0) {
                meshes[i].rotation.y += 0.005;
              } else {
                meshes[i].rotation.y -= 0.005;
              }
            }
            this.move(meshes[i],i);

          }
          else{
            mixers[i].clipAction(clip).stop();
          }
        }else{
          mixers[i].clipAction(clip).stop();
        }
      }
    }

    function objectHalfSize(mesh): THREE.Vector3 {
      var objectBox = new THREE.Box3();
      objectBox.setFromObject(mesh);
      return objectBox.max.clone().sub(objectBox.min).divideScalar(2);
    }


    init();
  }
}

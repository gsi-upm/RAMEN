/// <reference path="../../lib/jQuery.d.ts" />
/// <reference path="../../lib/three.d.ts" />

module BP3D.Three {
    export var Video = function (scene) {

        var plane;
        var materialVideo;
        function init(){
            scene.video = document.getElementById( 'video' );
            var image = document.createElement( 'canvas' );
            image.width = 480;
            image.height = 204;

            scene.imageContext = image.getContext( '2d' );
            scene.imageContext.fillStyle = '#000000';
            scene.imageContext.fillRect( 0, 0, 480, 204 );

            scene.textureVideo = new THREE.Texture( image );

            materialVideo = new THREE.MeshBasicMaterial( { map: scene.textureVideo, overdraw: 0.5 } );

            plane = new THREE.PlaneGeometry( 480/6.5, 204/6.5, 4, 4 );


            getTV();

        }

        function getTV(){
            var items = scene.getItems();
            for (var i=0; i<items.length; i++){
                if( items[i].metadata.itemName == "Media Console - White"){
                    var mesh = new THREE.Mesh( plane, materialVideo );
                    mesh.scale.x = mesh.scale.y = mesh.scale.z = 1.5;
                    scene.add(mesh);
                    setPosition(mesh,items[i]);

                }
            }
        }
        function setPosition(mesh, item){
            var orientation = getOrientation(item);
            console.log("ORIENTATION: ", orientation);
            mesh.rotation.y = item.rotation.y;
            switch (orientation){
                case "NORTH":
                    mesh.position.x = item.position.x;
                    mesh.position.y = 104;
                    mesh.position.z = item.position.z - 2;
                    break;
                case "WEST":
                    mesh.position.x = item.position.x - 2;
                    mesh.position.y = 104;
                    mesh.position.z = item.position.z;
                    break;
                case "SOUTH":
                    mesh.position.x = item.position.x;
                    mesh.position.y = 104;
                    mesh.position.z = item.position.z + 2;
                    break;
                case "EAST":
                    mesh.position.x = item.position.x + 2;
                    mesh.position.y = 104;
                    mesh.position.z = item.position.z;
                    break;
            }
        }

        function getOrientation(item){
            var rotation = item.rotation.y;
            console.log("ROTATION: ", rotation);
            if(rotation < 0.5 && rotation > -0.5){
                return "SOUTH";
            }else if(rotation < -Math.PI/2 + 0.5 && rotation > -Math.PI/2 - 0.5){
                return "WEST";
            }else if(rotation < Math.PI/2 + 0.5 && rotation > Math.PI/2 - 0.5){
                return "EAST";
            }else if(rotation < Math.PI + 0.5 && rotation > Math.PI - 0.5){
                return "NORTH";
            }
        }


        init();
    }
}

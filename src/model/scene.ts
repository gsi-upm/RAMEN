/// <reference path="../../lib/three.d.ts" />
/// <reference path="../../lib/jQuery.d.ts" />
/// <reference path="../core/utils.ts" />
/// <reference path="../items/factory.ts" />

module BP3D.Model {
    /**
     * The Scene is a manager of Items and also links to a ThreeJS scene.
     */
    export class Scene {

        /** The associated ThreeJS scene. */
        private scene: THREE.Scene;

        /** */
        private items: Items.Item[] = [];

        /** */
        public needsUpdate = false;

        /** The Json loader. */
        private loader: THREE.JSONLoader;

        /** */
        private itemLoadingCallbacks = $.Callbacks();

        /** Item */
        private itemLoadedCallbacks = $.Callbacks();

        /** Item */
        private itemRemovedCallbacks = $.Callbacks();

        public wallTextures = [];
        public floorTextures = [];
        public loadedItems = [];
        public positions = [];
        public rotations = [];
        public scales = [];
        public meshes = [];
        public movement = [];
        public video;
        public imageContext;
        public textureVideo;
        public fps;
        public initialTime;
        public flag = 1;
        public step = 1;
        public customUniforms;
        public mouse;
        public element;
        public simSpeed = 1;
        public stepTime = 1000;
        public stepTimeOri = 1000;
        /**
         * Constructs a scene.
         * @param model The associated model.
         * @param textureDir The directory from which to load the textures.
         */
        constructor(private model: Model, private textureDir: string) {
            this.scene = new THREE.Scene();

            // init item loader
            this.loader = new THREE.JSONLoader();
            this.loader.crossOrigin = "";
        }

        /** Adds a non-item, basically a mesh, to the scene.
         * @param mesh The mesh to be added.
         */
        public add(mesh: THREE.Mesh) {
            this.scene.add(mesh);
        }

        /** Removes a non-item, basically a mesh, from the scene.
         * @param mesh The mesh to be removed.
         */
        public remove(mesh: THREE.Mesh) {
            this.scene.remove(mesh);
            Core.Utils.removeValue(this.items, mesh);
        }

        /** Gets the scene.
         * @returns The scene.
         */
        public getScene(): THREE.Scene {
            return this.scene;
        }

        /** Gets the items.
         * @returns The items.
         */
        public getItems(): Items.Item[] {
            return this.items;
        }

        /** Gets the count of items.
         * @returns The count.
         */
        public itemCount(): number {
            return this.items.length
        }

        /** Removes all items. */
        public clearItems() {
            var items_copy = this.items;
            var scope = this;
            this.items.forEach((item) => {
                scope.removeItem(item, true);
            });
            this.items = []
        }

        /**
         * Removes an item.
         * @param item The item to be removed.
         * @param dontRemove If not set, also remove the item from the items list.
         */
        public removeItem(item: Items.Item, dontRemove?: boolean) {
            dontRemove = dontRemove || false;
            // use this for item meshes
            this.itemRemovedCallbacks.fire(item);
            item.removed();
            this.scene.remove(item);
            if (!dontRemove) {
                Core.Utils.removeValue(this.items, item);
            }
        }

        /**
         * Creates an item and adds it to the scene.
         * @param itemType The type of the item given by an enumerator.
         * @param fileName The name of the file to load.
         * @param metadata TODO
         * @param position The initial position.
         * @param rotation The initial rotation around the y axis.
         * @param scale The initial scaling.
         * @param fixed True if fixed.
         */
        public addItem(itemType: number, fileName: string, metadata, position: THREE.Vector3, rotation: number, scale: THREE.Vector3, fixed: boolean) {
            itemType = itemType || 1;
            var scope = this;
            var loaded = false;

            //Check if the item has been loaded before
            for (var i=0; i<scope.loadedItems.length; i++){
                if(scope.loadedItems[i].fileName == fileName){
                    scope.loadedItems[i].number +=1;
                    scope.loadedItems[i].positions.push(position);
                    scope.loadedItems[i].rotations.push(rotation);
                    scope.loadedItems[i].scales.push(scale);
                    // scope.positions.push(position);
                    loaded = true;
                }
            }

            var loaderCallback = function (geometry: THREE.Geometry, materials: THREE.Material[]) {
                var n = 1;
                var pos = [];
                var rot = [];
                var sca = [];
                for (var j=0; j<scope.loadedItems.length; j++){
                    if(scope.loadedItems[j].fileName == fileName ){
                        n = scope.loadedItems[j].number;
                        pos = scope.loadedItems[j].positions;
                        rot = scope.loadedItems[j].rotations;
                        sca = scope.loadedItems[j].scales;
                    }
                }
                for(var z=0; z<n; z++){
                    var item = new (Items.Factory.getClass(itemType))(
                        scope.model,
                        metadata, geometry,
                        new THREE.MeshFaceMaterial(materials),
                        pos[z],
                        rot[z],
                        sca[z]
                        // scope.positions[z],
                        // scope.rotations[z],
                        // scope.scales[z]
                    );
                    item.fixed = fixed || false;
                    scope.items.push(item);
                    scope.add(item);
                    item.initObject();
                    scope.itemLoadedCallbacks.fire(item);

                }

            };

            if(!loaded){
                this.itemLoadingCallbacks.fire();
                scope.positions.push(position);
                scope.rotations.push(rotation);
                scope.scales.push(scale);
                scope.loadedItems.push({fileName: fileName, number: 1, positions: [position], rotations: [rotation], scales: [scale]});
                this.loader.load(
                    fileName,
                    loaderCallback,
                    undefined // TODO_Ekki
                );
            }

        }

        public addItem2(itemType: number, fileName: string, metadata, position: THREE.Vector3, rotation: number, scale: THREE.Vector3, fixed: boolean) {
            itemType = itemType || 1;
            var scope = this;

            var loaderCallback = function (geometry: THREE.Geometry, materials: THREE.Material[]) {
                var item = new (Items.Factory.getClass(itemType))(
                    scope.model,
                    metadata, geometry,
                    new THREE.MeshFaceMaterial(materials),
                    position, rotation, scale
                );
                item.fixed = fixed || false;
                scope.items.push(item);

                var scale2 = scope.calculateScale(metadata.itemName);

                item.scale.x = scale2.x;
                item.scale.y = scale2.y;
                item.scale.z = scale2.z;
                item.position.y =  0.5 * (item.geometry.boundingBox.max.y - item.geometry.boundingBox.min.y);

                scope.add(item);
                item.initObject();

                scope.itemLoadedCallbacks.fire(item);
            };

            this.itemLoadingCallbacks.fire();
            this.loader.load(
                fileName,
                loaderCallback,
                undefined // TODO_Ekki
            );

        }

        private calculateScale(itemName){
            var scale = {"x":1, "y":1, "z":1};

            if(itemName == "Camera"){
                scale.x = 10;
                scale.y = 10;
                scale.z = 10;
            }
            else if(itemName == "Air"){
                scale.x = 13;
                scale.y = 12;
                scale.z = 12;
            }
            else if(itemName == "GSI Poster"){
                scale.x = 1.35;
            }
            else if(itemName == "Beacon"){
                scale.x = 4;
                scale.y = 4;
                scale.z = 4;
            }
            return scale;
        }
    }
}

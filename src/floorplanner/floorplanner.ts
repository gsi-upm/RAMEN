/// <reference path="../../lib/jQuery.d.ts" />
/// <reference path="../model/floorplan.ts" />
/// <reference path="floorplanner_view.ts" />

module BP3D.Floorplanner {
    /** how much will we move a corner to make a wall axis aligned (cm) */
    const snapTolerance = 20;

    /**
     * The Floorplanner implements an interactive tool for creation of floorplans.
     */
    export class Floorplanner {

        /** */
        public mode = 0;

        /** */
        public activeWall = null;

        /** */
        public activeCorner = null;

        /** */
        public originX = 0;

        /** */
        public originY = 0;

        /** drawing state */
        public targetX = 0;

        /** drawing state */
        public targetY = 0;

        /** drawing state */
        public lastNode = null;

        /** */
        private wallWidth: number;

        /** */
        private modeResetCallbacks = $.Callbacks();

        /** */
        private canvasElement;

        /** */
        private view: FloorplannerView;

        /** */
        private mouseDown = false;

        /** */
        private mouseMoved = false;

        /** in ThreeJS coords */
        private mouseX = 0;

        /** in ThreeJS coords */
        private mouseY = 0;

        /** in ThreeJS coords */
        private rawMouseX = 0;

        /** in ThreeJS coords */
        private rawMouseY = 0;

        /** mouse position at last click */
        private lastX = 0;

        /** mouse position at last click */
        private lastY = 0;

        /** */
        private cmPerPixel: number;

        /** */
        public pixelsPerCm: number;

        /** */
        constructor(canvas: string, private floorplan: Model.Floorplan) {

            this.canvasElement = $("#" + canvas);

            this.view = new FloorplannerView(this.floorplan, this, canvas);

            // var cmPerFoot = 30.48;
            // var pixelsPerFoot = 15.0;
            // this.cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
            // this.pixelsPerCm = 1.0 / this.cmPerPixel;

            // var cmPerFoot = 30.48;
            // var pixelsPerFoot = 15.0;
            // this.cmPerPixel = cmPerFoot * (1.0 / pixelsPerFoot);
            this.pixelsPerCm = 0.5;
            this.cmPerPixel = 1.0 / this.pixelsPerCm;

            this.wallWidth = 10.0 * this.pixelsPerCm;

            // Initialization:

            this.setMode(floorplannerModes.MOVE);

            var scope = this;

            this.canvasElement.mousedown(() => {
                scope.mousedown();
            });
            this.canvasElement.mousemove((event) => {
                scope.mousemove(event);
            });
            this.canvasElement.mouseup(() => {
                scope.mouseup();
            });
            this.canvasElement.mouseleave(() => {
                scope.mouseleave();
            });

            $(document).keyup((e) => {
                if (e.keyCode == 27) {
                    scope.escapeKey();
                }
            });

            floorplan.roomLoadedCallbacks.add(() => {
                scope.reset()
            });
        }

        /** */
        private escapeKey() {
            this.setMode(floorplannerModes.MOVE);
        }

        /** */
        private updateTarget() {
            if (this.mode == floorplannerModes.DRAW && this.lastNode) {
                if (Math.abs(this.mouseX - this.lastNode.x) < snapTolerance) {
                    this.targetX = this.lastNode.x;
                } else {
                    this.targetX = this.mouseX;
                    this.targetX = this.scale(this.targetX);
                }
                if (Math.abs(this.mouseY - this.lastNode.y) < snapTolerance) {
                    this.targetY = this.lastNode.y;
                    this.targetY = this.scale(this.targetY);
                } else {
                    this.targetY = this.mouseY;
                    this.targetY = this.scale(this.targetY);
                }
            } else {
                this.targetX = this.mouseX;
                this.targetX = this.scale(this.targetX);
                this.targetY = this.mouseY;
                this.targetY = this.scale(this.targetY);
            }
            this.view.draw();
        }

        /** */
        private mousedown() {
            this.mouseDown = true;
            this.mouseMoved = false;
            this.lastX = this.rawMouseX;
            this.lastY = this.rawMouseY;

            // delete
            if (this.mode == floorplannerModes.DELETE) {
                if (this.activeCorner) {
                    this.activeCorner.removeAll();
                } else if (this.activeWall) {
                    this.activeWall.remove();
                } else {
                    this.setMode(floorplannerModes.MOVE);
                }
            }
        }

        /** */
        private mousemove(event) {
            this.mouseMoved = true;

            // update mouse
            this.rawMouseX = event.clientX;
            this.rawMouseY = event.clientY;

            this.mouseX = (event.clientX - this.canvasElement.offset().left) * this.cmPerPixel + this.originX * this.cmPerPixel;
            this.mouseY = (event.clientY - this.canvasElement.offset().top) * this.cmPerPixel + this.originY * this.cmPerPixel;

            // update target (snapped position of actual mouse)
            // if (this.mode == floorplannerModes.DRAW || (this.mode == floorplannerModes.MOVE && this.mouseDown)) {
            //     this.updateTarget();
            // }
            if (this.mode == floorplannerModes.DRAW ) {
                this.updateTarget();
            }

            // update object target
            if (this.mode != floorplannerModes.DRAW && !this.mouseDown) {
                var hoverCorner = this.floorplan.overlappedCorner(this.mouseX, this.mouseY);
                var hoverWall = this.floorplan.overlappedWall(this.mouseX, this.mouseY);
                var draw = false;
                if (hoverCorner != this.activeCorner) {
                    this.activeCorner = hoverCorner;
                    draw = true;
                }
                // corner takes precendence
                if (this.activeCorner == null) {
                    if (hoverWall != this.activeWall) {
                        this.activeWall = hoverWall;
                        draw = true;
                    }
                } else {
                    this.activeWall = null;
                }
                if (draw) {
                    this.view.draw();
                }
            }

            // panning
            if (this.mouseDown && !this.activeCorner && !this.activeWall) {
                this.originX += (this.lastX - this.rawMouseX);
                this.originY += (this.lastY - this.rawMouseY);
                this.lastX = this.rawMouseX;
                this.lastY = this.rawMouseY;
                this.view.draw();
            }

            // dragging
            if (this.mode == floorplannerModes.MOVE && this.mouseDown) {
                if (this.activeCorner) {
                    this.activeCorner.move(this.scale(this.mouseX), this.scale(this.mouseY));
                    this.activeCorner.snapToAxis(snapTolerance);
                } else if (this.activeWall) {
                    this.moveWall();
                }
                this.view.draw();
            }
        }

        private moveWall(){
            if (((this.rawMouseX - this.lastX)* this.cmPerPixel)>50){
                this.activeWall.relativeMove(
                    50,0
                );
                this.moveWallRefresh();
            }
            else if (((this.rawMouseY - this.lastY)* this.cmPerPixel)>50){
                this.activeWall.relativeMove(
                    0,50
                );
                this.moveWallRefresh();
            }
            else if (((this.rawMouseY - this.lastY)* this.cmPerPixel)<-50){
                this.activeWall.relativeMove(
                    0,-50
                );
                this.moveWallRefresh();
            }
            else if (((this.rawMouseX - this.lastX)* this.cmPerPixel)<-50){
                this.activeWall.relativeMove(
                    -50,0
                );
                this.moveWallRefresh();
            }

        }

        private moveWallRefresh(){
            this.activeWall.snapToAxis(snapTolerance);
            this.lastX = this.rawMouseX;
            this.lastY = this.rawMouseY;
        }

        /** */
        private mouseup() {
            this.mouseDown = false;

            // drawing
            if (this.mode == floorplannerModes.DRAW && !this.mouseMoved) {
                var corner = this.floorplan.newCorner(this.targetX, this.targetY);
                if (this.lastNode != null) {
                    this.floorplan.newWall(this.lastNode, corner, true);
                }
                if (corner.mergeWithIntersected() && this.lastNode != null) {
                    this.setMode(floorplannerModes.MOVE);
                }
                this.lastNode = corner;
            }

        }

        /** */
        private mouseleave() {
            this.mouseDown = false;
            // scope.setMode(scope.modes.MOVE);
        }

        /** */
        private reset(zoom?: boolean) {
            var isZoom = zoom || false;
            this.resizeView();
            this.setMode(floorplannerModes.MOVE);
            if(!isZoom){
                this.resetOrigin();
            }
            this.view.draw();
        }

        /** */
        private resizeView() {
            this.view.handleWindowResize();
        }

        /** */
        private setMode(mode: number) {
            this.lastNode = null;
            this.mode = mode;
            this.modeResetCallbacks.fire(mode);
            this.updateTarget();
        }

        /** Sets the origin so that floorplan is centered */
        private resetOrigin() {
            // var centerX = this.canvasElement.innerWidth() / 2.0;
            // var centerY = this.canvasElement.innerHeight() / 2.0;
            var centerY = this.canvasElement.innerHeight() / 2.0;
            var centerX = this.canvasElement.innerWidth() / 2.0;
            var centerFloorplan = this.floorplan.getCenter();
            var minCorner = this.floorplan.getMinCorner();
            this.originX = centerFloorplan.x * this.pixelsPerCm - centerX;
            this.originY = centerFloorplan.z * this.pixelsPerCm - centerY;
            // this.originX = minCorner.x;
            // this.originY = minCorner.z;
        }

        /** Convert from THREEjs coords to canvas coords. */
        public convertX(x: number): number {
            // console.log("X", (x - this.originX * this.cmPerPixel) * this.pixelsPerCm);
            return (x - this.originX * this.cmPerPixel) * this.pixelsPerCm;
        }

        /** Convert from THREEjs coords to canvas coords. */
        public convertY(y: number): number {
            return (y - this.originY * this.cmPerPixel) * this.pixelsPerCm;
        }

        public zoom(zoomValue){
            if(zoomValue == "in"){
                this.pixelsPerCm += 0.01;
                this.cmPerPixel = 1 / this.pixelsPerCm;
            }
            else if (zoomValue == "out"){
                this.pixelsPerCm -= 0.01;
                this.cmPerPixel = 1 / this.pixelsPerCm;
            }
            else{
                this.pixelsPerCm = 0.4921259842519685;
                this.cmPerPixel = 1 / this.pixelsPerCm;
                console.log("PIXELSPERCM", this.pixelsPerCm);
            }

        }

        private scale(val){
            var div = val / 50;
            var rest = val%50;
            div = Math.floor(div);
            if(rest > 25 ){
                return div*50+50;
            }
            return div*50;

        }

    }
}

/*
 * Camera Buttons
 */
var testing;
var CameraButtons = function(blueprint3d) {

    var orbitControls = blueprint3d.three.controls;
    var three = blueprint3d.three;

    var panSpeed = 30;
    var directions = {
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    }

    function init() {
        // Camera controls
        $("#zoom-in").click(zoomIn);
        $("#zoom-out").click(zoomOut);
        $("#zoom-in").dblclick(preventDefault);
        $("#zoom-out").dblclick(preventDefault);

        $("#reset-view").click(three.centerCamera)

        $("#move-left").click(function(){
            pan(directions.LEFT)
        })
        $("#move-right").click(function(){
            pan(directions.RIGHT)
        })
        $("#move-up").click(function(){
            pan(directions.UP)
        })
        $("#move-down").click(function(){
            pan(directions.DOWN)
        })

        $("#move-left").dblclick(preventDefault);
        $("#move-right").dblclick(preventDefault);
        $("#move-up").dblclick(preventDefault);
        $("#move-down").dblclick(preventDefault);

        //Play Controls
        $("#play").click(playAction);
        $("#pause").click(pauseAction);
        $("#forward").click(forwardAction);

    }


    function preventDefault(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function pan(direction) {
        switch (direction) {
            case directions.UP:
                orbitControls.panXY(0, panSpeed);
                break;
            case directions.DOWN:
                orbitControls.panXY(0, -panSpeed);
                break;
            case directions.LEFT:
                orbitControls.panXY(panSpeed, 0);
                break;
            case directions.RIGHT:
                orbitControls.panXY(-panSpeed, 0);
                break;
        }
    }

    function zoomIn(e) {
        e.preventDefault();
        orbitControls.dollyIn(1.1);
        orbitControls.update();
    }

    function zoomOut(e) {
        e.preventDefault;
        orbitControls.dollyOut(1.1);
        orbitControls.update();
    }

    function playAction(){
        blueprint3d.model.play = true;
        blueprint3d.model.scene.simSpeed = 1;
        blueprint3d.model.scene.stepTime = blueprint3d.model.scene.stepTimeOri;
    }

    function pauseAction(){
        blueprint3d.model.play = false;
    }

    function forwardAction(){
        blueprint3d.model.scene.simSpeed += 1;
        blueprint3d.model.scene.stepTime = blueprint3d.model.scene.stepTimeOri / blueprint3d.model.scene.simSpeed;
        console.log("SCENETIME", blueprint3d.model.scene.stepTime);
    }

    init();
}

/*
 * Context menu for selected item
 */

var ContextMenu;
var grid = new THREE.GridHelper(25000, 1000, 0x000000, 0x000000);
ContextMenu = function (blueprint3d) {

    var scope = this;
    var selectedItem;
    var three = blueprint3d.three;

    var lastSelectedItem;
    var selected = true;

    function init() {
        $("#context-menu-delete").click(function (event) {
            selectedItem.remove();
        });

        three.itemSelectedCallbacks.add(itemSelected);
        three.itemUnselectedCallbacks.add(itemUnselected);

        initResize();

        $("#fixed").click(function () {
            var checked = $(this).prop('checked');
            selectedItem.setFixed(checked);
        });
        $("#grid").click(function () {

            var checked = $(this).prop('checked');
            if(checked){
                grid.position.y = 10;
                blueprint3d.model.scene.add(grid);
            }
            else{
                blueprint3d.model.scene.remove(grid);
            }

        });


    }

    function moveObject(direction) {

        switch (direction) {
            case "up":
                selectedItem.position.z -= 10;
                selectedItem.resized();
                break;
            case "down":
                selectedItem.position.z += 10;
                selectedItem.resized();
                break;
            case "left":
                selectedItem.position.x -= 10;
                selectedItem.resized();
                break;
            case "right":
                selectedItem.position.x += 10;
                selectedItem.resized();
                break;
            case "rotate-right":
                if(selectedItem.metadata.itemName == "Open Door" || selectedItem.metadata.itemName == "Out Door"){
                    selectedItem.rotation.y += 1.57079632679;
                    selectedItem.position_set = false;
                    selectedItem.placeInRoom();
                }else{
                    selectedItem.rotation.y += 0.19634954084;
                    selectedItem.resized();
                }

                break;
            case "rotate-left":
                if(selectedItem.metadata.itemName == "Open Door"){
                    selectedItem.rotation.y += 1.57079632679
                    selectedItem.position_set = false;
                    selectedItem.placeInRoom();
                }else {
                    selectedItem.rotation.y -= 0.19634954084;
                    selectedItem.resized();
                    break;
                }
        }
    }

    function cmToIn(cm) {
        return cm / 2.54;
    }

    function inToCm(inches) {
        return inches * 2.54;
    }

    function itemSelected(item) {
        selectedItem = item;
        console.log("ITEM: ", item);
        $("#context-menu-name").text(item.metadata.itemName);

        $("#item-width").val(selectedItem.getWidth().toFixed(0));
        $("#item-height").val(selectedItem.getHeight().toFixed(0));
        $("#item-depth").val(selectedItem.getDepth().toFixed(0));

        $("#context-menu").show();

        $("#fixed").prop('checked', item.fixed);

        if (lastSelectedItem == null) {
            lastSelectedItem = selectedItem;
            moveItem();

        } else if (lastSelectedItem != selectedItem) {
            lastSelectedItem = selectedItem;
        }
        else {
            if (selected) {
                selected = !selected;
                moveItem();
            }

        }

    }

    function moveItem() {
        //Object Controls
        $("#move-object-left").click(function () {
            moveObject("left")
        });
        $("#move-object-right").click(function () {
            moveObject("right")
        });
        $("#move-object-up").click(function () {
            moveObject("up")
        });
        $("#move-object-down").click(function () {
            moveObject("down")
        });
        $("#rotate-object-left").click(function () {
            moveObject("rotate-left")
        });
        $("#rotate-object-right").click(function () {
            moveObject("rotate-right")
        });
    }

    function resize() {
        selectedItem.resize(
            $("#item-height").val(),
            $("#item-width").val(),
            $("#item-depth").val()
        );
    }

    function initResize() {
        $("#item-height").change(resize);
        $("#item-width").change(resize);
        $("#item-depth").change(resize);
    }

    function itemUnselected() {
        selectedItem = null;
        $("#context-menu").hide();
    }

    init();
};

/*
 * Loading modal for items
 */

var ModalEffects = function(blueprint3d) {

    var scope = this;
    var blueprint3d = blueprint3d;
    var itemsLoading = 0;

    this.setActiveItem = function(active) {
        itemSelected = active;
        update();
    };

    function update() {
        if (itemsLoading > 0) {
            $("#loading-modal").show();
        } else {
            $("#loading-modal").hide();
        }
    }

    function init() {
        blueprint3d.model.scene.itemLoadingCallbacks.add(function() {
            itemsLoading += 1;
            update();
        });

        blueprint3d.model.scene.itemLoadedCallbacks.add(function() {
            itemsLoading -= 1;
            update();
        });

        $("#loading-modal2").hide();
        update();
    }

    init();
};

/*
 * Side menu
 */

var SideMenu = function(blueprint3d, floorplanControls, modalEffects) {
    var blueprint3d = blueprint3d;
    var floorplanControls = floorplanControls;
    var modalEffects = modalEffects;
    var flag = true;

    var ACTIVE_CLASS = "active";

    var tabs = {
        "FLOORPLAN" : $("#floorplan_tab"),
        "SHOP" : $("#items_tab"),
        "DESIGN" : $("#design_tab")
    }

    var scope = this;
    this.stateChangeCallbacks = $.Callbacks();

    this.states = {
        "DEFAULT" : {
            "div" : $("#viewer"),
            "tab" : tabs.DESIGN
        },
        "FLOORPLAN" : {
            "div" : $("#floorplanner"),
            "tab" : tabs.FLOORPLAN
        },
        "SHOP" : {
            "div" : $("#add-items"),
            "tab" : tabs.SHOP
        }
    }

    // sidebar state
    var currentState = scope.states.FLOORPLAN;

    function init() {
        for (var tab in tabs) {
            var elem = tabs[tab];
            elem.click(tabClicked(elem));
        }

        $("#update-floorplan").click(floorplanUpdate);

        initLeftMenu();

        blueprint3d.three.updateWindowSize();
        handleWindowResize();

        initItems();

        setCurrentState(scope.states.DEFAULT);
    }

    function floorplanUpdate() {
        setCurrentState(scope.states.DEFAULT);
    }

    function tabClicked(tab) {
        return function() {
            // Stop three from spinning
            blueprint3d.three.stopSpin();

            // Selected a new tab
            for (var key in scope.states) {
                var state = scope.states[key];
                if (state.tab == tab) {
                    setCurrentState(state);
                    break;
                }
            }
        }
    }

    function setCurrentState(newState) {

        if (currentState == newState) {
            return;
        }

        // show the right tab as active
        if (currentState.tab !== newState.tab) {
            if (currentState.tab != null) {
                currentState.tab.removeClass(ACTIVE_CLASS);
            }
            if (newState.tab != null) {
                newState.tab.addClass(ACTIVE_CLASS);
            }
        }

        // set item unselected
        blueprint3d.three.getController().setSelectedObject(null);

        // show and hide the right divs
        currentState.div.hide()
        newState.div.show()

        // custom actions
        if (newState == scope.states.FLOORPLAN) {
            floorplanControls.updateFloorplanView();
            floorplanControls.handleWindowResize();
        }

        if (currentState == scope.states.FLOORPLAN) {
            blueprint3d.model.floorplan.update();
        }

        if (newState == scope.states.DEFAULT) {
            blueprint3d.three.updateWindowSize();
        }

        // set new state
        handleWindowResize();
        currentState = newState;

        scope.stateChangeCallbacks.fire(newState);
    }

    function initLeftMenu() {
        $( window ).resize( handleWindowResize );
        handleWindowResize();
    }

    function handleWindowResize() {
        $(".sidebar").height(window.innerHeight);
        $("#add-items").height(window.innerHeight);

    }

    // TODO: this doesn't really belong here
    function initItems() {
        $("#add-items").find(".add-item").mousedown(function(e) {
            var modelUrl = $(this).attr("model-url");
            var itemType = parseInt($(this).attr("model-type"));
            var metadata = {
                itemName: $(this).attr("model-name"),
                resizable: true,
                modelUrl:  modelUrl,
                itemType: itemType
            };
            setCurrentState(scope.states.DEFAULT);
            $("#loading-modal2").show();

            var controller = blueprint3d.three.getController();
            controller.getElement().on("click");
                controller.getElement().click(function (event) {

                    event.preventDefault();
                    var mouse = new THREE.Vector2();
                    mouse.x = event.clientX;
                    mouse.y = event.clientY;
                    var intersections = controller.getIntersections(
                        mouse, blueprint3d.model.scene.scene.children, false, false, true);

                    var position = {"x": intersections[0].point.x, "y": 0, "z": intersections[0].point.z};
                    position = scalePosition(position);
                    blueprint3d.model.scene.addItem2(itemType, modelUrl, metadata, position);
                    $("#loading-modal2").hide();

                    flag = false;
                    controller.getElement().off("click");
                });
             });
        }

    init();

    function scalePosition(position){
        var x = position.x;
        var z = position.z;

        x2 = Math.round(x / 25);
        if(x2 % 2 == 0){
            x2 -= 1;
        }
        x = x / 25;
        var x3 = x - x2;

        z2 = Math.round(z / 25);
        if(z2 % 2 == 0){
            z2 -= 1;
        }
        z = z / 25;
        var z3 = z - z2;

        if (x3 < 0.5 ){
            x = x2*25;
        }else{
            x = (x2+2)*25;
        }
        if (z3 < 0.5 ){
            z = z2*25;
        }else{
            z = (z2+2)*25;
        }

        return {"x": x, "y": 0, "z": z};
    }

};

/*
 * Change floor and wall textures
 */

var TextureSelector = function (blueprint3d, sideMenu) {

    var scope = this;
    var three = blueprint3d.three;
    var isAdmin = isAdmin;

    var currentTarget = null;

    function initTextureSelectors() {
        $(".texture-select-thumbnail").click(function(e) {
            var textureUrl = $(this).attr("texture-url");
            var textureStretch = ($(this).attr("texture-stretch") == "true");
            var textureScale = parseInt($(this).attr("texture-scale"));
            console.log("currentTarget", currentTarget);
            currentTarget.setTexture(textureUrl, textureStretch, textureScale);

            e.preventDefault();
        });
    }

    function init() {
        three.wallClicked.add(wallClicked);
        three.floorClicked.add(floorClicked);
        three.itemSelectedCallbacks.add(reset);
        three.nothingClicked.add(reset);
        sideMenu.stateChangeCallbacks.add(reset);
        initTextureSelectors();
    }

    function wallClicked(halfEdge) {
        currentTarget = halfEdge;
        $("#floorTexturesDiv").hide();
        $("#wallTextures").show();
    }

    function floorClicked(room) {
        currentTarget = room;
        $("#wallTextures").hide();
        $("#floorTexturesDiv").show();
    }

    function reset() {
        $("#wallTextures").hide();
        $("#floorTexturesDiv").hide();
    }

    init();
};

/*
 * Floorplanner controls
 */

var ViewerFloorplanner = function(blueprint3d) {

    var canvasWrapper = '#floorplanner';

    // buttons
    var move = '#move';
    var remove = '#delete';
    var draw = '#draw';

    var activeStlye = 'btn-primary disabled';

    this.floorplanner = blueprint3d.floorplanner;

    var scope = this;

    function init() {

        $( window ).resize( scope.handleWindowResize );
        scope.handleWindowResize();

        // mode buttons
        scope.floorplanner.modeResetCallbacks.add(function(mode) {
            $(draw).removeClass(activeStlye);
            $(remove).removeClass(activeStlye);
            $(move).removeClass(activeStlye);
            if (mode == BP3D.Floorplanner.floorplannerModes.MOVE) {
                $(move).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $(draw).addClass(activeStlye);
            } else if (mode == BP3D.Floorplanner.floorplannerModes.DELETE) {
                $(remove).addClass(activeStlye);
            }

            if (mode == BP3D.Floorplanner.floorplannerModes.DRAW) {
                $("#draw-walls-hint").show();
                scope.handleWindowResize();
            } else {
                $("#draw-walls-hint").hide();
            }
        });

        $(move).click(function(){
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.MOVE);
        });

        $(draw).click(function(){
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DRAW);
        });

        $(remove).click(function(){
            scope.floorplanner.setMode(BP3D.Floorplanner.floorplannerModes.DELETE);
        });

        $('#floorplanner-zoom-out').click(function(){
            scope.floorplanner.zoom("out");
            scope.floorplanner.reset(true);
        });

        $('#floorplanner-zoom-in').click(function(){
            scope.floorplanner.zoom("in");
            scope.floorplanner.reset(true);
        });

        $('#floorplanner-zoom-home').click(function(){
            scope.floorplanner.zoom("home");
            scope.floorplanner.reset(true);
        });
    }

    this.updateFloorplanView = function() {
        scope.floorplanner.reset();
    };

    this.handleWindowResize = function() {
        $(canvasWrapper).height(window.innerHeight - $(canvasWrapper).offset().top);
        scope.floorplanner.resizeView();
    };

    init();
};

var mainControls = function(blueprint3d) {
    var blueprint3d = blueprint3d;
    var scope = this;

    function newDesign() {
        deleteAgents();
        blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":0,"y":500},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":500,"y":500},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":500,"y":0},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":0,"y":0}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
    }

    function loadDesign() {
        deleteAgents();
        blueprint3d.model.scene.loadedItems = [];
        files = $("#loadFile").get(0).files;
        var reader = new FileReader();
        var data;
        reader.onload = function(event) {
            data = event.target.result;
            blueprint3d.model.loadSerialized(data);
        };
        reader.readAsText(files[0]);

    }

    function saveDesign() {
        var data = blueprint3d.model.exportSerialized();
        var a = window.document.createElement('a');
        var blob = new Blob([data], {type : 'text'});
        a.href = window.URL.createObjectURL(blob);
        a.download = 'design.blueprint3d';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a)
    }

    function init() {
        $("#new").click(newDesign);
        $("#loadFile").change(loadDesign);
        $("#saveFile").click(saveDesign);
    }

    function deleteAgents(){
        for (var i=0; i<blueprint3d.model.scene.meshes.length; i++){
            blueprint3d.model.scene.remove(blueprint3d.model.scene.meshes[i]);
        }
    }

    init();
}

/*
 * Initialize!
 */

$(document).ready(function() {

    // main setup
    var opts = {
        floorplannerElement: 'floorplanner-canvas',
        threeElement: '#viewer',
        threeCanvasElement: 'three-canvas',
        textureDir: "models/textures/",
        widget: false
    }
    var blueprint3d = new BP3D.Blueprint3d(opts);

    var modalEffects = new ModalEffects(blueprint3d);
    var viewerFloorplanner = new ViewerFloorplanner(blueprint3d);
    var contextMenu = new ContextMenu(blueprint3d);
    var sideMenu = new SideMenu(blueprint3d, viewerFloorplanner, modalEffects);
    var textureSelector = new TextureSelector(blueprint3d, sideMenu);
    var cameraButtons = new CameraButtons(blueprint3d);
    mainControls(blueprint3d);

    // $.ajax('/js/LabGSI.blueprint3d', {
    $.ajax('/js/maps/Lab_GSI_2.blueprint3d', {
        async: false,
        dataType: 'text',
        success: function (data) {
            testing = data;
        }
    });

    var json = testing;
    // This serialization format needs work
    // Load a simple rectangle room
//  blueprint3d.model.loadSerialized('{"floorplan":{"corners":{"f90da5e3-9e0e-eba7-173d-eb0b071e838e":{"x":204.85099999999989,"y":289.052},"da026c08-d76a-a944-8e7b-096b752da9ed":{"x":672.2109999999999,"y":289.052},"4e3d65cb-54c0-0681-28bf-bddcc7bdb571":{"x":672.2109999999999,"y":-178.308},"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2":{"x":204.85099999999989,"y":-178.308},"a":{"x":0,"y":289.052},"b":{"x":0,"y":-178.308}},"walls":[{"corner1":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","corner2":"da026c08-d76a-a944-8e7b-096b752da9ed","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"da026c08-d76a-a944-8e7b-096b752da9ed","corner2":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"4e3d65cb-54c0-0681-28bf-bddcc7bdb571","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"a","corner2":"f90da5e3-9e0e-eba7-173d-eb0b071e838e","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"a","corner2":"b","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}},{"corner1":"b","corner2":"71d4f128-ae80-3d58-9bd2-711c6ce6cdf2","frontTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0},"backTexture":{"url":"rooms/textures/wallmap.png","stretch":true,"scale":0}}],"wallTextures":[],"floorTextures":{},"newFloorTextures":{}},"items":[]}');
//     blueprint3d.model.loadSerialized(blueprint3d.model.floorJSON);
    blueprint3d.model.loadSerialized(json);
});

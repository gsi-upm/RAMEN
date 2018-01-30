How to use 
==========

Creating the floor plan
***********************

First of all, you need to create the floor plan in which the simulation is going to take place. For that purpose you can import it as a JSON file or use the floorplanner tool.

The structure of the JSON file is the following:

.. code:: json

	{"floorplan": {
		"corners": {
			"C1": {"x": 0, "y": 0},
			"C2": {"x": 200, "y": 0}
		},
		"walls": [{
			"corner1": "C1",
			"corner2": "C2",
			"frontTexture": {
				"url": "rooms/textures/wallmap.png",
				"stretch": true,
				"scale": 0
			},    
			"backTexture": {
				"url": "rooms/textures/wallmap.png",
				"stretch": true,
				"scale": 0
			}
		}],
	},
	"items": [{
		"item_name": "Open Door",
		"item_type": 7,
		"model_url": "../models/js/open_door.js",
		"xpos": 100,
		"ypos": 0,
		"zpos": 0,
		"rotation": 0,
		"scale_x": 1,
		"scale_y": 1,
		"scale_z": 1,
		"fixed": false
	}]
	}

In this JSON is defined all the floor plan and the items in it. The code above is an example of a wall of 2 metres long with a door in the middle. In order to define it, you have to follow this steps:

* Corners: to declare a corner, it has to be proportionated the id of the corner and its coordinates x and y.

* Walls:  The textures indicate the color of the wall and it is proportionated by a PNG image. Each wall has two different textures instead of one because a wall could be shared between two different rooms and those rooms could have different wall's color. 

* Items: to declare an item, it has to be defined the item's name, the item's type, the model's url to the 3D model file and the position, rotation and scale. 

It is also possible to generate the scenario using the floor planner tool. For that purpose, you have to click *Edit Floorplan* in the left menu and draw the floorplan using the interface. Once the floor plan is created, you can place the furniture clicking in *Add Item* in the left menu. When you have finished, you can save the floorplan clicking the button *Save Plan*.

.. image:: /images/floorplanner.png
  :align: center
  :scale: 100%

In order to load an specific plan when loading RAMEN, it has to be located in *"/executable/js/maps/map.json"* or it can be loaded using the *Load Plan* button.

Furthermore, to identify a room by a specific name it has to be created the rooms JSON in *"/executable/js/maps/rooms.json"* or loaded using the *Load Rooms* button. It has to be declared the name and the coordinates of the center of the room with the following structure:

.. code:: json

	{"room": 
		[{
			"name": "Hall.1",
			"x": 500,
			"y": 400
		}]
	}

Setting Movement
****************

Once the floor plan is created and loaded, we have to define the actions that are going to occur in the simulation. The different actions that can be executed are the following ones:

* Add new agent: it is needed an agent id, its position and its sentiment. The ids have to be defined in order, starting in 0.

* Turn on/off lights: it is needed a parameter that indicates if the light has to be turn on or off and the room in which  this action is wanted to be executed.

* Turn on/off TV: it is needed a parameter that indicates if the TV has to be switched on or off and the room in which this action is wanted to be executed.

* Move an agent: it is declared in different ways depending on which type of simulation are we running. In the following examples is shown how it has to be declared.

* Add fire: the possibility of adding fire is implemented in order to represent fire evacuations. It is needed a parameter that indicates if there is fire and its position.

* Change agent's sentiment:  it is needed the agent id and the sentiment. This provides the possibility of changing the sentiment of the agent in any step. It can also be changed when the movement is declared, so the agent's sentiment will change before the movement starts. To do so, it is necessary to add the attribute *sentiment* in the declaration.

* Remove an agent:  in order to represent an agent leaving the building, the *outBuilding* attribute is used. It is needed the agent id and the parameter that indicates that it is out of the building.

These actions can be executed in real time or in batch mode.

In order to execute them in batch mode, a JSON file is declared. It is divided in steps and in each one, all the actions that happen in that moment are defined. The steps are a way of measuring time and everyone has the same duration, **100 ms**. There are three different ways to declare them:

* Type 0: it defines the position of the agents by rooms.

	.. code:: json

		{
			"type" : 0,
			"steps": [
			[
				{
				"agent": 0,
				"position": "C.10",
				"sentiment": "anger"
				},
				{
				"agent": 1,
				"position": "C.1",
				"sentiment": "happiness"
				}
			],
			[
				{
				"light": false,
				"room": "Lab1"
				},
				{
				"video": true,
				"room": "Office3"
				},
				{
				"fire": true,
				"room": "Office1"
				},
			],
			[
				{
				"agent": 0,
				"moveTo": "C.2",
				"toStep": 15
				},
				{
				"agent": 1,
				"sentiment": "sadness",
				}
			]
			]
		}

* Type 1: it defines the position of the agents by coordinates.

	.. code:: json

		{ 
			"type" : 1,
			"steps": [
				[
					{
					"agent": 0,
					"position": {"x": 800, "y": 500},
					"sentiment": "hapiness"
					}
				],
				[
					{
					"agent": 0,
					"moveTo": {"x": 2000, "y": 400},
					"toStep": 10
					}	
				]
			]
		}		

* Type 2: it defines the movement of the agents by direction and speed.


	.. code:: json

		{
			"type": 2,
			"steps": [
			[
				{
					"agent": 0,
					"position": {"x": 250, "y": 100},
					"sentiment": "happiness",
					"rotation": "E"
				}
			],
			[
				{
					"agent": 0,
					"direction": "E",
					"speed": 1
				}
			],
			[
				{
					"agent":0,
					"stop":true
				}
			]
			]
		}

This file has to be loaded using the interface that appears when the play button is selected. In the other hand, when the play button is pressed, the option of executing the actions in real time is also available. If we click on it, the socket will be opened and ready to receive the actions. These actions has to be defined with the same structure as above, but only one step. In order to send the data, it can be done in the following way:

.. code:: bash

	curl -d @data.json -X POST http://localhost:8001/api

Being *data.json* the data that is wanted to be send.



Starting the simulation
***********************

Finally, when the floor plan and the movements are declared, we are ready to play the simulation. The camera can be controlled using the mouse or the camera buttons placed at the bottom of the display. Furthermore, the simulation can be started, paused or played faster using the simulation controls placed at the top of the display.  
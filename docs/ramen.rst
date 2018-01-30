What is RAMEN?
==============

Representation of Animated Multitudes in ENvironments.

RAMEN is an agent-based social simulation visualization tool for indoor crowd analytics based on the library Three.js. It allows to visualize a social simulation in a 3D environment and also to create the floor plan of a building.

.. image:: /images/lab_gsi_example.png
  :align: center
  :scale: 60%


Architecture
------------
RAMEN is divided in three main modules:

* Batch module: this module is in charge of collecting the data proportionated by the user, such as the floor plan, the rooms assignation and the movement of the agents.
* Model generator: thanks to the data collected by the batch module, it is able to generate the scene in which there are the different elements that are going to be represented. The main elements are the floor plan, the agents, the items and the camera. All of them make use of the renderer which proportionates the data to represent the visualization.
* Visualization module: it manages the final result of the visualization on the browser.


.. image:: /images/architecture.png
  :align: center
  :scale: 75%

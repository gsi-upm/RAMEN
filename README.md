# RAMEN

Representation of Animated Multitudes in ENvironments.

RAMEN is an agent-based social simulation visualization tool for indoor crowd analytics based on the library Three.js. It allows to visualize a social simulation in a 3D environment and also to create the floor plan of a building.

## Getting Started

To get started, clone the repository and follow the next steps.

### Prerequisites

Ensure you have installed npm and grunt.

### Installing

Once you have them installed, run the following commands:

```
npm install
grunt
```

The latter command generates `executable/js/ramen.js` from `src`.

### Running locally

The easiest way to run locally is to run a local server from the `executable` directory.
```
cd executable
python visual.py
```

Then, visit `http://localhost:8001` in your browser.
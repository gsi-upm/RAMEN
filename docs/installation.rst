Installation
============

First of all, you need to clone the GitHub repository:

.. code:: bash

	git clone https://github.com/gsi-upm/RAMEN.git
	cd ramen

Once you have downloaded RAMEN, you have to ensure that you have installed npm and grunt. Then, execute the following commands:

.. code:: bash

	npm install
	grunt

The latter command generates `"executable/js/ramen.js"` from `src`.

The easiest way to run locally is to run a local server from the `executable` directory. 

.. code:: bash

	cd executable
	python visual.py

Then, visit *http://localhost:8001* in your browser.
import os
import tornado.ioloop
import tornado.web
import tornado.websocket
import tornado.escape
import tornado.gen
#import webbrowser

from datetime import timedelta

class VisualizationElement:
	"""
	Defines an element of the visualization.
	Attributes:
		package_includes: A list of external JavaScript files to include that
						  are part of the Mesa packages.
		local_includes: A list of JavaScript files that are local to the
						directory that the server is being run in.
		js_code: A JavaScript code string to instantiate the element.
	Methods:
		render: Takes a model object, and produces JSON data which can be sent
				to the client.
	"""

	package_includes = []
	local_includes = []
	js_code = ''
	render_args = {}

	def __init__(self):
		pass

	def render(self, model):
		""" Build visualization data from a model object.
		Args:
			model: A model object
		Returns:
			A JSON-ready object.
		"""
		return "<b>VisualizationElement goes here</b>."
		



class ApiHandler(tornado.web.RequestHandler):
	""" Handler for the HTML template which holds the visualization. """
	def get(self):
		self.write("this is story %s" % tornado.web.RequestHandler.get_query_argument(self, 'name'))
		print('hey yo!')

	def post(self):
		data = tornado.escape.json_decode(self.request.body)
		print("DATA", data)
		self.application.message_post = data

		#print("this is story %s" % tornado.web.RequestHandler.get_body_argument(self, 'name'))
		#self.application.message_post = tornado.web.RequestHandler.get_body_argument(self, 'name')

class PageHandler(tornado.web.RequestHandler):
	""" Handler for the HTML template which holds the visualization. """
	def get(self):
		elements = self.application.visualization_elements
		for i, element in enumerate(elements):
			element.index = i

		#self.render("../test3.html", port=self.application.port,
		self.render("../index.html", port=self.application.port,
					model_name=self.application.model_name,
					package_includes=self.application.package_includes,
					local_includes=self.application.local_includes,
					scripts=self.application.js_code)


class SocketHandler(tornado.websocket.WebSocketHandler):
	""" Handler for websocket. """
	def open(self):
		if self.application.verbose:
			print("Socket opened!")

		self.schedule_update()

	def check_origin(self, origin):
		return True

	def on_message(self, message):
		""" Receiving a message from the websocket, parse, and act accordingly."""
		
		print('Socket received!')
		
		if self.application.verbose:
			print(message)

		#config = yaml.load(message)

		#self.application.model.run(config)

		
		'''if msg["type"] == "fileReceived":
			self.application.model.run()
			self.write_message({"type": "viz_state",
					"data": self.application.render_model()})
			print(document['name'])

		elif msg["type"] == "reset":
			self.application.reset_model()
			self.write_message({"type": "viz_state",
					"data": self.application.render_model()})

		else:
			if self.application.verbose:
				print("Unexpected message!")'''
	def schedule_update(self):
		self.timeout = tornado.ioloop.IOLoop.instance().add_timeout(timedelta(milliseconds=100),
													 self.update_client)
	def update_client(self):
		try:
			if (self.application.message_post != None):
				self.write_message({'type': 'test', 'data':self.application.message_post})
				self.application.message_post = None
		finally:
			self.schedule_update()

	def on_close(self):
		tornado.ioloop.IOLoop.instance().remove_timeout(self.timeout)
		print('disconnected')


		

class ModularServer(tornado.web.Application):
	""" Main visualization application. """
	verbose = True
	model_cls = None
	portrayal_method = None
	port = 8521 # Default port to listen on
	model_args = ()
	model_kwargs = {}

	# Handlers and other globals:	
	page_handler = (r'/', PageHandler)
	api_handler = (r'/api', ApiHandler)

	socket_handler = (r'/ws', SocketHandler)

	static_handler = (r'/(.*)', tornado.web.StaticFileHandler,
					  {"path": os.path.dirname(__file__)+"/../"})
					  #{"path": 'html'})
	local_handler = (r'/local/(.*)', tornado.web.StaticFileHandler,
					 {"path": ''})

	handlers = [page_handler, api_handler, socket_handler, static_handler, local_handler]
	settings = {"debug": True,
				"template_path": os.path.dirname(__file__)}


	message_post = None

	def __init__(self, model_cls, visualization_elements, name="SOIL",
				 *args, **kwargs):

		""" Create a new visualization server with the given elements. """
		# Prep visualization elements:
		self.visualization_elements = visualization_elements
		self.package_includes = set()
		self.local_includes = set()
		self.js_code = []
		for element in self.visualization_elements:
			for include_file in element.package_includes:
				self.package_includes.add(include_file)
			for include_file in element.local_includes:
				self.local_includes.add(include_file)
			self.js_code.append(element.js_code)

		# Initializing the model	
		self.model_name = name
		self.model = model_cls

		self.model_args = args
		self.model_kwargs = kwargs
		#self.reset_model()
		# Initializing the application itself:		
		super().__init__(self.handlers, **self.settings)
	'''
	def reset_model(self):
		self.model = self.model_cls(*self.model_args, **self.model_kwargs)
	'''
	def render_model(self):
		""" Turn the current state of the model into a dictionary of
		visualizations
		"""
		visualization_state = []
		for element in self.visualization_elements:
			element_state = element.render(self.model)
			visualization_state.append(element_state)
		return visualization_state

	def launch(self, port=None):
		""" Run the app. """
		if port is not None:
			self.port = port
		url = 'http://127.0.0.1:{PORT}'.format(PORT=self.port)
		print('Interface starting at {url}'.format(url=url))
		self.listen(self.port)
		#webbrowser.open(url)
		tornado.ioloop.IOLoop.instance().start()
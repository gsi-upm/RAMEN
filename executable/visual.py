from server.server import ModularServer

class Model:

    def run(self, config):
        name = config['name']
        print('Using config(s): {name}'.format(name=name))


def run(model, params = 0):
    server = ModularServer(model, [], "Simulation", params)
    server.port = 8001
    server.launch()

if __name__ == "__main__":
    run(Model())
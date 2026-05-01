from Entity import Player, Enemy


class GameManager:
    def __init__(self):
        self.state = "INIT"  # INIT / RUNNING / GAME_OVER
        self.player = None
        self.enemies = []

    def start_game(self):
        self.state = "RUNNING"
        self.player = Player()
        self.enemies = [Enemy()]

    def update(self):
        if self.state != "RUNNING":
            return

        self.player.update()
        for enemy in self.enemies:
            enemy.update()

        self.check_game_over()

    def check_game_over(self):
        for enemy in self.enemies:
            if enemy.position == self.player.position:
                self.state = "GAME_OVER"
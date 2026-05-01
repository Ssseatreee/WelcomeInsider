from Entity import Player, Enemy


class GameManager:
    def __init__(self,game_map):
        self.state = "INIT"  # INIT / RUNNING / GAME_OVER
        self.player = None
        self.enemies = []
        self.game_map = game_map

    def start_game(self):
        self.state = "RUNNING"
        self.player = Player(self.game_map)
        self.enemies = [Enemy(self.game_map,self.player)]

    def update(self):
        if self.state != "RUNNING":
            return

        self.player.update()
        # 调试
        print(f"Player:{self.player.position}")
        for enemy in self.enemies:
            enemy.update()
            # 调试
            print(f"Enemy:{enemy.position}")

        self.check_game_over()

    def check_game_over(self):
        for enemy in self.enemies:
            if enemy.position == self.player.position:
                self.state = "GAME_OVER"
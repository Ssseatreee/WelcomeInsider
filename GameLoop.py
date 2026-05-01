from GameManager import GameManager
from GameMap import GameMap

width = 100
height = 100

if __name__ == "__main__":
    gameMap = GameMap(width, height)
    game = GameManager(gameMap)

    input("按回车开始游戏...")  # “开始游戏按钮”

    game.start_game()

    import time
    while game.state == "RUNNING":
        game.update()
        time.sleep(0.2)

    print("游戏结束")
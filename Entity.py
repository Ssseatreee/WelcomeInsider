class Entity:
    def __init__(self, id, name, speed, position, game_map):
        self.id = id
        self.name = name
        self.speed = speed
        self.position = position
        self.game_map=game_map

    def move(self, dx, dy):
        new_pos = [self.position[0] + dx, self.position[1] + dy]

        # 边界检测
        if self.game_map.is_valid_position(new_pos):
            self.position = new_pos


    def update(self):
        pass

class Player(Entity):
    def __init__(self, game_map):
        super().__init__(
            id = 0,
            name = "Richele",
            speed = 1,
            position = [0, 0],
            game_map = game_map
        )

    def update(self):
        # 从输入读取方向（先可以写死）
        cmd = input("move (w/a/s/d): ")
        if cmd == "w":
            self.move(0, -1)
        elif cmd == "s":
            self.move(0, 1)
        elif cmd == "a":
            self.move(-1, 0)
        elif cmd == "d":
            self.move(1, 0)


class Enemy(Entity):
    def __init__(self, game_map, player):
        super().__init__(
            id = 2,
            name = "Enemy",
            speed = 1,
            position = [5, 5],
            game_map = game_map
        )
        self.player = player

    def update(self):
        # 简单AI：随机走 or 朝玩家走
        px, py = self.player.position
        ex, ey = self.position

        dx = px - ex
        dy = py - ey

        # 每次只走一步（像吃豆人那种）
        move_x = 0
        move_y = 0

        if abs(dx) > abs(dy):
            move_x = 1 if dx > 0 else -1
        else:
            move_y = 1 if dy > 0 else -1

        self.move(move_x, move_y)
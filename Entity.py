class Entity:
    def __init__(self, id, name, speed, position):
        self.id = id
        self.name = name
        self.speed = speed
        self.position = position

    def move(self, direction):
        # 简单移动逻辑
        pass

    def update(self):
        pass

class Player(Entity):
    def update(self):
        # 从输入读取方向（先可以写死）
        pass


class Enemy(Entity):
    def update(self):
        # 简单AI：随机走 or 朝玩家走
        pass
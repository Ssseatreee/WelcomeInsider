import * as Phaser from 'phaser';

export default class NPC extends Phaser.Physics.Matter.Sprite
{
    constructor(scene, x, y, config)
    {
        super(
            scene.matter.world,
            x,
            y,
            config.texture,
            0
        );

        scene.add.existing(this);

        // ===== 基础信息 =====
        this.scene = scene;

        this.npcName = config.name;

        this.type = config.type || 'civilian';

        this.hasEmpathy =
            config.hasEmpathy || false;

        this.dialogues =
            config.dialogues || [];

        this.minimapColor =
            config.minimapColor || 0xffffff;

        this.moveSpeed =
            config.moveSpeed || 1.5;

        this.enableBubbleDialogue = 
            config.enableBubbleDialogue || false;

        // ===== 状态 =====
        this.state = 'idle';

        this.facing = 'right';

        this.isNPC = true;

        // ===== Matter =====
        this.setFixedRotation();

        this.setBody({
            type: 'rectangle',
            width: 24,
            height: 24
        });

        this.setDisplaySize(32, 32);

        // ===== 随机移动 =====
        this.wanderTimer = 0;

        this.idleTimer = 0;

        // ===== 随机发言 =====
        this.bubbleText = scene.add.text(
            x,
            y - 40,
            '',
            {
                fontSize: '16px',
                color: '#ffffff',
                backgroundColor: '#000000'
            }
        );

        this.bubbleText.setOrigin(0.5);

        this.bubbleText.setDepth(500);

        // 定时随机说话
        if(config.enableBubbleDialogue)
        {
            this.startRandomDialogue();
        }
    }

    // =====================================
    // 动画
    // =====================================

    playDirectionAnimation(direction)
    {
        this.facing = direction;

        this.play(
            `${this.npcName}-${direction}`,
            true
        );
    }

    // =====================================
    // 移动
    // =====================================

    move(dx, dy)
    {
        this.setVelocity(
            dx * this.moveSpeed,
            dy * this.moveSpeed
        );
    }

    stopMoving()
    {
        this.setVelocity(0, 0);
    }

    // =====================================
    // 随机游荡
    // =====================================

    randomMove()
    {
        const directions = [
            { x: 1, y: 0, dir: 'right' },
            { x: -1, y: 0, dir: 'left' },
            { x: 0, y: 1, dir: 'down' },
            { x: 0, y: -1, dir: 'up' },
            { x: 0, y: 0, dir: 'idle' }
        ];

        const choice =
            Phaser.Utils.Array.GetRandom(
                directions
            );

        this.move(choice.x, choice.y);

        if (choice.dir !== 'idle')
        {
            this.playDirectionAnimation(
                choice.dir
            );
        }
    }

    // =====================================
    // 共感检测
    // =====================================

    canSensePlayer()
    {
        return this.hasEmpathy;
    }

    // =====================================
    // 玩家追踪
    // =====================================

    chasePlayer(player)
    {
        const dx = player.x - this.x;
        const dy = player.y - this.y;

        const length =
            Math.sqrt(dx * dx + dy * dy);

        if (length <= 0.01)
        {
            return;
        }

        const vx = dx / length;
        const vy = dy / length;

        this.move(vx, vy);

        // 方向动画
        if (Math.abs(dx) > Math.abs(dy))
        {
            if (dx > 0)
            {
                this.playDirectionAnimation(
                    'right'
                );
            }
            else
            {
                this.playDirectionAnimation(
                    'left'
                );
            }
        }
        else
        {
            if (dy > 0)
            {
                this.playDirectionAnimation(
                    'down'
                );
            }
            else
            {
                this.playDirectionAnimation(
                    'up'
                );
            }
        }
    }

    // =====================================
    // 小地图信息
    // =====================================

    shouldShowOnMinimap()
    {
        if (this.hasEmpathy)
        {
            return true;
        }

        return this.scene.playerHasDetector;
    }

    getMinimapData()
    {
        return {
            x: this.x,
            y: this.y,
            color: this.minimapColor,
            visible: this.shouldShowOnMinimap()
        };
    }

    // =====================================
    // 随机发言
    // =====================================

    startRandomDialogue()
    {
        if (this.dialogues.length <= 0)
        {
            return;
        }

        this.scene.time.addEvent({
            delay: Phaser.Math.Between(
                5000,
                12000
            ),

            loop: true,

            callback: () => {

                this.sayRandomLine();

            }
        });
    }

    sayRandomLine()
    {
        const text =
            Phaser.Utils.Array.GetRandom(
                this.dialogues
            );

        this.bubbleText.setText(text);

        this.bubbleText.setVisible(true);

        this.scene.time.delayedCall(
            3000,
            () => {

                this.bubbleText.setVisible(false);

            }
        );
    }

    // =====================================
    // 更新
    // =====================================

    update(time, delta)
    {
        // 更新气泡位置
        this.bubbleText.setPosition(
            this.x,
            this.y - 40
        );

        // Hunter
        if (
            this.type === 'hunter'
            &&
            this.canSensePlayer()
        )
        {
            this.chasePlayer(
                this.scene.player
            );

            return;
        }

        // 普通随机移动
        this.wanderTimer -= delta;

        if (this.wanderTimer <= 0)
        {
            this.randomMove();

            this.wanderTimer =
                Phaser.Math.Between(
                    1000,
                    3000
                );
        }
    }
}
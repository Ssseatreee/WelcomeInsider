// import { use } from 'matter';
import * as Phaser from 'phaser';
import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X
} from '../game/layout.js';

export default class DialogueManager
{
    constructor(scene)
    {
        this.scene = scene;

        this.dialogIndex = 0;

        this.dialogues = [];

        this.isPlaying = false;

        this.isShowingObjectDialogue = false;
        this.objectDialogCooldown = false;
        this.objectDialogCanClose = false;

        const boxY = GAME_HEIGHT - 110;

        // 背景
        this.box = scene.add.rectangle(
            PLAY_AREA_UI_CENTER_X,
            boxY,
            900,
            180,
            0x000000,
            0.8
        );

        this.box.setVisible(false);
        this.box.setDepth(200);
        this.box.setScrollFactor(0);

        // 文本
        this.text = scene.add.text(
            this.box.x - 420,
            this.box.y - 70,
            '',
            {
                fontSize: '30px',
                color: '#ffffff',
                wordWrap: {
                    width: 840
                }
            }
        );
        this.objectDialogText = scene.add.text(
            this.box.x - 420,
            this.box.y - 70,
            '',
            {
                fontSize: '30px',
                color: '#ffffff',
                wordWrap: {
                    width: 840,
                    useAdvancedWrap: true
                },
                lineSpacing: 18
            }
        );
        this.text.setScrollFactor(0);
        this.objectDialogText.setScrollFactor(0);
        this.objectDialogText.setOrigin(0, 0);
        this.objectDialogText.setVisible(false);
        this.objectDialogText.setDepth(250);

        this.text.setVisible(false);
        this.text.setDepth(250);

        this.leftPortrait = scene.add.image(
            this.box.x - 320,
            this.box.y - 50,
            ''
        );
        this.leftPortrait.setVisible(false);
        this.leftPortrait.setScale(1.3);
        this.leftPortrait.setDepth(180);

        this.rightPortrait = scene.add.image(
            this.box.x + 320,
            this.box.y - 50,
            ''
        );
        this.rightPortrait.setVisible(false);
        this.rightPortrait.setScale(1.3);
        this.rightPortrait.setDepth(180);

        this.leftPortrait.setScrollFactor(0);
        this.rightPortrait.setScrollFactor(0);

        // SPACE继续
        this.spaceKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    start(dialogues)
    {
        this.leftPortrait.setVisible(true);
        this.rightPortrait.setVisible(true);

        this.dialogues = dialogues;

        this.dialogIndex = 0;

        this.isPlaying = true;

        this.box.setVisible(true);

        this.text.setVisible(true);

        this.showCurrentDialogue();

        this.currentNPC =
            dialogues.find(
                d => d.speaker !== 'richele'
        )?.speaker;
        this.leftPortrait.setTexture(
            'portrait-richele-normal'
        ); 
        this.rightPortrait.setTexture(
            `portrait-${this.currentNPC}-normal`
        );

        this.updatePortrait(dialogues[0]);
    }

    update()
    {
        // ===== 物品对话 =====

        if (this.isShowingObjectDialogue)
        {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey))
            {
                console.log('关闭物品对话');

                this.box.setVisible(false);

                this.objectDialogText.setVisible(false);

                this.isShowingObjectDialogue = false;

                this.objectDialogCooldown = true;

                this.scene.time.delayedCall(300, () => {

                    this.objectDialogCooldown = false;

                });
            }

            return;
        }

        // ===== 普通剧情对话 =====

        if (!this.isPlaying)
        {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey))
        {
            this.dialogIndex++;

            if (this.dialogIndex >= this.dialogues.length)
            {
                this.end();
            }
            else
            {
                this.showCurrentDialogue();
            }
        }
    }

    showCurrentDialogue()
    {
        const current = this.dialogues[this.dialogIndex];
        this.text.setText(current.text);
        this.updatePortrait(current);
    }

    showObjectDialogue(object)
    {
        console.log(
            this.isPlaying,
            this.isShowingObjectDialogue,
            this.objectDialogCooldown
        );

        if (this.isPlaying || this.isShowingObjectDialogue || this.objectDialogCooldown)
        {
            return;
        }

        console.log('showObjectDialogue执行');

        const dialogProp =
            object.properties.find(
                p => p.name === 'dialog'
            );

        if (!dialogProp)
        {
            return;
        }

        this.objectDialogText.setWordWrapWidth(840);

        const wrappedText =
            this.wrapChineseText(
                dialogProp.value,
                24
            );

        this.objectDialogText.setText(
            wrappedText
        );
        this.box.setVisible(true);

        this.objectDialogText.setVisible(true);

        this.isShowingObjectDialogue = true;
        this.objectDialogCanClose = false;

        this.scene.time.delayedCall(150, () => {

            this.objectDialogCanClose = true;

        });
    }

    wrapChineseText(text, maxCharsPerLine = 24)
    {
        let result = '';

        for (let i = 0; i < text.length; i++)
        {
            result += text[i];

            if ((i + 1) % maxCharsPerLine === 0)
            {
                result += '\n';
            }
        }

        return result;
    }

    updatePortrait(dialogue)
    {
        const speaker = dialogue.speaker;

        const expression = dialogue.expression;

        const textureKey = `portrait-${speaker}-${expression}`;

        // 主角固定左边，NPC固定右边
        if (speaker === 'richele')
        {
            this.leftPortrait.setTexture(
                textureKey
            );

            this.leftPortrait.setVisible(true);
            this.leftPortrait.setAlpha(1);
            this.rightPortrait.setAlpha(0.5);

            this.leftPortrait.setDepth(180);
        }
        else
        {
            this.rightPortrait.setTexture(
                textureKey
            );

            this.rightPortrait.setVisible(true);
            this.rightPortrait.setAlpha(1);
            this.leftPortrait.setAlpha(0.5);

            this.rightPortrait.setDepth(180);
        }
    }


    end()
    {
        this.isPlaying = false;

        this.box.setVisible(false);

        this.text.setVisible(false);

        // 隐藏立绘
        this.leftPortrait.setVisible(false);
        this.rightPortrait.setVisible(false);

        this.scene.onDialogueEnd();
    }
}
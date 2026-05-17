import * as Phaser from 'phaser';

export default class DialogueManager
{
    constructor(scene)
    {
        this.scene = scene;

        this.dialogIndex = 0;

        this.dialogues = [];

        this.isPlaying = false;

        // 背景
        this.box = scene.add.rectangle(
            512,
            650,
            960,
            180,
            0x000000,
            0.85
        );

        this.box.setVisible(false);

        // 文本
        this.text = scene.add.text(
            90,
            620,
            '',
            {
                fontSize: '30px',
                color: '#ffffff',
                wordWrap: {
                    width: 840
                }
            }
        );

        this.text.setVisible(false);

        // 显示主角立绘
        this.leftPortrait = scene.add.image(
            220,
            530,
            ''
        );
        this.leftPortrait.setVisible(false);
        this.leftPortrait.setScale(1.2);
        this.leftPortrait.setDepth(-1);
        // 显示NPC立绘
        this.rightPortrait = scene.add.image(
            804,
            530,
            ''
        );
        this.rightPortrait.setVisible(false);
        this.rightPortrait.setScale(1.2);
        this.rightPortrait.setDepth(-1);

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
    }

    update()
    {
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

            this.leftPortrait.setDepth(-1);
        }
        else
        {
            this.rightPortrait.setTexture(
                textureKey
            );

            this.rightPortrait.setVisible(true);
            this.rightPortrait.setAlpha(1);
            this.leftPortrait.setAlpha(0.5);

            this.rightPortrait.setDepth(-1);
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
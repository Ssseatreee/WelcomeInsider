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
            400,
            520,
            700,
            100,
            0x000000,
            0.8
        );

        this.box.setVisible(false);

        // 文本
        this.text = scene.add.text(
            80,
            485,
            '',
            {
                fontSize: '24px',
                color: '#ffffff',
                wordWrap: {
                    width: 640
                }
            }
        );

        this.text.setVisible(false);

        // SPACE继续
        this.spaceKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );
    }

    start(dialogues)
    {
        this.dialogues = dialogues;

        this.dialogIndex = 0;

        this.isPlaying = true;

        this.box.setVisible(true);

        this.text.setVisible(true);

        this.showCurrentDialogue();
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
        this.text.setText(
            this.dialogues[this.dialogIndex]
        );
    }

    end()
    {
        this.isPlaying = false;

        this.box.setVisible(false);

        this.text.setVisible(false);

        this.scene.onDialogueEnd();
    }
}
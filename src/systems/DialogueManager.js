// import { use } from 'matter';
import * as Phaser from 'phaser';
import items from '../data/items.js';
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

        this.isShowingChoices = false;
        this.currentChoices = [];
        this.selectedChoiceIndex = 0;
        this.choiceTexts = [];

        this.isShowingEffect = false;
        this.effectPhase = null;
        this.effectTimers = [];

        /** 各角色最近一次说话时的表情 */
        this.lastExpressions = {};

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

        this.effectImage = scene.add.image(
            PLAY_AREA_UI_CENTER_X,
            GAME_HEIGHT / 2 - 20,
            'item-coffee'
        );

        this.effectImage.setScrollFactor(0);
        this.effectImage.setDepth(300);
        this.effectImage.setVisible(false);

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

        const choiceStyle = {
            fontSize: '26px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { left: 12, right: 12, top: 6, bottom: 6 }
        };

        for (let i = 0; i < 2; i++)
        {
            const choiceText =
                scene.add.text(
                    this.box.x - 420,
                    this.box.y + 10 + i * 42,
                    '',
                    choiceStyle
                );

            choiceText.setScrollFactor(0);
            choiceText.setDepth(260);
            choiceText.setVisible(false);
            choiceText.setInteractive({ useHandCursor: true });

            const index = i;

            choiceText.on('pointerover', () =>
            {
                if (this.isShowingChoices)
                {
                    this.selectedChoiceIndex = index;
                    this.updateChoiceHighlight();
                }
            });

            choiceText.on('pointerdown', () =>
            {
                if (this.isShowingChoices)
                {
                    this.selectChoice(index);
                }
            });

            this.choiceTexts.push(choiceText);
        }

        this.choiceHint = scene.add.text(
            this.box.x - 420,
            this.box.y + 95,
            '↑↓ 选择  ·  空格确认',
            {
                fontSize: '18px',
                color: '#888888'
            }
        );

        this.choiceHint.setScrollFactor(0);
        this.choiceHint.setDepth(260);
        this.choiceHint.setVisible(false);

        // SPACE继续
        this.spaceKey = scene.input.keyboard.addKey(
            Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        this.cursors =
            scene.input.keyboard.createCursorKeys();
    }

    start(dialogues)
    {
        this.clearEffectTimers();
        this.isShowingEffect = false;
        this.effectPhase = null;
        this.hideChoices();

        this.leftPortrait.setVisible(true);
        this.rightPortrait.setVisible(true);

        this.dialogues = dialogues;

        this.dialogIndex = 0;

        this.isPlaying = true;

        this.currentNPC =
            dialogues.find(
                d => d.speaker && d.speaker !== 'richele'
            )?.speaker;

        this.lastExpressions = { richele: 'normal' };

        if (this.currentNPC)
        {
            this.lastExpressions[this.currentNPC] = 'normal';
        }

        this.box.setVisible(true);

        this.text.setVisible(true);
        this.resetDialogueTextLayout();

        this.showCurrentDialogue();
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

        // ===== 选项效果（仍在对话中）=====

        if (this.isShowingEffect)
        {
            if (
                this.effectPhase === 'message'
                &&
                Phaser.Input.Keyboard.JustDown(this.spaceKey)
            )
            {
                this.finishEffectAndEnd();
            }

            return;
        }

        // ===== 选项 =====

        if (this.isShowingChoices)
        {
            if (
                Phaser.Input.Keyboard.JustDown(
                    this.cursors.up
                )
            )
            {
                this.selectedChoiceIndex = Math.max(
                    0,
                    this.selectedChoiceIndex - 1
                );

                this.updateChoiceHighlight();
            }

            if (
                Phaser.Input.Keyboard.JustDown(
                    this.cursors.down
                )
            )
            {
                this.selectedChoiceIndex = Math.min(
                    this.currentChoices.length - 1,
                    this.selectedChoiceIndex + 1
                );

                this.updateChoiceHighlight();
            }

            if (Phaser.Input.Keyboard.JustDown(this.spaceKey))
            {
                this.selectChoice(this.selectedChoiceIndex);
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
                this.tryFinishOrShowEffect();
            }
            else
            {
                this.showCurrentDialogue();
            }
        }
    }

    resetDialogueTextLayout()
    {
        this.text.setOrigin(0, 0);
        this.text.setPosition(
            this.box.x - 420,
            this.box.y - 70
        );
    }

    clearEffectTimers()
    {
        this.effectTimers.forEach(timer => timer.remove());
        this.effectTimers = [];
    }

    tryFinishOrShowEffect()
    {
        const effect =
            this.scene.pendingNeutralEffect;

        if (effect === 'betrayOren')
        {
            this.scene.applyBetrayOren?.();
            this.scene.pendingNeutralEffect = null;
            this.end();
            return;
        }

        if (effect)
        {
            this.beginEffectPhase(effect);
            return;
        }

        this.end();
    }

    beginEffectPhase(effect)
    {
        this.isShowingEffect = true;
        this.hideChoices();

        this.leftPortrait.setVisible(false);
        this.rightPortrait.setVisible(false);

        this.scene.applyNeutralEffect?.(effect);

        if (effect === 'azeCoffee')
        {
            const { textureKey, effectMessage } =
                items.azeCoffee;

            this.text.setVisible(false);
            this.effectImage.setTexture(textureKey);
            this.effectImage.setVisible(true);

            this.effectPhase = 'coffee_image';

            this.effectTimers.push(
                this.scene.time.delayedCall(3000, () =>
                {
                    this.effectImage.setVisible(false);
                    this.resetDialogueTextLayout();
                    this.text.setText(effectMessage);
                    this.text.setVisible(true);
                    this.effectPhase = 'message';
                })
            );
        }
        else if (effect === 'clearWork')
        {
            this.effectImage.setVisible(false);
            this.resetDialogueTextLayout();
            this.text.setText(
                items.clearWork.effectMessage
            );
            this.text.setVisible(true);
            this.effectPhase = 'message';
        }
        else
        {
            this.finishEffectAndEnd();
        }
    }

    finishEffectAndEnd()
    {
        this.clearEffectTimers();
        this.isShowingEffect = false;
        this.effectPhase = null;
        this.effectImage.setVisible(false);
        this.end();
    }

    showCurrentDialogue()
    {
        const current = this.dialogues[this.dialogIndex];

        if (current.choices)
        {
            this.showChoices(current.choices);
            return;
        }

        this.hideChoices();
        this.resetDialogueTextLayout();
        this.text.setText(current.text);
        this.updatePortrait(current);
    }

    showChoices(choices)
    {
        this.isShowingChoices = true;
        this.currentChoices = choices;
        this.selectedChoiceIndex = 0;

        choices.forEach((choice, index) =>
        {
            const text =
                this.choiceTexts[index];

            text.setText(`${index + 1}. ${choice.label}`);
            text.setVisible(true);
        });

        for (
            let i = choices.length;
            i < this.choiceTexts.length;
            i++
        )
        {
            this.choiceTexts[i].setVisible(false);
        }

        this.choiceHint.setVisible(true);
        this.updateChoiceHighlight();
    }

    updateChoiceHighlight()
    {
        this.choiceTexts.forEach((text, index) =>
        {
            if (!text.visible)
            {
                return;
            }

            const selected =
                index === this.selectedChoiceIndex;

            text.setStyle({
                color: selected ? '#ffffaa' : '#ffffff',
                backgroundColor: selected ? '#555555' : '#333333'
            });
        });
    }

    hideChoices()
    {
        this.isShowingChoices = false;
        this.currentChoices = [];

        this.choiceTexts.forEach(text =>
        {
            text.setVisible(false);
        });

        this.choiceHint.setVisible(false);
    }

    selectChoice(index)
    {
        const choice = this.currentChoices[index];

        if (!choice)
        {
            return;
        }

        this.hideChoices();

        if (choice.effect)
        {
            this.scene.pendingNeutralEffect = choice.effect;
        }

        if (choice.lines?.length)
        {
            this.dialogues = choice.lines;
            this.dialogIndex = 0;
            this.showCurrentDialogue();
        }
        else
        {
            this.tryFinishOrShowEffect();
        }
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

        const expression =
            dialogue.expression || 'normal';

        this.lastExpressions[speaker] = expression;

        const textureKey =
            `portrait-${speaker}-${expression}`;

        // 主角固定左边，NPC固定右边
        if (speaker === 'richele')
        {
            this.leftPortrait.setTexture(
                textureKey
            );

            this.leftPortrait.setVisible(true);
            this.leftPortrait.setAlpha(1);
            this.leftPortrait.setDepth(180);

            if (this.currentNPC)
            {
                const npcExpression =
                    this.lastExpressions[this.currentNPC]
                    || 'normal';

                this.rightPortrait.setTexture(
                    `portrait-${this.currentNPC}-${npcExpression}`
                );

                this.rightPortrait.setVisible(true);
            }

            this.rightPortrait.setAlpha(0.5);
            this.rightPortrait.setDepth(179);
        }
        else
        {
            this.rightPortrait.setTexture(
                textureKey
            );

            this.rightPortrait.setVisible(true);
            this.rightPortrait.setAlpha(1);
            this.rightPortrait.setDepth(180);

            const richeleExpression =
                this.lastExpressions.richele
                || 'normal';

            this.leftPortrait.setTexture(
                `portrait-richele-${richeleExpression}`
            );

            this.leftPortrait.setVisible(true);
            this.leftPortrait.setAlpha(0.5);
            this.leftPortrait.setDepth(179);
        }
    }


    end()
    {
        this.clearEffectTimers();
        this.hideChoices();

        this.isShowingEffect = false;
        this.effectPhase = null;
        this.isPlaying = false;

        this.box.setVisible(false);

        this.text.setVisible(false);
        this.effectImage.setVisible(false);

        // 隐藏立绘
        this.leftPortrait.setVisible(false);
        this.rightPortrait.setVisible(false);

        this.scene.onDialogueEnd();
    }
}

// import { use } from 'matter';
import * as Phaser from 'phaser';
import items from '../data/items.js';
import TypewriterText from './TypewriterText.js';
import { TYPEWRITER_OPTIONS } from '../data/typewriterConfig.js';
import {
    GAME_HEIGHT,
    PLAY_AREA_UI_CENTER_X
} from '../game/layout.js';
import {
    DIALOGUE_BOX_Y,
    DIALOGUE_BOX_CENTER_X,
    DIALOGUE_PORTRAIT_SCALE,
    DIALOGUE_LEFT_PORTRAIT_X,
    DIALOGUE_LEFT_PORTRAIT_Y,
    DIALOGUE_TEXT_X,
    DIALOGUE_TEXT_Y,
    DIALOGUE_TEXT_STYLE
} from '../data/dialoguePortraitLayout.js';
import {
    withButtonTextStyle,
    withTextPadding
} from '../data/textStyle.js';
import { bindButtonSfx } from './Sfx.js';

const DIALOG_BOX_HEIGHT = 180;

/** 对话框内文字可视高度（上下各留 20px） */
const DIALOG_MAX_TEXT_HEIGHT = DIALOG_BOX_HEIGHT - 40;

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

        this.dialogTextBaseY = DIALOGUE_TEXT_Y;

        const boxY = DIALOGUE_BOX_Y;

        // 背景
        this.box = scene.add.rectangle(
            DIALOGUE_BOX_CENTER_X,
            boxY,
            900,
            180,
            0x000000,
            0.8
        );

        this.box.setVisible(false);
        this.box.setDepth(200);
        this.box.setScrollFactor(0);
        this.box.setInteractive({ useHandCursor: true });

        this.box.on('pointerdown', () =>
        {
            this.handleDialogueBoxClick();
        });

        // 文本
        this.text = scene.add.text(
            DIALOGUE_TEXT_X,
            DIALOGUE_TEXT_Y,
            '',
            {
                ...DIALOGUE_TEXT_STYLE
            }
        );
        this.objectDialogText = scene.add.text(
            DIALOGUE_TEXT_X,
            DIALOGUE_TEXT_Y,
            '',
            {
                ...DIALOGUE_TEXT_STYLE,
                wordWrap: {
                    width: 840,
                    useAdvancedWrap: true
                },
                lineSpacing: 18
            }
        );
        this.text.setScrollFactor(0);
        this.text.setOrigin(0, 0);
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
            DIALOGUE_LEFT_PORTRAIT_X,
            DIALOGUE_LEFT_PORTRAIT_Y,
            ''
        );
        this.leftPortrait.setVisible(false);
        this.leftPortrait.setScale(DIALOGUE_PORTRAIT_SCALE);
        this.leftPortrait.setDepth(180);

        this.rightPortrait = scene.add.image(
            DIALOGUE_BOX_CENTER_X + 320,
            DIALOGUE_LEFT_PORTRAIT_Y,
            ''
        );
        this.rightPortrait.setVisible(false);
        this.rightPortrait.setScale(DIALOGUE_PORTRAIT_SCALE);
        this.rightPortrait.setDepth(180);

        this.leftPortrait.setScrollFactor(0);
        this.rightPortrait.setScrollFactor(0);

        const choiceStyle =
            withButtonTextStyle({
                fontSize: '26px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: {
                    left: 12,
                    right: 12,
                    top: 14,
                    bottom: 10
                }
            });

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
            bindButtonSfx(choiceText, scene);

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
            withTextPadding({
                fontSize: '18px',
                color: '#888888'
            })
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

        this.dialogueTypewriter =
            new TypewriterText(
                scene,
                this.text,
                {
                    ...TYPEWRITER_OPTIONS,
                    maxHeight: DIALOG_MAX_TEXT_HEIGHT
                }
            );

        this.objectTypewriter =
            new TypewriterText(
                scene,
                this.objectDialogText,
                {
                    ...TYPEWRITER_OPTIONS,
                    maxHeight: DIALOG_MAX_TEXT_HEIGHT
                }
            );
    }

    handleDialogueBoxClick()
    {
        if (this.isShowingObjectDialogue)
        {
            if (!this.objectTypewriter.isComplete)
            {
                this.objectTypewriter.skip();
            }

            return;
        }

        if (
            this.isShowingEffect
            &&
            this.effectPhase === 'message'
            &&
            !this.dialogueTypewriter.isComplete
        )
        {
            this.dialogueTypewriter.skip();
            return;
        }

        if (
            !this.isPlaying
            ||
            this.isShowingChoices
            ||
            this.isShowingEffect
        )
        {
            return;
        }

        if (!this.dialogueTypewriter.isComplete)
        {
            this.dialogueTypewriter.skip();
        }
    }

    playDialogueText(fullText)
    {
        this.dialogueTypewriter.start(fullText);
    }

    playObjectDialogText(fullText)
    {
        this.objectTypewriter.start(fullText);
    }

    showDialogBox()
    {
        this.box.setVisible(true);
    }

    hideDialogBox()
    {
        this.box.setVisible(false);
    }

    handleDialogueSpaceAdvance()
    {
        if (!this.dialogueTypewriter.isComplete)
        {
            this.dialogueTypewriter.skip();
            return;
        }

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
                if (!this.objectTypewriter.isComplete)
                {
                    this.objectTypewriter.skip();
                    return;
                }

                this.dismissObjectDialogue();
            }

            return;
        }

        // ===== 选项效果（仍在对话中）=====

        if (
            this.isShowingEffect
            &&
            this.effectPhase === 'message'
        )
        {
            if (Phaser.Input.Keyboard.JustDown(this.spaceKey))
            {
                if (!this.dialogueTypewriter.isComplete)
                {
                    this.dialogueTypewriter.skip();
                    return;
                }

                this.finishEffectAndEnd();
            }

            return;
        }

        if (this.isShowingEffect)
        {
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
            this.handleDialogueSpaceAdvance();
        }
    }

    resetDialogueTextLayout()
    {
        this.text.setOrigin(0, 0);
        this.text.setPosition(
            this.box.x - 420,
            this.dialogTextBaseY
        );
        this.objectDialogText.setPosition(
            this.box.x - 420,
            this.dialogTextBaseY
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
            this.text.setVisible(false);
            this.effectImage.setVisible(false);
            this.effectPhase = 'coffee_notice';

            this.effectTimers.push(
                this.scene.time.delayedCall(2000, () =>
                {
                    this.resetDialogueTextLayout();
                    this.playDialogueText(
                        items.azeCoffee.effectMessage
                    );
                    this.text.setVisible(true);
                    this.effectPhase = 'message';
                })
            );
        }
        else if (effect === 'clearWork')
        {
            this.effectImage.setVisible(false);
            this.resetDialogueTextLayout();
            this.playDialogueText(
                items.clearWork.effectMessage
            );
            this.text.setVisible(true);
            this.effectPhase = 'message';
        }
        else if (effect === 'giveDonutToSply')
        {
            this.text.setVisible(false);
            this.effectImage.setVisible(false);
            this.effectPhase = 'drone_notice';

            this.effectTimers.push(
                this.scene.time.delayedCall(2000, () =>
                {
                    this.resetDialogueTextLayout();
                    this.playDialogueText(
                        items.drone.effectMessage
                    );
                    this.text.setVisible(true);
                    this.effectPhase = 'message';
                })
            );
        }
        else if (effect === 'splyRefuse')
        {
            this.text.setVisible(false);
            this.effectImage.setVisible(false);
            this.effectPhase = 'sply_refuse_notice';

            this.effectTimers.push(
                this.scene.time.delayedCall(2000, () =>
                {
                    this.resetDialogueTextLayout();
                    this.playDialogueText(
                        items.splyRefuse.effectMessage
                    );
                    this.text.setVisible(true);
                    this.effectPhase = 'message';
                })
            );
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
        this.playDialogueText(current.text);
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

    dismissObjectDialogue()
    {
        if (!this.isShowingObjectDialogue)
        {
            return false;
        }

        this.hideDialogBox();
        this.objectDialogText.setVisible(false);
        this.objectTypewriter.stop();
        this.isShowingObjectDialogue = false;
        this.objectDialogCooldown = true;

        this.scene.time.delayedCall(300, () =>
        {
            this.objectDialogCooldown = false;
        });

        return true;
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

        this.resetDialogueTextLayout();
        this.showDialogBox();

        this.objectDialogText.setVisible(true);
        this.isShowingObjectDialogue = true;

        this.playObjectDialogText(wrappedText);
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

        this.dialogueTypewriter.stop();
        this.objectTypewriter.stop();

        this.isShowingEffect = false;
        this.effectPhase = null;
        this.isPlaying = false;

        this.hideDialogBox();

        this.text.setVisible(false);
        this.effectImage.setVisible(false);

        // 隐藏立绘
        this.leftPortrait.setVisible(false);
        this.rightPortrait.setVisible(false);

        this.scene.onDialogueEnd();
    }
}

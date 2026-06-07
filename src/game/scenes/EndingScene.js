import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import TypewriterText from '../../systems/TypewriterText.js';
import {
    ENDING_EPILOG_LINES,
    ENDING_EPILOG_LINE_FADE_MS,
    ENDING_EPILOG_LINE_GAP_MS,
    ENDING_SPACE_HINT,
    ENDING_WELCOME_BUTTON,
    ENDING_DIALOGUE_TEXT,
    ENDING_FADE_TO_MENU_MS,
    ENDING_FADE_BRIGHT_MS,
    ENDING_DIALOGUE_DELAY_MS,
    ENDING_BUTTON_DELAY_MS,
    ENDING_BUTTON_FADE_IN_MS,
    ENDING_LAUGH_ALT_MS,
    ENDING_BUTTON_PULSE_MS,
    ENDING_BGM_FADE_OUT_MS
} from '../../data/endingConfig.js';
import {
    INTRO_TYPEWRITER_OPTIONS
} from '../../data/typewriterConfig.js';
import {
    DIALOGUE_BOX_Y,
    DIALOGUE_BOX_CENTER_X_FULL,
    DIALOGUE_TEXT_X_FULL,
    DIALOGUE_TEXT_Y,
    DIALOGUE_TEXT_STYLE
} from '../../data/dialoguePortraitLayout.js';
import {
    withButtonTextStyle,
    withTextPadding
} from '../../data/textStyle.js';
import { bindButtonSfx, playKnockSfx } from '../../systems/Sfx.js';

const PHASE = {
    EPILOG: 'epilog',
    KNOCK: 'knock',
    WAIT_SPACE: 'waitSpace',
    CG: 'cg',
    EXITING: 'exiting'
};

export default class EndingScene extends Scene
{
    constructor()
    {
        super('EndingScene');
    }

    create()
    {
        this.phase = PHASE.EPILOG;
        this.laughTimer = null;
        this.dialogueDelayTimer = null;
        this.buttonDelayTimer = null;
        this.buttonFadeInTween = null;
        this.epilogLineGapTimer = null;
        this.laughShowingFirst = true;
        this.buttonPulseTween = null;

        this.centerX = this.scale.width / 2;
        this.centerY = this.scale.height / 2;

        this.input.enabled = true;
        this.cameras.main.setBackgroundColor('#000000');

        this.fadeOverlay =
            this.add.rectangle(
                this.centerX,
                this.centerY,
                this.scale.width,
                this.scale.height,
                0x000000,
                1
            );

        this.fadeOverlay.setScrollFactor(0);
        this.fadeOverlay.setDepth(9000);

        this.buildCgLayer();
        this.buildDialogue();
        this.buildEpilog();

        this.cgContainer.setVisible(false);
        this.cgBackground.setVisible(false);
        this.dialogueContainer.setVisible(false);

        this.spaceKey =
            this.input.keyboard?.addKey(
                Phaser.Input.Keyboard.KeyCodes.SPACE
            );

        this.startEpilogFadeIn();
    }

    buildEpilog()
    {
        const lineStyle =
            withTextPadding({
                fontSize: '28px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 820 },
                lineSpacing: 12
            });

        const lineStep = 52;
        const blockHeight =
            (ENDING_EPILOG_LINES.length - 1) * lineStep;
        const startY = this.centerY - blockHeight / 2;

        this.epilogLineTexts =
            ENDING_EPILOG_LINES.map((line, index) =>
            {
                const text =
                    this.add.text(
                        this.centerX,
                        startY + index * lineStep,
                        line,
                        lineStyle
                    );

                text.setOrigin(0.5);
                text.setScrollFactor(0);
                text.setDepth(9100);
                text.setAlpha(0);

                return text;
            });

        this.epilogClickZone =
            this.add.rectangle(
                this.centerX,
                this.centerY,
                this.scale.width,
                this.scale.height,
                0x000000,
                0
            );

        this.epilogClickZone.setScrollFactor(0);
        this.epilogClickZone.setDepth(9050);
        this.epilogClickZone.setInteractive({ useHandCursor: true });

        this.epilogClickZone.on('pointerup', () =>
        {
            this.skipEpilogLines();
        });

        this.spaceHintText =
            this.add.text(
                this.centerX,
                this.scale.height - 52,
                ENDING_SPACE_HINT,
                withTextPadding({
                    fontSize: '22px',
                    color: '#aaaaaa'
                })
            );

        this.spaceHintText.setOrigin(0.5);
        this.spaceHintText.setScrollFactor(0);
        this.spaceHintText.setDepth(9100);
        this.spaceHintText.setVisible(false);
    }

    startEpilogFadeIn(lineIndex = 0)
    {
        if (this.phase !== PHASE.EPILOG)
        {
            return;
        }

        if (lineIndex >= this.epilogLineTexts.length)
        {
            this.onEpilogComplete();
            return;
        }

        const line = this.epilogLineTexts[lineIndex];

        this.tweens.add({
            targets: line,
            alpha: 1,
            duration: ENDING_EPILOG_LINE_FADE_MS,
            ease: 'Sine.easeOut',
            onComplete: () =>
            {
                if (this.phase !== PHASE.EPILOG)
                {
                    return;
                }

                this.epilogLineGapTimer =
                    this.time.delayedCall(
                        ENDING_EPILOG_LINE_GAP_MS,
                        () =>
                        {
                            this.epilogLineGapTimer = null;
                            this.startEpilogFadeIn(lineIndex + 1);
                        }
                    );
            }
        });
    }

    stopEpilogFadeIn()
    {
        if (this.epilogLineGapTimer)
        {
            this.epilogLineGapTimer.remove();
            this.epilogLineGapTimer = null;
        }

        this.epilogLineTexts?.forEach(line =>
        {
            this.tweens.killTweensOf(line);
        });
    }

    buildCgLayer()
    {
        const vw = this.scale.width;
        const vh = this.scale.height;

        this.cgBackground =
            this.add.rectangle(
                this.centerX,
                this.centerY,
                vw,
                vh,
                0xffffff,
                1
            );

        this.cgBackground.setScrollFactor(0);
        this.cgBackground.setDepth(90);
        this.cgBackground.setVisible(false);

        this.cgContainer =
            this.add.container(this.centerX, 0);

        this.cgContainer.setScrollFactor(0);
        this.cgContainer.setDepth(100);

        this.richeleImage =
            this.add.image(0, 0, 'ending-richele');

        this.richeleImage.setOrigin(0.5, 0);

        this.laugh1Image =
            this.add.image(0, 0, 'ending-laugh1');

        this.laugh1Image.setOrigin(0.5, 0);

        this.laugh2Image =
            this.add.image(0, 0, 'ending-laugh2');

        this.laugh2Image.setOrigin(0.5, 0);
        this.laugh2Image.setVisible(false);

        this.cgContainer.add([
            this.richeleImage,
            this.laugh1Image,
            this.laugh2Image
        ]);

        this.fitContainCg();
    }

    /** 完整显示 CG，顶部对齐，不足处由白色底面填充 */
    fitContainCg()
    {
        const frame =
            this.textures.getFrame('ending-richele');

        const vw = this.scale.width;
        const vh = this.scale.height;
        const scaleX = vw / frame.width;
        const scaleY = vh / frame.height;
        const contain = Math.min(scaleX, scaleY);

        this.cgContainer.y = 0;

        this.richeleImage.setScale(contain);
        this.laugh1Image.setScale(contain);
        this.laugh2Image.setScale(contain);
    }

    buildDialogue()
    {
        this.dialogueContainer =
            this.add.container(0, 0);

        this.dialogueContainer.setScrollFactor(0);
        this.dialogueContainer.setDepth(300);

        this.dialogueBox =
            this.add.rectangle(
                DIALOGUE_BOX_CENTER_X_FULL,
                DIALOGUE_BOX_Y,
                900,
                180,
                0x000000,
                0.82
            );

        this.dialogueBox.setStrokeStyle(2, 0x666666, 0.8);

        this.dialogueText =
            this.add.text(
                DIALOGUE_TEXT_X_FULL,
                DIALOGUE_TEXT_Y,
                '',
                DIALOGUE_TEXT_STYLE
            );

        this.dialogueText.setOrigin(0, 0);

        this.welcomeButton =
            this.add.text(
                DIALOGUE_BOX_CENTER_X_FULL,
                DIALOGUE_BOX_Y + 52,
                ENDING_WELCOME_BUTTON,
                withButtonTextStyle({
                    fontSize: '28px',
                    color: '#ffffff',
                    backgroundColor: '#333333',
                    padding: {
                        left: 32,
                        right: 32,
                        top: 18,
                        bottom: 16
                    }
                })
            );

        this.welcomeButton.setOrigin(0.5);
        this.welcomeButton.setAlpha(0);
        this.welcomeButton.setVisible(false);
        this.welcomeButton.setInteractive({ useHandCursor: true });
        bindButtonSfx(this.welcomeButton, this);

        this.welcomeButton.on('pointerover', () =>
        {
            this.welcomeButton.setStyle({
                backgroundColor: '#555555'
            });
        });

        this.welcomeButton.on('pointerout', () =>
        {
            this.welcomeButton.setStyle({
                backgroundColor: '#333333'
            });
        });

        this.welcomeButton.on('pointerup', () =>
        {
            this.finishEnding();
        });

        this.dialogueTypewriter =
            new TypewriterText(
                this,
                this.dialogueText,
                INTRO_TYPEWRITER_OPTIONS
            );

        this.dialogueBox.setInteractive({ useHandCursor: true });

        this.dialogueBox.on('pointerup', () =>
        {
            this.skipDialogueTypewriter();
        });

        this.dialogueContainer.add([
            this.dialogueBox,
            this.dialogueText,
            this.welcomeButton
        ]);
    }

    onEpilogComplete()
    {
        if (this.phase !== PHASE.EPILOG)
        {
            return;
        }

        this.phase = PHASE.KNOCK;

        playKnockSfx(this, () => this.onKnockComplete());
    }

    onKnockComplete()
    {
        if (this.phase !== PHASE.KNOCK)
        {
            return;
        }

        this.phase = PHASE.WAIT_SPACE;
        this.spaceHintText.setVisible(true);
    }

    skipEpilogLines()
    {
        if (this.phase !== PHASE.EPILOG)
        {
            return;
        }

        this.stopEpilogFadeIn();

        this.epilogLineTexts.forEach(line =>
        {
            line.setAlpha(1);
        });

        this.onEpilogComplete();
    }

    skipDialogueTypewriter()
    {
        if (!this.dialogueTypewriter.isComplete)
        {
            this.dialogueTypewriter.skip();
        }
    }

    beginCgPhase()
    {
        if (this.phase !== PHASE.WAIT_SPACE)
        {
            return;
        }

        this.phase = PHASE.CG;
        this.spaceHintText.setVisible(false);
        this.epilogLineTexts.forEach(line =>
        {
            line.setVisible(false);
        });
        this.epilogClickZone.setVisible(false);

        this.cgBackground.setVisible(true);
        this.cgContainer.setVisible(true);
        this.cgContainer.setAlpha(0);
        this.cgBackground.setAlpha(0);

        this.unlockAudio();
        this.game.bgmManager?.playEndingWarm(this);

        this.tweens.add({
            targets: this.fadeOverlay,
            alpha: 0,
            duration: ENDING_FADE_BRIGHT_MS,
            ease: 'Sine.easeOut',
            onComplete: () => this.onCgRevealed()
        });

        this.tweens.add({
            targets: [this.cgContainer, this.cgBackground],
            alpha: 1,
            duration: ENDING_FADE_BRIGHT_MS,
            ease: 'Sine.easeOut'
        });
    }

    onCgRevealed()
    {
        this.startLaughAlternate();

        this.dialogueDelayTimer =
            this.time.delayedCall(
                ENDING_DIALOGUE_DELAY_MS,
                () => this.showEndingDialogue()
            );
    }

    showEndingDialogue()
    {
        this.dialogueDelayTimer = null;
        this.dialogueContainer.setVisible(true);
        this.dialogueContainer.setAlpha(0);

        this.tweens.add({
            targets: this.dialogueContainer,
            alpha: 1,
            duration: 400,
            ease: 'Sine.easeOut'
        });

        this.dialogueTypewriter.start(
            ENDING_DIALOGUE_TEXT,
            () =>
            {
                this.buttonDelayTimer =
                    this.time.delayedCall(
                        ENDING_BUTTON_DELAY_MS,
                        () => this.revealWelcomeButton()
                    );
            }
        );
    }

    revealWelcomeButton()
    {
        this.buttonDelayTimer = null;
        this.welcomeButton.setVisible(true);
        this.welcomeButton.setAlpha(0);

        this.stopButtonPulse();

        this.buttonFadeInTween =
            this.tweens.add({
                targets: this.welcomeButton,
                alpha: 1,
                duration: ENDING_BUTTON_FADE_IN_MS,
                ease: 'Sine.easeOut',
                onComplete: () =>
                {
                    this.buttonFadeInTween = null;
                    this.startButtonPulse();
                }
            });
    }

    unlockAudio()
    {
        const sound = this.game?.sound;

        if (!sound)
        {
            return;
        }

        if (typeof sound.unlock === 'function')
        {
            sound.unlock();
        }

        const context =
            sound.context ?? sound.audioContext;

        if (context?.state === 'suspended')
        {
            context.resume();
        }
    }

    startLaughAlternate()
    {
        this.stopLaughAlternate();
        this.laughShowingFirst = true;
        this.laugh1Image.setVisible(true);
        this.laugh2Image.setVisible(false);

        this.laughTimer =
            this.time.addEvent({
                delay: ENDING_LAUGH_ALT_MS,
                loop: true,
                callback: () =>
                {
                    this.laughShowingFirst =
                        !this.laughShowingFirst;

                    this.laugh1Image.setVisible(
                        this.laughShowingFirst
                    );

                    this.laugh2Image.setVisible(
                        !this.laughShowingFirst
                    );
                }
            });
    }

    stopLaughAlternate()
    {
        if (this.laughTimer)
        {
            this.laughTimer.remove();
            this.laughTimer = null;
        }
    }

    startButtonPulse()
    {
        this.stopButtonPulse();

        this.welcomeButton.setAlpha(1);

        this.buttonPulseTween =
            this.tweens.add({
                targets: this.welcomeButton,
                alpha: 0.82,
                duration: ENDING_BUTTON_PULSE_MS,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
    }

    stopButtonPulse()
    {
        if (this.buttonFadeInTween)
        {
            this.buttonFadeInTween.stop();
            this.buttonFadeInTween = null;
        }

        if (this.buttonPulseTween)
        {
            this.buttonPulseTween.stop();
            this.buttonPulseTween = null;
        }
    }

    finishEnding()
    {
        if (this.phase === PHASE.EXITING)
        {
            return;
        }

        this.phase = PHASE.EXITING;
        this.input.enabled = false;

        this.stopLaughAlternate();

        if (this.dialogueDelayTimer)
        {
            this.dialogueDelayTimer.remove();
            this.dialogueDelayTimer = null;
        }

        if (this.buttonDelayTimer)
        {
            this.buttonDelayTimer.remove();
            this.buttonDelayTimer = null;
        }

        this.stopButtonPulse();

        this.welcomeButton.setVisible(false);
        this.dialogueContainer.setAlpha(0.35);

        this.fadeToMainMenu();
    }

    fadeToMainMenu()
    {
        this.game.bgmManager?.fadeOutForTransition(
            this,
            ENDING_BGM_FADE_OUT_MS
        );

        this.tweens.add({
            targets: this.fadeOverlay,
            alpha: 1,
            duration: ENDING_FADE_TO_MENU_MS,
            ease: 'Sine.easeIn',
            onComplete: () =>
            {
                this.scene.start('MainMenuScene');
            }
        });
    }

    update()
    {
        if (
            this.phase === PHASE.EPILOG
            &&
            this.spaceKey
            &&
            Phaser.Input.Keyboard.JustDown(this.spaceKey)
        )
        {
            this.skipEpilogLines();
            return;
        }

        if (
            this.phase === PHASE.WAIT_SPACE
            &&
            this.spaceKey
            &&
            Phaser.Input.Keyboard.JustDown(this.spaceKey)
        )
        {
            this.beginCgPhase();
        }

        if (
            this.phase === PHASE.CG
            &&
            this.dialogueContainer.visible
            &&
            this.spaceKey
            &&
            Phaser.Input.Keyboard.JustDown(this.spaceKey)
        )
        {
            this.skipDialogueTypewriter();
        }
    }
}

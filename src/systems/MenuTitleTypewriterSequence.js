import TypewriterText from './TypewriterText.js';

/**
 * 主菜单标题序列：标题打字 → 副标题打字 → 副标题擦除 → 标题擦除 → 循环
 */
export default class MenuTitleTypewriterSequence
{
    constructor(scene, titleText, subtitleText, options = {})
    {
        this.scene = scene;
        this.titleText = titleText;
        this.subtitleText = subtitleText;

        this.titleFull = options.title ?? '';
        this.subtitleFull = options.subtitle ?? '';

        this.titleCharDelayMs = options.titleCharDelayMs ?? 78;
        this.subtitleCharDelayMs =
            options.subtitleCharDelayMs ?? 62;
        this.eraseMs = options.eraseMs ?? 42;

        this.afterTitleHoldMs = options.afterTitleHoldMs ?? 500;
        this.afterBothHoldMs = options.afterBothHoldMs ?? 3600;
        this.loopPauseMs = options.loopPauseMs ?? 900;

        this.titleTypewriter =
            new TypewriterText(scene, titleText, {
                charDelayMs: this.titleCharDelayMs
            });

        this.subtitleTypewriter =
            new TypewriterText(scene, subtitleText, {
                charDelayMs: this.subtitleCharDelayMs
            });

        this.active = false;
        this.loopTimer = null;
        this.eraseTimer = null;
    }

    start()
    {
        this.stop();
        this.active = true;
        this.runCycle();
    }

    runCycle()
    {
        if (!this.active)
        {
            return;
        }

        this.subtitleText.setText('');

        this.titleTypewriter.start(this.titleFull, () =>
        {
            if (!this.active)
            {
                return;
            }

            this.loopTimer =
                this.scene.time.delayedCall(
                    this.afterTitleHoldMs,
                    () => this.typeSubtitle()
                );
        });
    }

    typeSubtitle()
    {
        if (!this.active)
        {
            return;
        }

        this.subtitleTypewriter.start(
            this.subtitleFull,
            () =>
            {
                if (!this.active)
                {
                    return;
                }

                this.loopTimer =
                    this.scene.time.delayedCall(
                        this.afterBothHoldMs,
                        () => this.eraseSubtitle()
                    );
            }
        );
    }

    eraseSubtitle()
    {
        if (!this.active)
        {
            return;
        }

        this.eraseText(
            this.subtitleText,
            this.subtitleFull,
            () => this.eraseTitle()
        );
    }

    eraseTitle()
    {
        if (!this.active)
        {
            return;
        }

        this.eraseText(
            this.titleText,
            this.titleFull,
            () =>
            {
                if (!this.active)
                {
                    return;
                }

                this.loopTimer =
                    this.scene.time.delayedCall(
                        this.loopPauseMs,
                        () => this.runCycle()
                    );
            }
        );
    }

    eraseText(textObject, fullText, onDone)
    {
        let index = fullText.length;

        const step = () =>
        {
            if (!this.active)
            {
                return;
            }

            index -= 1;

            if (index < 0)
            {
                textObject.setText('');
                onDone?.();
                return;
            }

            textObject.setText(
                fullText.slice(0, index)
            );

            this.eraseTimer =
                this.scene.time.delayedCall(
                    this.eraseMs,
                    step
                );
        };

        step();
    }

    stop()
    {
        this.active = false;
        this.titleTypewriter.stop();
        this.subtitleTypewriter.stop();
        this.clearTimers();
        this.titleText.setText('');
        this.subtitleText.setText('');
    }

    clearTimers()
    {
        if (this.loopTimer)
        {
            this.loopTimer.remove(false);
            this.loopTimer = null;
        }

        if (this.eraseTimer)
        {
            this.eraseTimer.remove(false);
            this.eraseTimer = null;
        }
    }
}

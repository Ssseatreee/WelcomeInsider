/** 标点处额外停顿倍数 */
const PAUSE_AFTER = {
    '\n': 5,
    '。': 4,
    '！': 4,
    '？': 4,
    '…': 4,
    '；': 3,
    '，': 2,
    '、': 2
};

/**
 * 逐字显示 Phaser Text 内容
 */
export default class TypewriterText
{
    constructor(scene, textObject, options = {})
    {
        this.scene = scene;
        this.text = textObject;
        this.charDelayMs = options.charDelayMs ?? 36;
        this.fullText = '';
        this.displayIndex = 0;
        this.timer = null;
        this.isComplete = false;
        this.onComplete = null;
    }

    start(fullText, onComplete)
    {
        this.stop();

        this.fullText = fullText ?? '';
        this.displayIndex = 0;
        this.isComplete = this.fullText.length === 0;
        this.onComplete = onComplete ?? null;

        if (this.isComplete)
        {
            this.text.setText('');
            this.onComplete?.();
            return;
        }

        this.text.setText('');
        this.scheduleNextChar();
    }

    delayForChar(char)
    {
        const multiplier = PAUSE_AFTER[char] ?? 1;

        return this.charDelayMs * multiplier;
    }

    scheduleNextChar()
    {
        if (this.displayIndex >= this.fullText.length)
        {
            this.finish();
            return;
        }

        const prevChar =
            this.fullText[this.displayIndex - 1];

        const delay =
            this.displayIndex === 0
                ? 0
                : this.delayForChar(prevChar);

        this.timer =
            this.scene.time.delayedCall(
                delay,
                () =>
                {
                    this.timer = null;
                    this.displayIndex += 1;
                    this.text.setText(
                        this.fullText.slice(0, this.displayIndex)
                    );
                    this.scheduleNextChar();
                }
            );
    }

    finish()
    {
        this.clearTimer();
        this.text.setText(this.fullText);
        this.isComplete = true;

        const callback = this.onComplete;

        this.onComplete = null;
        callback?.();
    }

    /** 立刻显示全文；若尚未完成则返回 true */
    skip()
    {
        if (this.isComplete)
        {
            return false;
        }

        this.finish();
        return true;
    }

    stop()
    {
        this.clearTimer();
        this.fullText = '';
        this.displayIndex = 0;
        this.isComplete = false;
        this.onComplete = null;
    }

    clearTimer()
    {
        if (this.timer)
        {
            this.timer.remove(false);
            this.timer = null;
        }
    }
}

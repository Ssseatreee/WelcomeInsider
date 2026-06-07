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
 * 逐字显示 Phaser Text 内容；超出 maxHeight 时清屏并从当前位置继续
 */
export default class TypewriterText
{
    constructor(scene, textObject, options = {})
    {
        this.scene = scene;
        this.text = textObject;
        this.charDelayMs = options.charDelayMs ?? 36;
        this.maxHeight = options.maxHeight ?? null;
        this.fullText = '';
        this.displayIndex = 0;
        this.pageStartIndex = 0;
        this.timer = null;
        this.isComplete = false;
        this.onComplete = null;
        this.onTextChange = options.onTextChange ?? null;
    }

    start(fullText, onComplete)
    {
        this.stop();

        this.fullText = fullText ?? '';
        this.displayIndex = 0;
        this.pageStartIndex = 0;
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

    measureSliceHeight(start, end)
    {
        this.text.setText(this.fullText.slice(start, end));

        return this.text.height;
    }

    /** 找到 endIndex 处能完整显示在 maxHeight 内的最早起始下标 */
    findPageStartForEnd(endIndex)
    {
        if (!this.maxHeight || endIndex <= 0)
        {
            return 0;
        }

        if (
            this.measureSliceHeight(0, endIndex)
            <= this.maxHeight
        )
        {
            return 0;
        }

        let low = 0;
        let high = endIndex - 1;
        let best = high;

        while (low <= high)
        {
            const mid = (low + high) >> 1;

            if (
                this.measureSliceHeight(mid, endIndex)
                <= this.maxHeight
            )
            {
                best = mid;
                high = mid - 1;
            }
            else
            {
                low = mid + 1;
            }
        }

        const searchEnd = Math.min(best + 24, endIndex);

        for (let i = best; i < searchEnd; i++)
        {
            if (this.fullText[i] === '\n')
            {
                const candidate = i + 1;

                if (
                    this.measureSliceHeight(
                        candidate,
                        endIndex
                    )
                    <= this.maxHeight
                )
                {
                    return candidate;
                }
            }
        }

        return best;
    }

    refreshDisplay()
    {
        this.pageStartIndex =
            this.findPageStartForEnd(this.displayIndex);

        this.text.setText(
            this.fullText.slice(
                this.pageStartIndex,
                this.displayIndex
            )
        );

        this.onTextChange?.();
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
                    this.refreshDisplay();
                    this.scheduleNextChar();
                }
            );
    }

    finish()
    {
        this.clearTimer();
        this.displayIndex = this.fullText.length;
        this.refreshDisplay();
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
        this.pageStartIndex = 0;
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

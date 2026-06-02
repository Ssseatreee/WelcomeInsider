import * as Phaser from 'phaser';

export const CURTAIN_ENTER_KEY = '_curtainEnter';
export const CURTAIN_TURN_KEY = '_curtainTurnKey';

const TURN_TEXTURE_KEYS = [
    'turn-1',
    'turn-2',
    'turn-3',
    'turn-4',
    'turn-5'
];

const CURTAIN_COLOR = 0x383838;
const CURTAIN_DEPTH = 10000;
const TURN_DECOR_MAX_SIZE = 400;
const FALL_MS = 480;
const HOLD_MS = 1000;
const RISE_MS = 480;

function getSceneSize(scene)
{
    return {
        w: scene.scale.width,
        h: scene.scale.height
    };
}

export function readCurtainEnter(data)
{
    return Boolean(data?.[CURTAIN_ENTER_KEY]);
}

export function readCurtainTurnKey(data)
{
    const key = data?.[CURTAIN_TURN_KEY];

    if (key && TURN_TEXTURE_KEYS.includes(key))
    {
        return key;
    }

    return null;
}

function pickRandomTurnKey(scene)
{
    const available =
        TURN_TEXTURE_KEYS.filter(key =>
            scene.textures.exists(key)
        );

    if (!available.length)
    {
        return null;
    }

    return Phaser.Utils.Array.GetRandom(available);
}

function fitTurnDecor(image, maxSize = TURN_DECOR_MAX_SIZE)
{
    const scale =
        Math.min(
            maxSize / image.width,
            maxSize / image.height,
            1
        );

    image.setScale(scale);
}

function ignoreOnCameras(object, cameras, except)
{
    for (const cam of cameras)
    {
        if (cam !== except)
        {
            cam.ignore(object);
        }
    }
}

/**
 * 多相机场景：每块 viewport 各放一条幕布，避免额外 overlay 相机
 * （销毁 overlay 相机会导致 Phaser 输入 hitTest 报 cameraMatrix null）
 */
function attachCurtain(scene, startY, turnKey = null)
{
    const { w, h } = getSceneSize(scene);
    const cameras = scene.cameras.cameras;
    const curtains = [];
    const decor = [];
    const resolvedTurnKey =
        turnKey ?? pickRandomTurnKey(scene);

    if (cameras.length > 1)
    {
        const decorCamera =
            scene.cameras.main ?? cameras[0];

        for (const cam of cameras)
        {
            const rect =
                scene.add.rectangle(
                    cam.width / 2,
                    startY,
                    cam.width,
                    h,
                    CURTAIN_COLOR,
                    1
                )
                .setScrollFactor(0)
                .setDepth(CURTAIN_DEPTH);

            ignoreOnCameras(rect, cameras, cam);
            curtains.push(rect);
        }

        if (resolvedTurnKey)
        {
            const image =
                scene.add.image(
                    decorCamera.width / 2,
                    startY,
                    resolvedTurnKey
                )
                .setScrollFactor(0)
                .setDepth(CURTAIN_DEPTH + 1);

            fitTurnDecor(image);
            ignoreOnCameras(image, cameras, decorCamera);
            decor.push(image);
        }
    }
    else
    {
        curtains.push(
            scene.add.rectangle(
                w / 2,
                startY,
                w,
                h,
                CURTAIN_COLOR,
                1
            )
            .setScrollFactor(0)
            .setDepth(CURTAIN_DEPTH)
        );

        if (resolvedTurnKey)
        {
            const image =
                scene.add.image(
                    w / 2,
                    startY,
                    resolvedTurnKey
                )
                .setScrollFactor(0)
                .setDepth(CURTAIN_DEPTH + 1);

            fitTurnDecor(image);
            decor.push(image);
        }
    }

    return { curtains, decor };
}

function destroyCurtain(handle)
{
    handle.curtains.forEach(curtain => curtain.destroy());
    handle.decor.forEach(item => item.destroy());
}

function tweenCurtains(scene, handle, targetY, duration, ease, onComplete)
{
    const targets = [
        ...handle.curtains,
        ...handle.decor
    ];

    scene.tweens.add({
        targets,
        y: targetY,
        duration,
        ease,
        onComplete
    });
}

/**
 * 进入场景开头：若由幕布切入，先盖住屏幕（重场景在 create 末尾再调用 finishEnterCurtain）
 */
export function beginEnterCurtain(
    scene,
    { disableInput = true } = {}
)
{
    if (!scene.curtainEnter)
    {
        return null;
    }

    if (disableInput)
    {
        scene.input.enabled = false;
    }

    const { h } = getSceneSize(scene);

    return attachCurtain(
        scene,
        h / 2,
        scene.curtainTurnKey
    );
}

/** create 完成后升起幕布 */
export function finishEnterCurtain(scene, handle)
{
    if (!handle)
    {
        return;
    }

    const { h } = getSceneSize(scene);

    tweenCurtains(
        scene,
        handle,
        -h / 2,
        RISE_MS,
        'Power2.Out',
        () =>
        {
            destroyCurtain(handle);
            scene.input.enabled = true;
        }
    );
}

/**
 * 轻量场景：create 末尾一次性播放升起（create 很快，无需 begin）
 */
export function playEnterIfNeeded(scene)
{
    if (!scene.curtainEnter)
    {
        return;
    }

    const handle =
        beginEnterCurtain(scene, {
            disableInput: false
        });

    finishEnterCurtain(scene, handle);
}

/**
 * 幕布落下 → 停顿 → 切换场景（目标场景 init 需 readCurtainEnter）
 */
export function transitionToScene(
    scene,
    targetKey,
    data = {}
)
{
    if (scene._curtainTransitioning)
    {
        return;
    }

    scene._curtainTransitioning = true;

    if (scene.input)
    {
        scene.input.enabled = false;
    }

    const { h } = getSceneSize(scene);
    const turnKey = pickRandomTurnKey(scene);
    const handle =
        attachCurtain(scene, -h / 2, turnKey);

    tweenCurtains(
        scene,
        handle,
        h / 2,
        FALL_MS,
        'Power2.In',
        () =>
        {
            const timer =
                scene.time?.delayedCall(
                    HOLD_MS,
                    () =>
                    {
                        scene.scene.start(targetKey, {
                            ...data,
                            [CURTAIN_ENTER_KEY]: true,
                            [CURTAIN_TURN_KEY]: turnKey
                        });
                    }
                );

            if (!timer)
            {
                scene._curtainTransitioning = false;

                if (scene.input)
                {
                    scene.input.enabled = true;
                }
            }
        }
    );
}

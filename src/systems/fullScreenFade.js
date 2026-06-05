const FADE_DEPTH = 12000;

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

function createFadeRect(scene, x, y, w, h)
{
    return scene.add
        .rectangle(x, y, w, h, 0x000000, 1)
        .setScrollFactor(0)
        .setDepth(FADE_DEPTH)
        .setAlpha(0);
}

/**
 * 多相机场景全屏渐黑（每块 viewport 一条矩形）
 */
export function fadeSceneToBlack(
    scene,
    {
        durationMs = 1200,
        onComplete = null
    } = {}
)
{
    const h = scene.scale.height;
    const cameras = scene.cameras.cameras;
    const overlays = [];

    if (cameras.length > 1)
    {
        for (const cam of cameras)
        {
            const rect =
                createFadeRect(
                    scene,
                    cam.width / 2,
                    h / 2,
                    cam.width,
                    h
                );

            ignoreOnCameras(rect, cameras, cam);
            overlays.push(rect);
        }
    }
    else
    {
        const w = scene.scale.width;

        overlays.push(
            createFadeRect(
                scene,
                w / 2,
                h / 2,
                w,
                h
            )
        );
    }

    scene.tweens.add({
        targets: overlays,
        alpha: 1,
        duration: durationMs,
        ease: 'Sine.easeIn',
        onComplete: () => onComplete?.()
    });

    return overlays;
}

/**
 * 从 Tiled 地图缓存读取 objects 层里 work=true 的矩形工位。
 */
import * as Phaser from 'phaser';
export function getWorkZonesFromMap(scene, mapKey)
{
    const mapData =
        scene.cache.tilemap.get(mapKey);

    if (!mapData?.data?.layers)
    {
        return [];
    }

    const objectsLayer =
        mapData.data.layers.find(
            layer =>
                layer.name === 'objects'
                &&
                Array.isArray(layer.objects)
        );

    if (!objectsLayer)
    {
        return [];
    }

    return objectsLayer.objects.filter(obj =>
        obj.properties?.some(
            prop =>
                prop.name === 'work'
                &&
                (
                    prop.value === true
                    ||
                    prop.value === 'true'
                )
        )
    );
}

export function isPointInWorkZones(x, y, zones)
{
    return zones.some(zone =>
        x >= zone.x
        &&
        x <= zone.x + zone.width
        &&
        y >= zone.y
        &&
        y <= zone.y + zone.height
    );
}

export function boundsOverlapWorkZones(bounds, zones)
{
    if (!bounds || !zones.length)
    {
        return false;
    }

    const playerRect =
        new Phaser.Geom.Rectangle(
            bounds.x,
            bounds.y,
            bounds.width,
            bounds.height
        );

    return zones.some(zone =>
    {
        const zoneRect =
            new Phaser.Geom.Rectangle(
                zone.x,
                zone.y,
                zone.width,
                zone.height
            );

        return Phaser.Geom.Rectangle.Overlaps(
            playerRect,
            zoneRect
        );
    });
}

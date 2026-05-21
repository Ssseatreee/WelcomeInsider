// src/systems/MapManager.js
import * as Phaser from 'phaser';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMapKey = null;
        this.map = null;
        this.layers = {};
        this.portals = [];
        this.objects = [];
        this.wallLayer = null;
        this.topLayer = [];

        this.tileBodies = [];
    }

    loadMap(mapKey) {
        // 防止重复加载
        if (this.currentMapKey === mapKey) return;

        // 清理旧地图
        this.clearCurrentMap();

        this.currentMapKey = mapKey;

        // 创建 tilemap
        this.map = this.scene.make.tilemap({ key: mapKey });

        // 加载所有 tilesets
        const tilesets = [];
        this.map.tilesets.forEach(ts => {
            // 假设 preload key 和 tileset name 一致
            const tileset = this.map.addTilesetImage(ts.name, ts.name);
            tilesets.push(tileset);
        });

        // 计算偏移
        this.offsetX = (this.scene.scale.width - this.map.widthInPixels) / 2;
        this.offsetY = (this.scene.scale.height - this.map.heightInPixels) / 2;

        // 遍历 tilemap 中所有图层
        this.map.layers.forEach(layerData => {
            // if(layerData.type!=='tilelayer')
            //     return;

            const name = layerData.name;
            // 使用第一个 tileset 创建图层
            const layer = this.map.createLayer(name, tilesets, this.offsetX, this.offsetY);

            // 自动保存到 this.layers，key = layer name
            this.layers[name] = layer;

            // ===== 转换前记录 world bodies =====
            const beforeBodies =
                Phaser.Physics.Matter.Matter.Composite.allBodies(
                    this.scene.matter.world.localWorld
                );

            // ===== Tilemap -> Matter =====
            layer.setCollisionByProperty({
                collides: true
            });

            this.scene.matter.world.convertTilemapLayer(
                layer
            );

            // ===== 转换后记录新增 bodies =====
            const afterBodies =
                Phaser.Physics.Matter.Matter.Composite.allBodies(
                    this.scene.matter.world.localWorld
                );

            // 新增的 body 就是 tilemap body
            const newBodies =
                afterBodies.filter(
                    body => !beforeBodies.includes(body)
                );

            // 保存
            this.tileBodies.push(...newBodies);
            // );

            // top层记录
            // 初始化 topLayer 数组
            if (!this.topLayer) this.topLayer = [];

            // 所有以 top 开头的图层都加入 topLayer
            if (/^top\d*$/.test(name)) {
                this.topLayer.push(layer);
            }
            // if (name === 'Walls') this.wallLayer = layer;
        });


        // 读取对象层
        this.portals = this.getObjectLayer('portals')?.objects || [];
        this.objects = this.getObjectLayer('objects')?.objects || [];

        // 平移所有对象层的对象
        this.portals.forEach(obj => {
            obj.x += this.offsetX;
            obj.y += this.offsetY;
        });
        this.objects.forEach(obj => {
            obj.x += this.offsetX;
            obj.y += this.offsetY;
        });

        console.log(`Loaded map: ${mapKey}`);
        console.log('objects:', this.objects);
    }

    clearCurrentMap()
    {    
        // ===== 删除 tilemap Matter bodies =====
        this.tileBodies.forEach(body => {

            Phaser.Physics.Matter.Matter.Composite.remove(
                this.scene.matter.world.localWorld,
                body
            );

        });

        this.tileBodies = [];
        // ===== 删除 Tilemap Layer =====
        Object.values(this.layers).forEach(layer => {

            if (!layer)
            {
                return;
            }

            // ===== 移除 Matter Tilemap 碰撞 =====
            // this.scene.matter.world.removeTilemapLayer(
            //     layer
            // );
                    
            // console.log(layer);
            // ===== 删除 Tilemap Matter Bodies =====
            if (layer.body)
            {
                Phaser.Physics.Matter.Matter.Composite.remove(
                    this.scene.matter.world.localWorld,
                    layer.body
                );
            }

            // ===== 销毁图层 =====
            layer.destroy();

        });

        // ===== 销毁 Tilemap =====
        if (this.map)
        {
            this.map.destroy();

            this.map = null;
        }

        // ===== 重置引用 =====
        this.layers = {};

        this.portals = [];

        this.objects = [];

        this.wallLayer = null;

        this.topLayer = null;

        this.currentMapKey = null;
    }

    getObjectLayer(layerName) {
        if (!this.map) return null;
        return this.map.getObjectLayer(layerName);
    }

    getMapWidth() {
        return this.map ? this.map.widthInPixels : 0;
    }

    getMapHeight() {
        return this.map ? this.map.heightInPixels : 0;
    }
}
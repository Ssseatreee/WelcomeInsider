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
        this.topLayer = null;
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
            const name = layerData.name;
            // 使用第一个 tileset 创建图层
            const layer = this.map.createLayer(name, tilesets, this.offsetX, this.offsetY);

            // 自动保存到 this.layers，key = layer name
            this.layers[name] = layer;

            // Matter Physics：将 tilemap layer 的 collides=true tile 转为 Matter 碰撞体
            layer.setCollisionByProperty({ collides: true });
            this.scene.matter.world.convertTilemapLayer(layer);

            // top层记录
            if (name === 'top') this.topLayer = layer;
            // if (name === 'Walls') this.wallLayer = layer;
        });
        
        // 平移所有 tilemap body


        // 读取对象层
        this.portals = this.getObjectLayer('portals')?.objects || [];
        this.objects = this.getObjectLayer('objects')?.objects || [];

        console.log(`Loaded map: ${mapKey}`);
    }

    clearCurrentMap() {
        // 销毁所有图层
        Object.values(this.layers).forEach(layer => {
            if (layer) layer.destroy();
        });
        this.layers = {};
        this.map = null;
        this.portals = [];
        this.objects = [];
        this.wallLayer = null;
        this.topLayer = null;
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
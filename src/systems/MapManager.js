// src/systems/MapManager.js
import * as Phaser from 'phaser';

export default class MapManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMapKey = null;
        this.map = null;
        this.layers = {};
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

        // 遍历 tilemap 中所有图层
        this.map.layers.forEach(layerData => {
            const name = layerData.name;
            // 使用第一个 tileset 创建图层
            const layer = this.map.createLayer(name, tilesets, 0, 0);

            // 自动保存到 this.layers，key = layer name
            this.layers[name] = layer;

            // 设置碰撞逻辑
            // if (layerData.properties) {
            //     const collidesProp = layerData.properties.find(p => p.name === 'collides' && p.type === 'bool');
            //     if (collidesProp && collidesProp.value === true) {
            //         layer.setCollisionByProperty({ collides: true });
            //         // 玩家与墙体碰撞
            //         if (this.scene.player) {
            //             this.scene.physics.add.collider(this.scene.player, layer);
            //         }
            //         // NPC也和墙碰撞
            //         if (this.scene.npc) {
            //             this.scene.physics.add.collider(this.scene.npc, layer);
            //         }
            //     }
            // }
        });

        // // 摄像机和世界边界
        // this.scene.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        // this.scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // if (this.scene.player) this.scene.player.setCollideWorldBounds(true);

        console.log(`Loaded map: ${mapKey}`);
    }

    clearCurrentMap() {
        // 销毁所有图层
        Object.values(this.layers).forEach(layer => {
            if (layer) layer.destroy();
        });
        this.layers = {};
        this.map = null;
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
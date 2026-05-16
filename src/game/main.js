import { Boot } from './scenes/Boot';
import CollectionScene from './scenes/CollectionScene';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import LevelScene from './scenes/LevelScene';
import { MainMenu } from './scenes/MainMenu';
import MainMenuScene from './scenes/MainMenuScene';
import { Preloader } from './scenes/Preloader';
import { AUTO, Game, Physics, Scale } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },  
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        GameOver,

        MainMenuScene,
        CollectionScene,

        LevelScene
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;

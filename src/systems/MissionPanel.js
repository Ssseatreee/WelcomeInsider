import workBacklogConfig from '../data/workBacklogConfig.js';
import {
    HUD_WIDTH
} from '../game/layout.js';

export default class MissionPanel
{
    constructor(scene, objectives, mission)
    {
        this.scene = scene;
        this.objectives = objectives;
        this.mission = mission;

        const {
            panelWidth,
            panelOffsetLeft = 32,
            panelOffsetTop = 100,
            missionPanel = {}
        } = workBacklogConfig;

        const missionHeight = missionPanel.height ?? 86;
        const missionGap = missionPanel.gap ?? 10;

        const panelLeft =
            panelOffsetLeft
            ?? Math.max(
                8,
                (HUD_WIDTH - panelWidth) / 2
            );

        const panelTop =
            panelOffsetTop - missionGap - missionHeight;

        this.container =
            scene.add.container(0, 0);

        this.container.setScrollFactor(0);
        this.container.setDepth(605);

        const bgCenterY =
            panelTop + missionHeight / 2;

        const bg =
            scene.add.rectangle(
                panelLeft + panelWidth / 2,
                bgCenterY,
                panelWidth,
                missionHeight,
                0x111111,
                0.95
            );

        bg.setStrokeStyle(1, 0x444444);
        bg.setScrollFactor(0);
        this.container.add(bg);

        this.titleText =
            scene.add.text(
                panelLeft + panelWidth / 2,
                panelTop + 14,
                mission?.title ?? '任务',
                {
                    fontSize: '20px',
                    color: '#ffffff'
                }
            );

        this.titleText.setOrigin(0.5, 0);
        this.titleText.setScrollFactor(0);
        this.container.add(this.titleText);

        this.listText =
            scene.add.text(
                panelLeft + 16,
                panelTop + 40,
                '',
                {
                    fontSize: '16px',
                    color: '#cccccc',
                    lineSpacing: 6
                }
            );

        this.listText.setScrollFactor(0);
        this.container.add(this.listText);

        this.completeText =
            scene.add.text(
                panelLeft + panelWidth / 2,
                panelTop + missionHeight - 18,
                '',
                {
                    fontSize: '16px',
                    color: '#aaffaa'
                }
            );

        this.completeText.setOrigin(0.5, 1);
        this.completeText.setScrollFactor(0);
        this.completeText.setVisible(false);
        this.container.add(this.completeText);

        this.refresh();
    }

    refresh(survivalMs = 0)
    {
        const lines =
            this.objectives.getDisplayItems(survivalMs).map(item =>
                `${item.done ? '✓' : '○'} ${item.label}`
            );

        this.listText.setText(
            lines.join('\n') || '（暂无任务）'
        );
    }

    showComplete()
    {
        this.completeText.setText('任务完成！');
        this.completeText.setVisible(true);
    }
}

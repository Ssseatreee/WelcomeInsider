import GameState from './GameState.js';

export default class LevelObjectives
{
    constructor(mission)
    {
        this.mission = mission;
        this.objectives = mission?.objectives ?? [];
        this.mode = mission?.mode ?? 'all';
        this.completed = new Set();
    }

    needsSurvivalTimer()
    {
        return this.objectives.some(objective =>
            objective.type === 'surviveTime'
            ||
            objective.type === 'surviveDisplay'
        );
    }

    hasIncompleteSurviveTime()
    {
        return this.objectives.some(objective =>
            objective.type === 'surviveTime'
            &&
            !this.completed.has(objective.id)
        );
    }

    syncFromGameState()
    {
        for (const objective of this.objectives)
        {
            if (this.isObjectiveAlreadyDone(objective))
            {
                this.completed.add(objective.id);
            }
        }
    }

    isObjectiveAlreadyDone(objective)
    {
        if (objective.type === 'collectItem')
        {
            return GameState.hasCollectedItem(
                objective.itemId
            );
        }

        if (objective.type === 'setFlag')
        {
            return GameState.getFlag(objective.flag);
        }

        return false;
    }

    matches(objective, event)
    {
        if (objective.type !== event.type)
        {
            return false;
        }

        switch (objective.type)
        {
            case 'talkNpc':
                return objective.npc === event.npc;

            case 'visitMap':
                return objective.mapKey === event.mapKey;

            case 'collectItem':
                return objective.itemId === event.itemId;

            case 'setFlag':
                return objective.flag === event.flag;

            case 'surviveTime':
                return objective.id === event.objectiveId;

            default:
                return false;
        }
    }

    checkSurvivalTime(elapsedMs)
    {
        let changed = false;

        for (const objective of this.objectives)
        {
            if (objective.type !== 'surviveTime')
            {
                continue;
            }

            if (this.completed.has(objective.id))
            {
                continue;
            }

            if (elapsedMs >= objective.durationMs)
            {
                this.completed.add(objective.id);
                changed = true;
            }
        }

        return changed;
    }

    onEvent(event)
    {
        if (!this.objectives.length)
        {
            return false;
        }

        let changed = false;

        for (const objective of this.objectives)
        {
            if (this.completed.has(objective.id))
            {
                continue;
            }

            if (this.matches(objective, event))
            {
                this.completed.add(objective.id);
                changed = true;
            }
        }

        return changed;
    }

    isComplete()
    {
        if (this.mission?.passOnCatch)
        {
            return false;
        }

        const completable =
            this.objectives.filter(objective =>
                objective.type !== 'surviveDisplay'
            );

        if (!completable.length)
        {
            return false;
        }

        if (this.mode === 'any')
        {
            return completable.some(objective =>
                this.completed.has(objective.id)
            );
        }

        return completable.every(objective =>
            this.completed.has(objective.id)
        );
    }

    getDisplayItems(survivalMs = 0)
    {
        const elapsedSec =
            Math.floor(survivalMs / 1000);

        return this.objectives.map(objective =>
        {
            if (objective.type === 'surviveTime')
            {
                const targetSec =
                    Math.floor(objective.durationMs / 1000);

                const done =
                    this.completed.has(objective.id);

                return {
                    id: objective.id,
                    label: done
                        ? objective.label
                        : `${objective.label} (${elapsedSec}/${targetSec}s)`,
                    done
                };
            }

            if (objective.type === 'surviveDisplay')
            {
                return {
                    id: objective.id,
                    label: `${objective.label} (${elapsedSec}s)`,
                    done: false
                };
            }

            return {
                id: objective.id,
                label: objective.label,
                done: this.completed.has(objective.id)
            };
        });
    }
}

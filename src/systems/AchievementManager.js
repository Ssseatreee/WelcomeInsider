import achievements, {
    getAchievementById
} from '../data/achievements.js';

const STORAGE_KEY = 'welcome-insider-achievements';

const AchievementManager = {

    unlocked: new Set(),

    load()
    {
        this.unlocked = new Set();

        try
        {
            const raw =
                localStorage.getItem(STORAGE_KEY);

            if (!raw)
            {
                return;
            }

            const parsed = JSON.parse(raw);

            if (!Array.isArray(parsed))
            {
                return;
            }

            parsed.forEach(id =>
            {
                if (getAchievementById(id))
                {
                    this.unlocked.add(id);
                }
            });
        }
        catch
        {
            this.unlocked = new Set();
        }
    },

    save()
    {
        try
        {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify([...this.unlocked])
            );
        }
        catch
        {
            // ignore
        }
    },

    has(id)
    {
        return this.unlocked.has(id);
    },

    /** @returns {boolean} 是否为新解锁 */
    unlock(id)
    {
        if (
            !getAchievementById(id)
            ||
            this.unlocked.has(id)
        )
        {
            return false;
        }

        this.unlocked.add(id);
        this.save();

        return true;
    },

    getUnlockedList()
    {
        return achievements.filter(
            achievement =>
                this.unlocked.has(achievement.id)
        );
    },

    getAll()
    {
        return achievements;
    }
};

export default AchievementManager;

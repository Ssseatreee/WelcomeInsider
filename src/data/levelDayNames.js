const LEVEL_DAY_NAMES = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday'
};

export function getLevelDayName(level)
{
    return LEVEL_DAY_NAMES[level] ?? `Level ${level}`;
}

export default class Pathfinder
{
    static find(grid, startTx, startTy, endTx, endTy)
    {
        const start = grid.findNearestWalkable(startTx, startTy);
        const end = grid.findNearestWalkable(endTx, endTy);

        if (!start || !end)
        {
            return null;
        }

        if (start.tx === end.tx && start.ty === end.ty)
        {
            return [
                grid.tileToWorld(end.tx, end.ty)
            ];
        }

        const open = [];
        const closed = new Set();
        const cameFrom = new Map();
        const gScore = new Map();

        const startKey = grid.key(start.tx, start.ty);
        const endKey = grid.key(end.tx, end.ty);

        gScore.set(startKey, 0);

        open.push({
            tx: start.tx,
            ty: start.ty,
            f: Pathfinder.heuristic(start.tx, start.ty, end.tx, end.ty)
        });

        const dirs = [
            { tx: 1, ty: 0 },
            { tx: -1, ty: 0 },
            { tx: 0, ty: 1 },
            { tx: 0, ty: -1 }
        ];

        while (open.length > 0)
        {
            open.sort((a, b) => a.f - b.f);

            const current = open.shift();
            const currentKey = grid.key(current.tx, current.ty);

            if (currentKey === endKey)
            {
                return Pathfinder.reconstruct(
                    grid,
                    cameFrom,
                    current.tx,
                    current.ty
                );
            }

            closed.add(currentKey);

            for (const dir of dirs)
            {
                const nx = current.tx + dir.tx;
                const ny = current.ty + dir.ty;

                if (!grid.isWalkable(nx, ny))
                {
                    continue;
                }

                const neighborKey = grid.key(nx, ny);

                if (closed.has(neighborKey))
                {
                    continue;
                }

                const tentativeG =
                    (gScore.get(currentKey) || 0) + 1;

                if (
                    tentativeG >= (gScore.get(neighborKey) ?? Infinity)
                )
                {
                    continue;
                }

                cameFrom.set(neighborKey, currentKey);
                gScore.set(neighborKey, tentativeG);

                const f =
                    tentativeG
                    + Pathfinder.heuristic(
                        nx,
                        ny,
                        end.tx,
                        end.ty
                    );

                const existing =
                    open.find(
                        node =>
                            node.tx === nx
                            && node.ty === ny
                    );

                if (existing)
                {
                    existing.f = f;
                }
                else
                {
                    open.push({ tx: nx, ty: ny, f });
                }
            }
        }

        return null;
    }

    static heuristic(tx, ty, endTx, endTy)
    {
        return Math.abs(tx - endTx) + Math.abs(ty - endTy);
    }

    static reconstruct(grid, cameFrom, endTx, endTy)
    {
        const path = [];
        let currentKey = grid.key(endTx, endTy);

        while (cameFrom.has(currentKey))
        {
            const [tx, ty] = grid.parseKey(currentKey);

            path.unshift(
                grid.tileToWorld(tx, ty)
            );

            currentKey = cameFrom.get(currentKey);
        }

        const [startTx, startTy] = grid.parseKey(currentKey);

        path.unshift(
            grid.tileToWorld(startTx, startTy)
        );

        return Pathfinder.simplify(path);
    }

    static simplify(path)
    {
        if (path.length <= 2)
        {
            return path;
        }

        const result = [path[0]];

        for (let i = 1; i < path.length - 1; i++)
        {
            const prev = path[i - 1];
            const curr = path[i];
            const next = path[i + 1];

            const dx1 = curr.x - prev.x;
            const dy1 = curr.y - prev.y;
            const dx2 = next.x - curr.x;
            const dy2 = next.y - curr.y;

            if (dx1 !== dx2 || dy1 !== dy2)
            {
                result.push(curr);
            }
        }

        result.push(path[path.length - 1]);

        return result;
    }
}

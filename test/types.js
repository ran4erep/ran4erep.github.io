export var TileType;
(function (TileType) {
    TileType[TileType["FLOOR"] = 0] = "FLOOR";
    TileType[TileType["WALL"] = 1] = "WALL";
})(TileType || (TileType = {}));
export var Visibility;
(function (Visibility) {
    Visibility[Visibility["HIDDEN"] = 0] = "HIDDEN";
    Visibility[Visibility["EXPLORED"] = 1] = "EXPLORED";
    Visibility[Visibility["VISIBLE"] = 2] = "VISIBLE";
})(Visibility || (Visibility = {}));
export var EnemyState;
(function (EnemyState) {
    EnemyState[EnemyState["PATROLLING"] = 0] = "PATROLLING";
    EnemyState[EnemyState["HUNTING"] = 1] = "HUNTING";
    EnemyState[EnemyState["SEARCHING"] = 2] = "SEARCHING";
})(EnemyState || (EnemyState = {}));

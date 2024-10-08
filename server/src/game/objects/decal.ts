import { MapObjectDefs } from "../../../../shared/defs/mapObjectDefs";
import type { DecalDef } from "../../../../shared/defs/mapObjectsTyping";
import { ObjectType } from "../../../../shared/net/objectSerializeFns";
import type { AABB, Circle } from "../../../../shared/utils/coldet";
import { collider } from "../../../../shared/utils/collider";
import { mapHelpers } from "../../../../shared/utils/mapHelpers";
import { math } from "../../../../shared/utils/math";
import { util } from "../../../../shared/utils/util";
import { type Vec2, v2 } from "../../../../shared/utils/v2";
import type { Game } from "../game";
import { BaseGameObject } from "./gameObject";

export class DecalBarn {
    decals: Decal[] = [];

    constructor(readonly game: Game) {}

    update(dt: number) {
        for (let i = 0; i < this.decals.length; i++) {
            const decal = this.decals[i];
            decal.lifeTime -= dt;
            if (decal.lifeTime <= 0) {
                this.decals.splice(i, 1);
                decal.destroy();
            }
        }
    }

    addDecal(type: string, pos: Vec2, layer: number, ori?: number, scale?: number) {
        const decal = new Decal(this.game, type, pos, layer, ori, scale);
        this.decals.push(decal);
        this.game.objectRegister.register(decal);
        return decal;
    }
}

export class Decal extends BaseGameObject {
    override readonly __type = ObjectType.Decal;
    bounds: AABB;

    layer: number;
    type: string;
    scale: number;
    goreKills = 0;
    ori: number;
    rot: number;
    collider?: Circle;
    surface?: string;

    lifeTime = Infinity;

    constructor(
        game: Game,
        type: string,
        pos: Vec2,
        layer: number,
        ori?: number,
        scale?: number,
    ) {
        super(game, pos);
        this.layer = layer;
        this.type = type;
        this.scale = scale ?? 1;
        this.ori = ori ?? 0;
        this.rot = math.oriToRad(this.ori);

        const def = MapObjectDefs[type] as DecalDef;

        this.collider = collider.transform(
            def.collision,
            this.pos,
            this.rot,
            this.scale,
        ) as Circle;
        this.surface = def.surface?.type;

        this.bounds = collider.toAabb(
            collider.transform(
                mapHelpers.getBoundingCollider(type),
                v2.create(0, 0),
                this.rot,
                1,
            ),
        );

        const fadeChance = def.fadeChance ?? 1;

        if (def.lifetime && Math.random() < fadeChance) {
            this.lifeTime =
                typeof def.lifetime === "number"
                    ? def.lifetime
                    : util.random(def.lifetime.min, def.lifetime.max);
        }
    }
}

// --- src/block-registry.ts ---

// 方塊類型 (0 必須是 AIR)
export enum BlockType {
    AIR = 0,
    GRASS,
    STONE,
    SEA_LANTERN, // 海晶燈 (光源)
    DIAMOND_BLOCK, // 鑽石方塊 (高光/反射)
    // ... 其他方塊
}

// 方塊屬性接口
export interface BlockAttributes {
    isOpaque: boolean;      // 是否阻擋光線傳播
    isLightSource: boolean; // 是否為光源
    lightLevel: number;     // 0-15 (最大光線強度)
    // 紋理座標, 剛體屬性等...
}

// 方塊屬性註冊表
export const BlockRegistry: Record<BlockType, BlockAttributes> = {
    [BlockType.AIR]: { isOpaque: false, isLightSource: false, lightLevel: 0 },
    [BlockType.GRASS]: { isOpaque: true, isLightSource: false, lightLevel: 0 },
    [BlockType.STONE]: { isOpaque: true, isLightSource: false, lightLevel: 0 },
    [BlockType.DIAMOND_BLOCK]: { isOpaque: true, isLightSource: false, lightLevel: 0 },
    [BlockType.SEA_LANTERN]: { 
        isOpaque: false, // 海晶燈在麥塊中不完全阻擋光線
        isLightSource: true, 
        lightLevel: 15     // 最高光照強度 
    },
    // ...
};

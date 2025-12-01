// --- src/chunk-data.ts ---

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 256;
export const CHUNK_VOLUME = CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT;

export class Chunk {
    // 區塊在世界中的坐標
    x: number;
    z: number;
    // 方塊數據 (BlockType)
    blocks: Uint8Array;
    // 光線數據 (0-15)
    lightMap: Uint8Array; 
    isDirty: boolean; // 是否被修改過，用於存檔和渲染更新

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
        this.blocks = new Uint8Array(CHUNK_VOLUME).fill(BlockType.AIR);
        this.lightMap = new Uint8Array(CHUNK_VOLUME).fill(0); // 初始為無光
        this.isDirty = false;
    }
    
    getIndex(lx: number, ly: number, lz: number): number {
        return ly * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
    }
}

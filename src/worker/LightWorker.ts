// --- src/worker/LightWorker.ts ---

// Worker 中的 BFS 光線傳播算法 (運行在獨立線程)

const CHUNK_SIZE_XZ = 16;
const CHUNK_SIZE_Y = 256;

// 相鄰方塊的坐標偏移量 (上, 下, 東, 西, 南, 北)
const NEIGHBORS = [
    [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
];

// 註：在實際專案中，BlockRegistry 需要以某種方式傳遞給 Worker

function getIndex(lx: number, ly: number, lz: number): number {
    return ly * CHUNK_SIZE_XZ * CHUNK_SIZE_XZ + lz * CHUNK_SIZE_XZ + lx;
}

/**
 * 運行光線傳播廣度優先搜索 (BFS)
 */
function propagateLight(
    chunksData: Map<string, { blocks: Uint8Array, light: Uint8Array }>,
    lightSources: { x: number, y: number, z: number, level: number }[]
) {
    const queue = lightSources;

    while (queue.length > 0) {
        const { x, y, z, level } = queue.shift()!;
        if (level <= 1) continue; 
        
        // 嘗試向六個方向擴散
        for (const [dx, dy, dz] of NEIGHBORS) {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;
            const nextLevel = level - 1;

            // 轉換為區塊坐標和局部坐標
            const chunkX = Math.floor(nx / CHUNK_SIZE_XZ);
            const chunkZ = Math.floor(nz / CHUNK_SIZE_XZ);
            const lx = nx % CHUNK_SIZE_XZ;
            const ly = ny;
            const lz = nz % CHUNK_SIZE_XZ;
            
            const chunkKey = `${chunkX}_${chunkZ}`;
            const chunk = chunksData.get(chunkKey);
            
            // 檢查是否在有效的區塊和高度範圍內
            if (chunk && ly >= 0 && ly < CHUNK_SIZE_Y) {
                const index = getIndex(lx, ly, lz);
                // 這裡假設 Block 屬性已在主線程檢查，Worker 只處理傳播邏輯
                
                // 檢查是否已存在更高的光線強度
                if (nextLevel > chunk.light[index]) {
                    chunk.light[index] = nextLevel;
                    // 加入隊列，繼續傳播
                    queue.push({ x: nx, y: ny, z: nz, level: nextLevel });
                }
            }
        }
    }
    
    // 將計算結果返回給主線程 (使用 Transferable Object 提高效率)
    self.postMessage({ type: 'LIGHT_COMPUTED', chunksData: Array.from(chunksData.entries()) });
}

// Worker 事件監聽
self.onmessage = (event) => {
    if (event.data.type === 'START_PROPAGATION') {
        const { chunksData, lightSources } = event.data;
        // 將傳入的陣列轉為 Map 結構
        propagateLight(new Map(chunksData), lightSources);
    }
};

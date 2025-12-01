// --- src/light-manager.ts ---

import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './chunk-data';
import { BlockRegistry } from './block-registry';

// 存儲所有區塊的光線數據
const lightDataStore = new Map<string, Uint8Array>(); 
const chunksToRebuild = new Set<string>(); // 儲存光線改變的區塊 Key
// 創建 Web Worker
const lightWorker = new Worker(new URL('./worker/LightWorker.ts', import.meta.url));

lightWorker.onmessage = (event) => {
    if (event.data.type === 'LIGHT_COMPUTED') {
        const computedChunks = event.data.chunksData as [string, { blocks: Uint8Array, light: Uint8Array }][];
        
        for (const [chunkKey, data] of computedChunks) {
            lightDataStore.set(chunkKey, data.light);
            chunksToRebuild.add(chunkKey); // 通知主循環重新生成網格
        }
        console.log(`[LightManager] ${computedChunks.length} 區塊光線更新完成.`);
    }
};

/**
 * 從數據存儲中獲取世界坐標的光線強度 (供 Mesh Builder 使用)
 */
export function getLightLevel(wx: number, wy: number, wz: number): number {
    const chunkX = Math.floor(wx / CHUNK_SIZE);
    const chunkZ = Math.floor(wz / CHUNK_SIZE);
    const lx = wx % CHUNK_SIZE;
    const ly = wy;
    const lz = wz % CHUNK_SIZE;
    
    const chunkKey = `${chunkX}_${chunkZ}`;
    const lightMap = lightDataStore.get(chunkKey);
    
    if (lightMap && ly >= 0 && ly < CHUNK_HEIGHT) {
        const index = ly * CHUNK_SIZE * CHUNK_SIZE + lz * CHUNK_SIZE + lx;
        return lightMap[index] || 0; // 返回 0-15
    }
    return 0; 
}


/**
 * 觸發光線更新計算
 * @param loadedChunks 當前已加載的所有區塊
 */
export function triggerLightUpdate(loadedChunks: Map<string, Chunk>) {
    const lightSources: any[] = [];
    const chunksToSend = new Map<string, { blocks: Uint8Array, light: Uint8Array }>();

    for (const [key, chunk] of loadedChunks.entries()) {
        const chunkData = {
            blocks: chunk.blocks,
            light: lightDataStore.get(key) || new Uint8Array(CHUNK_VOLUME).fill(0) 
        };
        chunksToSend.set(key, chunkData);
        
        // 尋找光源並設定其初始光線等級
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                for (let x = 0; x < CHUNK_SIZE; x++) {
                    const index = chunk.getIndex(x, y, z);
                    const type = chunk.blocks[index];
                    const attrs = BlockRegistry[type];
                    
                    if (attrs.isLightSource) {
                        lightSources.push({
                            x: chunk.x * CHUNK_SIZE + x, 
                            y: y, 
                            z: chunk.z * CHUNK_SIZE + z, 
                            level: attrs.lightLevel 
                        });
                        chunkData.light[index] = attrs.lightLevel;
                    }
                }
            }
        }
    }
    
    // 將數據傳輸給 Worker
    lightWorker.postMessage({
        type: 'START_PROPAGATION',
        chunksData: Array.from(chunksToSend.entries()),
        lightSources: lightSources
    }, [
        // 傳遞 Transferable Object 以優化性能
        ...Array.from(chunksToSend.values()).flatMap(d => [d.blocks.buffer, d.light.buffer])
    ]);
}

// 供主循環檢查哪些區塊需要重新渲染
export function getChunksToRebuild(): Set<string> {
    return chunksToRebuild;
}

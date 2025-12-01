// --- src/main.ts ---

import * as THREE from 'three';
import { BlockType, BlockRegistry } from './block-registry';
import { Chunk } from './chunk-data';
import { triggerLightUpdate, getChunksToRebuild } from './light-manager';
import { rebuildChunkMesh } from './chunk-mesh-builder'; 
// import { persistenceService } from './persistence-service'; // 存檔服務

// 創建場景、攝影機、渲染器... (標準 Three.js 初始化)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container')!.appendChild(renderer.domElement);

// 加載紋理圖集 (Placeholder)
const textureLoader = new THREE.TextureLoader();
const blockAtlasTexture = textureLoader.load('/atlas.png'); 

// 測試區塊數據 (僅為範例，實際會用到創世/Perlin Noise)
const testChunk = new Chunk(0, 0);
for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
        testChunk.blocks[testChunk.getIndex(x, 63, z)] = BlockType.GRASS;
    }
}
// 放置海晶燈作為光源
testChunk.blocks[testChunk.getIndex(8, 65, 8)] = BlockType.SEA_LANTERN;

const loadedChunks = new Map<string, Chunk>();
loadedChunks.set('0_0', testChunk);
const chunkMeshes = new Map<string, THREE.Mesh>();


// 遊戲主循環
function animate() {
    requestAnimationFrame(animate);

    // 1. 處理光線更新
    const rebuildList = getChunksToRebuild();
    if (rebuildList.size > 0) {
        for (const key of rebuildList) {
            const chunk = loadedChunks.get(key);
            if (chunk) {
                // 移除舊的 Mesh
                const oldMesh = chunkMeshes.get(key);
                if(oldMesh) scene.remove(oldMesh); 
                
                // 重新生成 Mesh 並應用新的光線顏色
                const newMesh = rebuildChunkMesh(chunk, scene, blockAtlasTexture);
                chunkMeshes.set(key, newMesh);
            }
        }
        rebuildList.clear();
    }
    
    // 2. 處理玩家輸入和物理 (創造模式飛行)
    // ... 實現飛行邏輯和相機控制 ...
    
    // 3. 渲染
    renderer.render(scene, camera);
}

// 模擬玩家在 (8, 65, 8) 放置海晶燈
function simulateBlockPlacement() {
    console.log("模擬放置海晶燈，觸發光線更新...");
    
    // 觸發 Worker 進行光線計算
    triggerLightUpdate(loadedChunks);
}

// 啟動遊戲
// persistenceService.init().then(() => { /* ... */ });
simulateBlockPlacement(); // 初始時運行一次光線計算
animate();

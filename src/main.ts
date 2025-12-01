// --- src/main.ts (補齊版) ---

import * as THREE from 'three';
import { BlockType, BlockRegistry } from './block-registry';
import { Chunk, CHUNK_SIZE } from './chunk-data';
import { triggerLightUpdate, getChunksToRebuild } from './light-manager';
import { rebuildChunkMesh } from './chunk-mesh-builder'; 
import { PlayerController } from './player-controller'; // 引入飛行控制器
import { InputManager } from './input-manager'; // 引入輸入管理器
import { getSpecialMaterial } from './diamond-block-shader'; // 引入鑽石材質

const gameContainer = document.getElementById('game-container')!;

// 創建場景、攝影機、渲染器... (與先前程式碼相同)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 啟用抗鋸齒
renderer.setSize(window.innerWidth, window.innerHeight);
gameContainer.appendChild(renderer.domElement);

// 加載所有環境貼圖和紋理 (Placeholder)
const textureLoader = new THREE.TextureLoader();
const blockAtlasTexture = textureLoader.load('/atlas.png'); 

// 創建天空盒/環境貼圖 (用於鑽石反光)
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
    '/skybox/posx.png', '/skybox/negx.png',
    '/skybox/posy.png', '/skybox/negy.png',
    '/skybox/posz.png', '/skybox/negz.png'
]);
scene.background = envMap; // 將天空盒設置為背景

// 初始化玩家控制器
const player = new PlayerController(camera, new THREE.Vector3(8, 70, 8)); // 讓玩家從高處開始
// 初始化輸入管理器
new InputManager(player, gameContainer); 

// --- 遊戲數據結構 ---
const loadedChunks = new Map<string, Chunk>();
const chunkMeshes = new Map<string, THREE.Mesh>();
let previousTime = performance.now();

// 測試區塊數據：加入鑽石方塊和海晶燈
const testChunk = new Chunk(0, 0);
for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
        testChunk.blocks[testChunk.getIndex(x, 63, z)] = BlockType.GRASS;
    }
}
testChunk.blocks[testChunk.getIndex(8, 65, 8)] = BlockType.SEA_LANTERN;     // 光源
testChunk.blocks[testChunk.getIndex(10, 65, 10)] = BlockType.DIAMOND_BLOCK; // 鑽石方塊
loadedChunks.set('0_0', testChunk);


// 遊戲主循環
function animate(currentTime: number) {
    const deltaT = (currentTime - previousTime) / 1000; // 計算時間差 (秒)
    previousTime = currentTime;
    
    requestAnimationFrame(animate);

    // 1. 更新玩家位置和視角 (創造模式飛行)
    player.update(deltaT);

    // 2. 處理光線更新
    const rebuildList = getChunksToRebuild();
    if (rebuildList.size > 0) {
        for (const key of rebuildList) {
            const chunk = loadedChunks.get(key);
            if (chunk) {
                // ... 移除舊的 Mesh (與先前程式碼相同) ...
                const oldMesh = chunkMeshes.get(key);
                if(oldMesh) scene.remove(oldMesh); 
                
                // 重新生成 Mesh 並應用新的光線顏色和鑽石材質
                const newMesh = rebuildChunkMesh(chunk, scene, blockAtlasTexture, envMap); 
                chunkMeshes.set(key, newMesh);
            }
        }
        rebuildList.clear();
    }
    
    // 3. 渲染
    renderer.render(scene, camera);
}


// 初始化遊戲世界並觸發首次渲染
function initializeGame() {
    // 首次重建網格 (這也將調用 rebuildChunkMesh 應用材質)
    const initialMesh = rebuildChunkMesh(testChunk, scene, blockAtlasTexture, envMap);
    chunkMeshes.set('0_0', initialMesh);
    
    // 首次觸發光線計算 (海晶燈生效)
    triggerLightUpdate(loadedChunks); 
    
    animate(performance.now());
}

initializeGame();

// 處理視窗大小變化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- src/chunk-mesh-builder.ts ---

import * as THREE from 'three';
import { Chunk } from './chunk-data';
import { getLightLevel } from './light-manager'; 

// 假設這是一個通用的 Voxel 網格生成函數 (這裡只展示光線應用部分)
export function rebuildChunkMesh(chunk: Chunk, scene: THREE.Scene, blockAtlasTexture: THREE.Texture) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = []; // 儲存光線強度作為頂點顏色

    // Voxel 算法的簡化表示：遍歷區塊中的每個方塊
    for (let y = 0; y < 256; y++) {
        for (let z = 0; z < 16; z++) {
            for (let x = 0; x < 16; x++) {
                // ... 判斷方塊類型和面可見性 (AABB 檢查) ...
                const blockType = chunk.blocks[chunk.getIndex(x, y, z)];
                if (blockType === 0) continue; // 跳過空氣

                // 假設我們在處理方塊的一個面 (Face)
                
                // 1. 獲取光線等級
                const wx = chunk.x * 16 + x;
                const wy = y;
                const wz = chunk.z * 16 + z;
                
                // 獲取方塊中心的光線等級 (0-15)
                const lightValue = getLightLevel(wx, wy, wz);
                const intensity = lightValue / 15.0; // 將 0-15 映射到 0.0-1.0

                // 2. 將光線應用為頂點顏色
                // 每個面有 4 個頂點，需要 4 組顏色 (R, G, B)
                for (let i = 0; i < 4; i++) { 
                    // 將強度應用到 RGB 三個通道，實現灰度著色
                    colors.push(intensity, intensity, intensity); 
                }

                // ... 繼續添加 positions, uvs, indices (省略) ...
            }
        }
    }

    // 設置 BufferAttributes
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3)); // 設置顏色屬性
    geometry.computeVertexNormals();

    // 3. 使用 Lambert 材質並啟用頂點顏色
    const material = new THREE.MeshLambertMaterial({ 
        map: blockAtlasTexture, 
        vertexColors: true, // 啟用頂點顏色，光線強度將作用於顏色
        side: THREE.FrontSide 
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    return mesh;
}

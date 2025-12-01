// --- src/diamond-block-shader.ts ---

import * as THREE from 'three';

// 鑽石方塊的材質
let diamondMaterial: THREE.MeshStandardMaterial;

export function createDiamondMaterial(envMap: THREE.CubeTexture | null): THREE.Material {
    if (diamondMaterial) return diamondMaterial;

    // 我們需要一個 PBR (物理渲染) 材質來處理反射和高光
    diamondMaterial = new THREE.MeshStandardMaterial({
        color: 0x8be5ff,          // 略帶藍色的鑽石顏色
        metalness: 0.1,           // 低金屬度
        roughness: 0.1,           // 非常低粗糙度，使其光滑並產生高光
        transparent: true,        // 允許輕微透明
        opacity: 0.8,             // 輕微的透明度
        envMap: envMap,           // 環境貼圖 (用於反射周圍世界)
        envMapIntensity: 1.5,     // 反射強度
        // 必須啟用頂點顏色，以便它仍能接收來自光線系統的強度
        vertexColors: true
    });
    
    return diamondMaterial;
}

/**
 * 替換特定方塊的材質
 * @param type 方塊類型
 * @returns 專屬材質或 null
 */
export function getSpecialMaterial(type: BlockType, envMap: THREE.CubeTexture | null): THREE.Material | null {
    switch (type) {
        case BlockType.DIAMOND_BLOCK:
            return createDiamondMaterial(envMap);
        // case BlockType.QUARTZ_STAIRS:
        //    // 這裡可以返回一個自定義的石英材質
        //    return quartzMaterial;
        default:
            return null;
    }
}

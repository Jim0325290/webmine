// --- src/player-controller.ts ---

import * as THREE from 'three';

// 創造模式：啟用飛行，取消重力
const MOVE_SPEED = 10; // 飛行速度 (單位/秒)
const LOOK_SENSITIVITY = 0.002; // 視角旋轉靈敏度

export class PlayerController {
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public rotation: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ 順序適合第一人稱
    
    // 從 InputManager 接收的移動輸入
    public moveInput = { 
        forward: 0, 
        right: 0, 
        up: 0, // 垂直移動 (創造模式特有)
        lookX: 0, // 視角水平旋轉
        lookY: 0  // 視角垂直旋轉
    };

    constructor(private camera: THREE.Camera, initialPosition: THREE.Vector3) {
        this.camera.position.copy(initialPosition);
    }

    // 供 InputManager 調用以設定移動方向
    public setMovement(forward: number, right: number, up: number) {
        this.moveInput.forward = forward;
        this.moveInput.right = right;
        this.moveInput.up = up;
    }
    
    // 供 InputManager 調用以設定視角轉動
    public setLook(deltaX: number, deltaY: number) {
        this.moveInput.lookX += deltaX * LOOK_SENSITIVITY;
        this.moveInput.lookY += deltaY * LOOK_SENSITIVITY;
    }

    public update(deltaT: number) {
        // --- 1. 視角旋轉 ---
        
        // 水平旋轉 (Yaw)
        this.rotation.y -= this.moveInput.lookX;
        // 垂直旋轉 (Pitch)，並限制視角不超過頭頂或腳底
        this.rotation.x -= this.moveInput.lookY;
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
        
        this.camera.rotation.copy(this.rotation);
        
        // 旋轉後將 Look 輸入歸零，因為它是瞬時變化量
        this.moveInput.lookX = 0;
        this.moveInput.lookY = 0;


        // --- 2. 創造模式飛行移動 ---
        
        // 計算基於相機方向的移動向量
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction); // 獲取相機的前方方向
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyQuaternion(this.camera.quaternion); // 獲取相機的右方方向

        // 計算最終移動向量
        this.velocity.set(0, 0, 0);
        
        // 前後移動 (Forward/Backward)
        this.velocity.addScaledVector(direction, this.moveInput.forward * MOVE_SPEED);
        
        // 左右平移 (Strafe)
        this.velocity.addScaledVector(right, this.moveInput.right * MOVE_SPEED);
        
        // 上下移動 (Up/Down) - 創造模式特有
        this.velocity.y += this.moveInput.up * MOVE_SPEED;
        
        // 應用速度
        this.camera.position.addScaledVector(this.velocity, deltaT);
    }
}

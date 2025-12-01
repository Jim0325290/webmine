// --- src/input-manager.ts ---

import { PlayerController } from './player-controller';

// 虛擬搖桿的半徑，用於計算移動強度
const JOYSTICK_RADIUS = 50; 
// 右側觸控區域 (用於視角轉動)
const LOOK_AREA_THRESHOLD = window.innerWidth / 2; 

export class InputManager {
    private activeTouches: Map<number, Touch> = new Map();
    private movementTouchId: number | null = null;
    private lastLookX: number = 0;
    private lastLookY: number = 0;

    constructor(private controller: PlayerController, gameContainer: HTMLElement) {
        // 監聽觸控事件
        gameContainer.addEventListener('touchstart', this.handleTouchStart);
        gameContainer.addEventListener('touchmove', this.handleTouchMove);
        gameContainer.addEventListener('touchend', this.handleTouchEnd);
        gameContainer.addEventListener('touchcancel', this.handleTouchEnd);
        
        // 監聽鍵盤事件 (供桌面測試用，W/A/S/D/Space/Shift)
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    // --- 鍵盤處理 (桌面測試) ---
    private keyState: { [key: string]: boolean } = {};

    private handleKeyDown = (e: KeyboardEvent) => {
        this.keyState[e.code] = true;
        this.updateKeyboardMovement();
    }
    
    private handleKeyUp = (e: KeyboardEvent) => {
        this.keyState[e.code] = false;
        this.updateKeyboardMovement();
    }

    private updateKeyboardMovement = () => {
        const forward = (this.keyState['KeyW'] ? 1 : 0) + (this.keyState['KeyS'] ? -1 : 0);
        const right = (this.keyState['KeyD'] ? 1 : 0) + (this.keyState['KeyA'] ? -1 : 0);
        const up = (this.keyState['Space'] ? 1 : 0) + (this.keyState['ShiftLeft'] ? -1 : 0); // Space/Shift 進行上下飛行
        this.controller.setMovement(forward, right, up);
    }
    
    // --- 觸控處理 (手機) ---

    private handleTouchStart = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.activeTouches.set(touch.identifier, touch);
            
            // 首次觸控，且在左側，分配給移動搖桿
            if (this.movementTouchId === null && touch.clientX < LOOK_AREA_THRESHOLD) {
                this.movementTouchId = touch.identifier;
            }
            // 首次觸控，且在右側，分配給視角旋轉
            if (touch.clientX >= LOOK_AREA_THRESHOLD) {
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
            }
        }
    }

    private handleTouchMove = (e: TouchEvent) => {
        let forward = 0;
        let right = 0;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            // 1. 處理移動搖桿 (左側)
            if (touch.identifier === this.movementTouchId) {
                // 這裡需要計算搖桿的初始位置，但為簡化，我們用觸摸位置直接模擬
                
                // 由於沒有虛擬搖桿的初始位置，這裡我們只用二值輸入
                // 實際應用中，會比較 (touch.clientX - initialX) 來計算強度
                if (touch.clientX < this.activeTouches.get(this.movementTouchId!)!.clientX - 20) right = -1;
                else if (touch.clientX > this.activeTouches.get(this.movementTouchId!)!.clientX + 20) right = 1;
                
                if (touch.clientY < this.activeTouches.get(this.movementTouchId!)!.clientY - 20) forward = 1;
                else if (touch.clientY > this.activeTouches.get(this.movementTouchId!)!.clientY + 20) forward = -1;
                
                this.controller.setMovement(forward, right, 0);
            } 
            
            // 2. 處理視角旋轉 (右側)
            else if (touch.clientX >= LOOK_AREA_THRESHOLD) {
                const deltaX = touch.clientX - this.lastLookX;
                const deltaY = touch.clientY - this.lastLookY;
                
                this.controller.setLook(deltaX, deltaY);
                
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
            }
            
            this.activeTouches.set(touch.identifier, touch);
        }
    }

    private handleTouchEnd = (e: TouchEvent) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            
            if (touch.identifier === this.movementTouchId) {
                this.movementTouchId = null;
                // 停止移動
                this.controller.setMovement(0, 0, 0);
            }
            
            this.activeTouches.delete(touch.identifier);
        }
    }
}

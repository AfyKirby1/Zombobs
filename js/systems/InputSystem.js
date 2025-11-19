export class InputSystem {
    constructor() {
        this.gamepadIndex = null;
        this.deadzone = 0.2; // Ignore small stick movements (drift)
        
        // State storage
        this.buttons = {
            fire: { pressed: false, justPressed: false, value: 0 },
            reload: { pressed: false, justPressed: false, value: 0 },
            grenade: { pressed: false, justPressed: false, value: 0 },
            interact: { pressed: false, justPressed: false, value: 0 },
            pause: { pressed: false, justPressed: false, value: 0 },
            prevWeapon: { pressed: false, justPressed: false, value: 0 },
            nextWeapon: { pressed: false, justPressed: false, value: 0 },
            sprint: { pressed: false, justPressed: false, value: 0 },
            melee: { pressed: false, justPressed: false, value: 0 }
        };
        
        this.axes = {
            move: { x: 0, y: 0 },
            aim: { x: 0, y: 0 }
        };
        
        this.rebindMode = false;
        this.rebindCallback = null;

        // Event listeners for connection
        window.addEventListener("gamepadconnected", (e) => {
            console.log(`Gamepad connected: ${e.gamepad.id}`);
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            console.log("Gamepad disconnected");
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    update(controlSettings) {
        // Reset 'justPressed' flags every frame
        for (const key in this.buttons) {
            this.buttons[key].justPressed = false;
        }

        if (this.gamepadIndex === null) return;

        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;
        
        // If we are in rebind mode, listen for any button press
        if (this.rebindMode && this.rebindCallback) {
            for (let i = 0; i < gamepad.buttons.length; i++) {
                if (gamepad.buttons[i].pressed) {
                    // Debounce slightly or wait for release? 
                    // For simplicity, trigger on press.
                    this.rebindCallback(i);
                    this.rebindMode = false;
                    this.rebindCallback = null;
                    return;
                }
            }
            return; // Don't process normal inputs while rebinding
        }

        // --- Axes Processing ---
        // Left Stick (Move): Axes 0 (X) & 1 (Y)
        this.applyDeadzone(gamepad.axes[0], gamepad.axes[1], this.axes.move);
        
        // Right Stick (Aim): Axes 2 (X) & 3 (Y)
        this.applyDeadzone(gamepad.axes[2], gamepad.axes[3], this.axes.aim);

        // --- Button Mapping ---
        // Use the provided control settings or fallback to defaults
        // controlSettings should map action -> buttonIndex
        // e.g. { fire: 7, reload: 2, ... }
        
        if (controlSettings) {
            for (const action in this.buttons) {
                const buttonIndex = controlSettings[action];
                if (buttonIndex !== undefined && gamepad.buttons[buttonIndex]) {
                    this.updateButton(action, gamepad.buttons[buttonIndex]);
                }
            }
        }
    }

    updateButton(name, gamepadButton) {
        // Handle case where button is an object or raw value
        const pressed = typeof gamepadButton === 'object' ? gamepadButton.pressed : gamepadButton > 0.5;
        const value = typeof gamepadButton === 'object' ? gamepadButton.value : (pressed ? 1 : 0);
        
        if (pressed && !this.buttons[name].pressed) {
            this.buttons[name].justPressed = true;
        }
        this.buttons[name].pressed = pressed;
        this.buttons[name].value = value;
    }

    applyDeadzone(x, y, target) {
        const magnitude = Math.sqrt(x*x + y*y);
        if (magnitude < this.deadzone) {
            target.x = 0;
            target.y = 0;
        } else {
            target.x = x;
            target.y = y;
        }
    }
    
    getAimInput() { return this.axes.aim; }
    getMoveInput() { return this.axes.move; }
    isConnected() { return this.gamepadIndex !== null; }
    
    startRebind(callback) {
        this.rebindMode = true;
        this.rebindCallback = callback;
    }
    
    cancelRebind() {
        this.rebindMode = false;
        this.rebindCallback = null;
    }
}

export const inputSystem = new InputSystem();


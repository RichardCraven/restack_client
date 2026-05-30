# Restack Sandbox Terminology

This document defines terminology and visual concepts used in the combat simulator sandbox environment.

## Terms

### Effect Icon
- **Definition**: A status or buff badge rendered in the **top-right corner** of a combatant's portrait.
- **Example**: The `shielded` and `shielded_partial` icons displayed during the Sage's Circle of Protection.
- **Behavior & Animation**:
  - Effect icons enter the screen with a **grow transition** (scaling up from 0 to 1 with an elastic/spring curve).
  - They exit the screen with a **shrink transition** (scaling down from 1 to 0) before unmounting.
- **File Reference**: [SandboxPage.js](file:///Users/richardcraven/Documents/Projects/restack/restack_client/src/pages/SandboxPage.js)

### Notch Submenu
- **Definition**: The arced popup menu that appears above the Ranger's **Notch** ability icon when clicked.
- **Layout**: A shallow arc of small (28px) circular icons fanning out above the ability icon. The outer icons sit lower, inner icons sit higher, forming a gentle curve.
- **Arrow Types**: Force (orange), Ice (blue), Poison (green), Celestial (golden).
- **Behavior**: Clicking an arrow icon sets that as the currently notched arrow and closes the submenu.

### CSS Arrow / Ranger Arrow
- **Definition**: The custom DOM/CSS projectile used when the Ranger fires arrows (via Loose or Execute).
- **Visual**: A triangular arrowhead with a tapered glowing tail (80px long for single arrows, 60px for execute arrows), using `clipPath` horizontal triangle tapering and linear gradient fading to transparent. Not an image icon.
- **Poison Arrow**: Has animated green droplets trailing behind it during flight.
- **Colors**: Force (#ff9f1c), Ice (#00bfff), Poison (#38b000), Celestial (#ffdd57).
- **Hit Effect**: Displays a custom particle burst matching the arrow's type (`poison_burst` or `arrow_hit`), NOT a claw/slash animation.

### Notched Arrow Indicator
- **Definition**: A small circular icon in the **top-left** of the Ranger's portrait showing which arrow type is currently loaded.
- **Appears**: Whenever the Ranger has a notched arrow selected (always, since default is Force).

### Circle of Protection (COP)
- **Definition**: The Sage's defensive ability that creates a sanctuary shielding allies.
- **Visual**: A custom CSS circle with a glowing blue border and 12 Elder Futhark rune characters positioned around the inside perimeter, spinning slowly (20s rotation).
- **Inner Ring**: A subtle secondary circle accent inside the main ring.
- **NOT**: A giant version of the ability icon. It is a procedurally generated CSS element.

### Frozen Overlay
- **Definition**: The visual effect applied to a target's portrait when they are frozen (e.g., by Ice Arrow or Ice Blast).
- **Visual**: A blueish gradient overlay with inset glow (`boxShadow: inset`) over the portrait. The portrait is dimmed (`brightness(0.85) saturate(0.6)`).
- **Shape**: The ice burst hit effect uses a **diamond/rhombus** shape (8-point polygon), NOT a star shape.

### Sage Heal Movement
- **Definition**: When the Sage uses the Heal ability, it physically moves toward the target ally (Soldier) before casting the heal, then returns to its original position.
- **Animation Phases**: `heal_approach` → buff effect + floating text → `return` → reset.

### Combat Grid
- **Definition**: The 5×5 grid where combat animations play out.
- **Size**: Fixed at **500×500 pixels**. Does NOT change size based on which fighter is selected.

### Floating Combat Text
- **Definition**: Animated text that appears above a combatant showing damage numbers, status effects, or heal amounts.
- **Behavior**: Floats upward and fades out over ~0.9 seconds.
- **Crit Text**: Larger font size (22px vs 17px for normal).

### Hit Effect
- **Types**: `slash` (claw marks), `sword_slash` (arc animation), `fire_exp` (radial explosion), `ice_burst` (diamond shape), `shadow` (purple radial), `void_portal` (oval portal).

### Target Mark
- **Definition**: The visual mark placed on a target when marked by the Ranger's Mark ability.
- **Visual**: A glowing crosshair-like indicator that is scaled 25% larger than the portrait card (width: 125%, height: 125%, centered) and pulses opacity dynamically between 45% and 80% to keep the portrait clearly visible.
- **Trigger**: Detonates with Loose or Execute to deal bonus damage.

# Graphical Redesign Plan for Game Elements

## Overview
This plan outlines a complete graphical redesign of all level elements in the game. The new style will be simple, fully abstract, 2D, and non-animated, using consistent geometric shapes and a cohesive color palette.

## Color Palette
- #A6ECFF (sky blue) - WALL, PLAYER
- #ECAE89 (peach) - FLOOR
- #EC9357 (burnt orange) - DOOR
- #617492 (slate blue) - GRASS
- #606698 (purple) - BLOCKADE_STATION, START
- #FFD700 (gold) - BLOCKADE, PLAYER (carrying)
- #32CD32 (lime green) - CONTAINER
- #000000 (black) - LASER fill
- #FF1493 (deep pink) - LASER border
- #FF6347 (tomato red) - PLUTONIUM
- #00CED1 (dark turquoise) - KEY
- #DC143C (crimson) - ROBOT
- #8A2BE2 (blue violet) - ALIEN
- #696969 (dim gray) - MINE
- #FFFFFF (white) - text/details
- #000000 (black) - borders

## Element Specifications

All elements are uniform 80% size solid color rectangles (32x32 pixels on 40px tiles), centered within their tile space.

### WALL
- **Fill**: #D2B48C (light brown)
- **Purpose**: Provides wall appearance

### FLOOR
- **Fill**: #000000 (black)
- **Purpose**: Base ground texture

### DOOR
- **Fill**: #EC9357 (burnt orange)
- **Purpose**: Indicates locked passages

### GRASS
- **Fill**: #333333 (dark gray)
- **Purpose**: Destructible ground elements

### BLOCKADE_STATION
- **Fill**: #606698 (purple)
- **Purpose**: Source of blockade items

### BLOCKADE
- **Fill**: #FFD700 (gold)
- **Purpose**: Temporary wall placement

### CONTAINER
- **Fill**: #32CD32 (lime green) or flickers #32CD32 / #000000 (black) every 100ms when player is carrying plutonium
- **Purpose**: Plutonium deposit point that flickers when player has plutonium

### LASER
- **Fill**: Small centered dark red (#8B0000) square (50% size) when open, wavers dark red (#8B0000) with sine wave animation when closed
- **Purpose**: Deadly barrier that shows warning indicator when open and wavers red when active

### PLUTONIUM
- **Fill**: Animated cycle - #FFFF00 (yellow) → #FFA500 (orange) → #FF0000 (red) → #800080 (purple) → #0000FF (blue) → #000000 (black)
- **Animation**: Cycles every 125ms (4x faster)
- **Purpose**: Collectible item

### KEY
- **Fill**: #EC9357 (burnt orange, same as door)
- **Size**: 50% (20x20 pixels on 40px tiles)
- **Purpose**: Door unlocking item

### PLAYER
- **Fill**: #A6ECFF (sky blue) or #FFD700 (gold when carrying)
- **Purpose**: Player character

### ROBOT
- **Fill**: #DC143C (crimson)
- **Purpose**: Enemy type 1

### ALIEN
- **Fill**: #8A2BE2 (blue violet)
- **Purpose**: Enemy type 2

### MINE
- **Fill**: #696969 (dim gray)
- **Purpose**: Stationary enemy

### START
- **Fill**: #00BFFF (deep sky blue)
- **Purpose**: Player spawn point

## Implementation Steps

1. **Analyze current drawEntity function** - Understand existing code structure
2. **Define color constants** - Create consistent color variables
3. **Update each entity case** - Replace complex drawings with simple shapes
4. **Remove animations** - Eliminate time-based effects (pulsing, bobbing, blinking)
5. **Update drawGame function** - Remove player bobbing animation
6. **Test implementation** - Verify all elements render correctly

## Technical Notes

- All elements use TILE_SIZE (40px) as base unit
- Shapes are centered using cx = x + w/2, cy = y + h/2
- No shadow effects or gradients
- Text rendering only for BLOCKADE_STATION
- Laser state affects only border visibility
- Player color changes based on carrying state

## Benefits

- Cleaner, more modern abstract aesthetic
- Improved performance (no complex animations)
- Consistent visual language across all elements
- Easier maintenance and modification
- Better accessibility with high contrast shapes
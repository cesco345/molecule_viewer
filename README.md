# Development Workflow - Molecule Viewer

A modern, WebGL-based molecular visualization tool built with Next.js and TypeScript. This application allows users to view and interact with protein structures in both sphere and ribbon representations.

## Phase 1: Project Setup and Basic Structure

1. Initialize Next.js project with TypeScript

   ```bash
   npx create-next-app@latest molecule-viewer --typescript
   ```

2. Add required dependencies

   ```bash
   pnpm add @types/three three @react-three/fiber @react-three/drei
   ```

3. Set up project directory structure
   ```
   src/
   ├── app/
   ├── components/
   │   ├── ui/
   │   └── viewer/
   └── lib/
   ```

## Phase 2: Core WebGL Implementation

1. Create basic WebGL context setup (useWebGL.ts)

   - Initialize WebGL context
   - Create shader programs
   - Set up attribute locations

2. Implement basic geometry utilities (geometry.ts)

   - Create sphere geometry for atoms
   - Set up vertex and index buffers

3. Develop matrix math utilities (matrix.ts)
   - Implement Matrix4 class
   - Add transformation methods

## Phase 3: PDB File Handling

1. Create PDB parser (pdbParser.ts)

   - Parse atomic coordinates
   - Extract atom information
   - Handle different record types

2. Implement file upload component
   - Create FileUpload.tsx
   - Add drag-and-drop support
   - Handle file reading

## Phase 4: Molecule Rendering

1. Set up sphere rendering for atoms

   - Implement instanced rendering
   - Add proper atom colors
   - Set up van der Waals radii

2. Create camera controls

   - Implement rotation
   - Add panning
   - Set up zooming
   - Add momentum

3. Add basic lighting
   - Implement Phong shading
   - Set up normal calculations
   - Add ambient and diffuse lighting

## Phase 5: User Interface

1. Create basic viewer layout

   - Set up canvas container
   - Add overlay components
   - Position UI elements

2. Implement control overlays

   - Add ViewModeToggle
   - Create DebugOverlay
   - Add ControlsOverlay

3. Add keyboard shortcuts
   - Reset view ('R' key)
   - Debug mode (Ctrl + 'D')
   - Arrow key navigation

## Phase 6: Ribbon Visualization

1. Implement secondary structure detection

   - Analyze backbone atoms
   - Detect helices and sheets
   - Identify coil regions

2. Create ribbon geometry generation

   - Implement spline calculations
   - Generate vertex data
   - Create proper normals

3. Add ribbon rendering
   - Set up ribbon shaders
   - Implement proper coloring
   - Add smooth transitions

## Phase 7: Interaction Features

1. Add atom selection

   - Implement ray casting
   - Create selection highlight
   - Show atom information

2. Add view centering
   - Calculate molecule bounds
   - Implement auto-centering
   - Add reset functionality

## Phase 8: Performance Optimization

1. Optimize rendering

   - Implement geometry instancing
   - Add buffer caching
   - Optimize draw calls

2. Improve PDB parsing
   - Add efficient data structures
   - Optimize parsing algorithm
   - Add error handling

## Phase 9: Polish and Debugging

1. Add error handling

   - File loading errors
   - WebGL context errors
   - Parsing errors

2. Implement debug features

   - Add FPS counter
   - Show buffer statistics
   - Add camera information

3. Final testing and fixes
   - Cross-browser testing
   - Performance testing
   - Bug fixes

## Phase 10: Documentation

1. Create documentation

   - Write README.md
   - Add code comments
   - Create usage instructions

2. Add type definitions
   - Define interfaces
   - Add TypeScript types
   - Document type usage

## Key Development Decisions

1. Technology Choices:

   - Next.js for modern React features and good TypeScript support
   - Raw WebGL instead of Three.js for better control and learning
   - TypeScript for type safety and better development experience

2. Architecture Decisions:

   - Custom hooks for logic separation
   - Component-based UI structure
   - Utility-based approach for core functionality

3. Performance Considerations:
   - Use of WebGL instancing
   - Efficient data structures
   - Optimized rendering loops

## Challenges and Solutions

1. WebGL Setup

   - Challenge: Complex WebGL boilerplate
   - Solution: Created custom hooks for WebGL context management

2. Ribbon Visualization

   - Challenge: Complex geometry generation
   - Solution: Implemented spline-based approach with proper normals

3. Performance

   - Challenge: Handling large molecules
   - Solution: Used instancing and efficient buffer management

4. User Interaction
   - Challenge: Smooth camera controls
   - Solution: Implemented momentum-based movement and proper event handling# Molecule Viewer

## Features

- **Multiple Visualization Modes**
  - Sphere mode: Atoms represented as spheres with proper van der Waals radii
  - Ribbon mode: Professional protein backbone visualization similar to PyMOL/Chimera
- **Interactive Controls**

  - Rotate: Left-click and drag
  - Pan: Middle-click or Shift + left-click and drag
  - Zoom: Mouse wheel
  - Reset View: 'R' key
  - Debug Mode: Ctrl + 'D'

- **PDB File Support**

  - Upload and parse PDB files
  - Automatic molecule centering
  - Secondary structure detection

- **Real-time Rendering**
  - Hardware-accelerated WebGL rendering
  - Smooth camera controls
  - Efficient geometry instancing

## Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd molecule-viewer
```

2. Install dependencies:

```bash
pnpm install
# or
npm install
```

3. Start the development server:

```bash
pnpm dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/
│   ├── ui/                # Generic UI components
│   │   └── FileUpload.tsx # PDB file upload component
│   └── viewer/            # Molecule viewer components
│       ├── hooks/         # Custom React hooks
│       │   ├── useAtomSelection.ts
│       │   ├── useCameraControls.tsx
│       │   ├── useGeometry.ts
│       │   ├── useRender.ts
│       │   └── useWebGL.ts
│       ├── utils/         # Utility functions
│       │   ├── geometry.ts
│       │   ├── matrix.ts
│       │   ├── pdbParser.ts
│       │   ├── raycast.ts
│       │   ├── ribbonGeometry.ts
│       │   └── shaders.ts
│       └── ...            # Various viewer components
└── lib/                   # Library code
    └── pdb/              # PDB parsing utilities
```

## Technical Details

### WebGL Implementation

The viewer uses custom WebGL shaders and geometry generation for efficient rendering:

- **Sphere Mode**: Uses instanced rendering for efficient atom visualization
- **Ribbon Mode**: Generates smooth spline-based geometry for protein backbone
- **Lighting**: Phong shading model with ambient, diffuse, and specular components

### Data Processing

- **PDB Parsing**: Custom parser handles atomic coordinates and structure information
- **Secondary Structure**: Analyzes protein backbone for helix/sheet/coil determination
- **Geometry Generation**: Dynamic creation of sphere instances and ribbon geometry

## Usage

1. Launch the application
2. Use the file upload button to load a PDB file
3. Toggle between sphere and ribbon modes using the view mode toggle
4. Interact with the molecule using mouse controls
5. Use keyboard shortcuts for additional functions

### Camera Controls

- **Rotation**: Click and drag with left mouse button
- **Panning**: Hold Shift + left mouse button or middle mouse button
- **Zooming**: Mouse wheel
- **Reset**: Press 'R' key

### Keyboard Shortcuts

- `R`: Reset camera view
- `Ctrl + D`: Toggle debug overlay
- Arrow keys: Fine camera panning

## Development

### Adding New Features

1. Create new components in appropriate directories
2. Add hooks in `hooks/` directory
3. Update utility functions as needed
4. Modify shaders in `shaders.ts` for new rendering features

### Building for Production

```bash
pnpm build
# or
npm run build
```

## Performance Considerations

- Uses WebGL instancing for efficient atom rendering
- Implements geometry caching for ribbon mode
- Optimizes camera controls for smooth interaction
- Employs efficient PDB parsing algorithms

## Browser Support

- Requires WebGL support
- Tested on modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile support with touch controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)

## Acknowledgments

- Inspired by professional molecular visualization tools like PyMOL and Chimera
- Uses concepts from computational structural biology
- Built with modern web technologies

# Molecule Viewer

A modern, WebGL-based molecular visualization tool built with Next.js and TypeScript. This application allows users to view and interact with protein structures in both sphere and ribbon representations.

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

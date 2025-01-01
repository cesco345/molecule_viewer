// src/components/viewer/utils/shaders.ts

export const vertexShaderSource = `
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec3 instancePosition;
  attribute vec3 instanceColor;
  attribute float instanceRadius;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;

  void main() {
    vNormal = normal;
    vColor = instanceColor;
    
    // Scale and position the instance
    vec3 worldPosition = (position * instanceRadius) + instancePosition;
    vec4 mvPosition = modelViewMatrix * vec4(worldPosition, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShaderSource = `
  precision mediump float;
  
  varying vec3 vNormal;
  varying vec3 vColor;
  varying vec3 vPosition;

  void main() {
    // Light direction (static for now)
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    vec3 normal = normalize(vNormal);
    
    // Ambient light
    float ambientStrength = 0.3;
    vec3 ambient = ambientStrength * vColor;
    
    // Diffuse light
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * vColor;
    
    // Specular light
    float specularStrength = 0.5;
    vec3 viewDir = normalize(-vPosition); // We're in eye space, so camera is at (0,0,0)
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * vec3(1.0);
    
    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
  }
`;

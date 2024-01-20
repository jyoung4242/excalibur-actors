import { ScreenShader, PostProcessor, Shader, VertexLayout } from "excalibur";

export const starfieldVertex = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;

export const starfieldfragment = `#version 300 es
precision highp float;

out vec4 fragColor;
//in vec2 v_texcoord;
in vec2 v_uv;

uniform vec2 U_resolution;
uniform float U_time;


float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}
vec3 mod289(vec3 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 mod289(vec4 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 permute(vec4 x)
{
    return mod289((x * 34.0 + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - r * 0.85373472095314;
}

vec4 snoise(vec3 v)
{
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

    // First corner
    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v   - i + dot(i, vec3(C.x));

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + C.y;
    vec3 x3 = x0 - 0.5;

    // Permutations
    i = mod289(i); // Avoid truncation effects in permutation
    vec4 p =
      permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    vec4 j = p - 49.0 * floor(p / 49.0);  // mod(p,7*7)

    vec4 x_ = floor(j / 7.0);
    vec4 y_ = floor(j - 7.0 * x_); 

    vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);

    // Normalize gradients
    vec4 norm = taylorInvSqrt(vec4(dot(g0, g0), dot(g1, g1), dot(g2, g2), dot(g3, g3)));
    g0 *= norm.x;
    g1 *= norm.y;
    g2 *= norm.z;
    g3 *= norm.w;

    // Compute noise and gradient at P
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m3 = m2 * m;
    vec4 m4 = m2 * m2;
    vec3 grad =
      -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
      -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
      -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
      -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
    vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
    return 42.0 * vec4(grad, dot(m4, px));
}

vec3 hash3( vec3 p ) // replace this by something better
{
	p = vec3( dot(p,vec3(127.1,311.7, 74.7)),
            dot(p,vec3(269.5,183.3,246.1)),
            dot(p,vec3(113.5,271.9,124.6)));

	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

float noise( in vec3 p )
{
  vec3 i = floor( p );
  vec3 f = fract( p );
	
	vec3 u = f*f*(3.0-2.0*f);

  return mix( mix( mix( dot( hash3( i + vec3(0.0,0.0,0.0) ), f - vec3(0.0,0.0,0.0) ), 
                        dot( hash3( i + vec3(1.0,0.0,0.0) ), f - vec3(1.0,0.0,0.0) ), u.x),
                   mix( dot( hash3( i + vec3(0.0,1.0,0.0) ), f - vec3(0.0,1.0,0.0) ), 
                        dot( hash3( i + vec3(1.0,1.0,0.0) ), f - vec3(1.0,1.0,0.0) ), u.x), u.y),
              mix( mix( dot( hash3( i + vec3(0.0,0.0,1.0) ), f - vec3(0.0,0.0,1.0) ), 
                        dot( hash3( i + vec3(1.0,0.0,1.0) ), f - vec3(1.0,0.0,1.0) ), u.x),
                   mix( dot( hash3( i + vec3(0.0,1.0,1.0) ), f - vec3(0.0,1.0,1.0) ), 
                        dot( hash3( i + vec3(1.0,1.0,1.0) ), f - vec3(1.0,1.0,1.0) ), u.x), u.y), u.z );
}

float fbm(vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  float amplitude = 0.5;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < 10000; ++i) {
    float noiseValue = noise(p * frequency);
    total += noiseValue * amplitude;
    normalization += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
    if(i==(octaves-1)){
        break;
      }
  }

  total /= normalization;
  total = total * 0.5 + 0.5;
  total = pow(total, exponentiation);

  return total;
}

vec3 GenerateGridStars(vec2 pixelCoords, float starRadius, float cellWidth, float seed, bool twinkle){

   
    vec2 cellID = floor(pixelCoords/cellWidth)+seed/100.0;
    vec2 cellCoords = (fract(pixelCoords/cellWidth)-0.5)*cellWidth ;
   
    vec3 cellHashValue = hash3(vec3(cellID, 0.0));
    
    //float starBrightness = saturate(cellHashValue.z);
    float starBrightness = clamp(cellHashValue.z, 0.7, 1.0);

    vec2 starPosition = vec2(0.0);
    starPosition += cellHashValue.xy * (cellWidth * 0.5 - starRadius * 2.0);
    
    
    
    float distToStar = length(cellCoords- starPosition);
    
    //float glow = smoothstep(starRadius+1.0,starRadius, distToStar);
    float glow = exp(-8.0*distToStar/starRadius);
 
    if (twinkle) {
        float noiseSample = noise(vec3(cellID, U_time * 1.5));
        float twinkleSize = remap(noiseSample, -1.0,1.0, 1.0, 0.1) * starRadius * 1.75;
        vec2 absDist = abs(cellCoords - starPosition);
        float twinkleValue = smoothstep(starRadius * 0.25, 0.0, absDist.y) * smoothstep(twinkleSize , 0.0, absDist.x);
        twinkleValue += smoothstep(starRadius * 0.25, 0.0, absDist.x) * smoothstep(twinkleSize , 0.0, absDist.y);
        glow+=twinkleValue;
    }
    return vec3(glow*starBrightness);
}

vec3 GenerateStars(vec2 pixelCoords){
    vec2 offset = vec2(U_time*1.25,0);
    vec3 stars = vec3(0.0);
    float cellWidth = 600.0;
    float size = 6.0;
    vec2 truPixelPosition = pixelCoords + offset;
    truPixelPosition = mod(truPixelPosition, U_resolution);

    for(float i = 0.0; i < 2.0; i++){
        stars += GenerateGridStars(truPixelPosition, size, cellWidth, i, true);  
        size *= 0.6;
        cellWidth *= 0.45;
    }

    for(float i = 2.0; i < 5.0; i++){
        stars += GenerateGridStars(truPixelPosition, size, cellWidth, i, false);  
        size *= 0.6;
        cellWidth *= 0.45;
    }

    return stars;
}

void main() {
  vec2 pixelCoords = (v_uv - 0.5) * U_resolution;
  
  vec3 colour = vec3(0.0);
  colour = GenerateStars(pixelCoords);
  fragColor = vec4(pow(colour, vec3(1.0 / 2.2)), 1.0);
}

`;

export class starfieldPostProcessor implements PostProcessor {
  //@ts-ignore
  private _shader: ScreenShader;

  initialize(gl: WebGL2RenderingContext): void {
    this._shader = new ScreenShader(gl, starfieldfragment);
  }

  getShader(): Shader {
    return this._shader.getShader();
  }

  getLayout(): VertexLayout {
    return this._shader.getLayout();
  }
}

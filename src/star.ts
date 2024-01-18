export const starFrag = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform vec2 U_resolution;
uniform float U_time;
uniform vec3 U_color;
uniform bool U_highlight;
out vec4 fragColor;

vec3 mod289(vec3 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 mod289(vec4 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - r * 0.85373472095314;
}

vec4 permute(vec4 x)
{
    return mod289((x * 34.0 + 1.0) * x);
}


float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}


vec2 hash( vec2 p ) // replace this by something better
{
	p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
	return -1.0 + 2.0*fract(sin(p)*43758.5453123);
}

vec4 snoise(vec3 v)
{
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

    // First corner
    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v - i + dot(i, vec3(C.x));

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
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
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


float fbm(vec3 p, int octaves, float persistence, float lacunarity, float exponentiation) {
  float amplitude = 0.5;
  float frequency = 1.0;
  float total = 0.0;
  float normalization = 0.0;

  for (int i = 0; i < 1000; ++i) {
    float noiseValue = snoise(p * frequency).w;
    total += noiseValue * amplitude;
    total += sin(U_time)*.015;
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


float sdfCircle(vec2 p, float r) {
  return length(p) - r;
}


float map(vec3 pos) {
  return fbm(pos, 6, 0.5, 2.0, 4.0);
}

vec3 calcNormal(vec3 pos, vec3 n) {
  vec2 e = vec2(0.0001, 0.0);
  return normalize(
      n + -500.0 * vec3(
          map(pos + e.xyy) - map(pos - e.xyy),
          map(pos + e.yxy) - map(pos - e.yxy),
          map(pos + e.yyx) - map(pos - e.yyx)
      )
  );
}

float simpleLimbDarkening(float cosTheta)
{
	float ul = 0.45; //u lambda //.85
	float vl = 0.2; //v lambda  //.2
    
	float sundisk = cosTheta;
	float limbfilt = 1.0 - ul - vl + ul*cos(asin(sundisk)) + vl*pow(cos(asin(sundisk)),0.1);
    return limbfilt;
}

mat3 rotateY(float radians) {
  float s = sin(radians);
  float c = cos(radians);
  return mat3(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c);
}


vec3 drawStar(vec2 pixelCoords, vec3 colour, float starSize, float d){
  vec3 starColor = vec3(colour);
  float x = pixelCoords.x/starSize;
  float y = pixelCoords.y/starSize;
  float z = sqrt(1.0 - x * x - y * y);
  mat3 starRotation = rotateY(U_time * 0.25);

  vec3 viewNormal = vec3(x, y, z);
  vec3 wsPosition = starRotation * viewNormal;
  vec3 wsNormal = starRotation* normalize(wsPosition);
  vec3 noiseCoord = wsPosition * 2.0;
  float noiseSample = fbm(noiseCoord, 4, 0.5, 2.0, 4.0);// was 6 octaves
  starColor = vec3(noiseSample);
  float wrap = 0.05;
  
  //Colouring  
  vec3 primaryStarColor = mix(colour, clamp(colour * 1.75, 0.0, 1.0), smoothstep(0.01,0.2,noiseSample));
  vec3 darkenedColor =  mix( clamp(primaryStarColor * 0.9, 0.0, 1.0),clamp(primaryStarColor * 0.5, 0.0, 1.0),smoothstep(0.005,0.1,noiseSample));
   
  starColor = mix(darkenedColor, primaryStarColor, smoothstep(0.02, 0.03, noiseSample));

  //Lighting
  vec3 wsLightDir = normalize(vec3(0.5, 1.0, 0.5));
  vec3 wsSurfaceNormal = calcNormal(noiseCoord, wsNormal);
  float dp = max(
    0.0, (dot(wsLightDir, wsSurfaceNormal) + wrap) / (1.0 + wrap));

  //Darkening
  float sky = max(0.0, dot(vec2(x,y),vec2(x,y)));
  vec3 col = vec3(starColor);
  col = vec3(simpleLimbDarkening(sky));
  starColor *= col;

  colour = mix(colour, starColor, smoothstep(0.0, -1.0, d));
  return vec3(colour);
}



void main() {
  vec2 pixelCoords = (v_uv - 0.5) * U_resolution;
  float starSize = 100.0;
  float d = sdfCircle(pixelCoords,starSize);
  float distanceFalloff = 1.0/(d/350.0);
  distanceFalloff*=0.1;
  distanceFalloff = pow(distanceFalloff,0.8);
    
   if(d<=0.0){
    fragColor = vec4(drawStar(pixelCoords, U_color, starSize, d), step(0.0,-d-1.0));
   }else if(d <= starSize*3.0 && U_highlight)  {
     vec3 newCol = vec3(U_color)*distanceFalloff;
     //(0.6*distanceFalloff)
     fragColor = vec4(newCol,smoothstep(0.0,1.0, (0.6*distanceFalloff)));
     //gl_FragColor = vec4(newCol,smoothstep(0.0,1.0, (0.6*distanceFalloff)));
   }
}`;

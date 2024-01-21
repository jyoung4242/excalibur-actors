export const gridNebulaFrag = `#version 300 es
//#define GALAXY
precision highp float;
uniform sampler2D U_noise1;
uniform float U_time;
uniform vec2 U_resolution;
in vec2 v_uv;
out vec4 fragColor;

struct PointLight {
    vec2 pos;
    vec3 col;
    float intensity;
};

float palette( in float a, in float b, in float c, in float d, in float x ) {
    return a + b * cos(6.28318 * (c * x + d));
}
    
// 2D Noise from IQ
float Noise2D( in vec2 x )
{
    ivec2 p = ivec2(floor(x));
    vec2 f = fract(x);
	f = f*f*(3.0-2.0*f);
	ivec2 uv = p.xy;
   
	float rgA = texelFetch( U_noise1, (uv+ivec2(0,0))&255, 0 ).x;
    float rgB = texelFetch( U_noise1, (uv+ivec2(1,0))&255, 0 ).x;
    float rgC = texelFetch( U_noise1, (uv+ivec2(0,1))&255, 0 ).x;
    float rgD = texelFetch( U_noise1, (uv+ivec2(1,1))&255, 0 ).x;
    return mix( mix( rgA, rgB, f.x ),
                mix( rgC, rgD, f.x ), f.y );
}

float ComputeFBM( in vec2 pos )
{
    float amplitude = 0.75;
    float sum = 0.0;
    float maxAmp = 0.0;
    for(int i = 0; i < 6; ++i)
    {
        sum += Noise2D(pos) * amplitude;
        maxAmp += amplitude;
        amplitude *= 0.5;
        pos *= 2.2;
    }
    return sum / maxAmp;
}

// Same function but with a different, constant amount of octaves
float ComputeFBMStars( in vec2 pos )
{
    float amplitude = 0.75;
    float sum = 0.0;
    float maxAmp = 0.0;
    for(int i = 0; i < 5; ++i)
    {
        sum += Noise2D(pos) * amplitude;
        maxAmp += amplitude;
        amplitude *= 0.5;
        pos *= 2.0;
    }
    return sum / maxAmp * 1.15;
}

vec3 BackgroundColor( in vec2 uv ) {
    
    // Sample various noises and multiply them
    float noise1 = ComputeFBMStars(uv * 5.0);
    float noise2 = ComputeFBMStars(uv * vec2(15.125, 25.7));
    float noise3 = ComputeFBMStars((uv + vec2(0.5, 0.1)) * 4.0 + U_time * 0.35);
    float starShape = noise1 * noise2 * noise3;
    
    // Compute star falloff - not really doing what i hoped it would, i wanted smooth falloff around each star
    float falloffRadius = 0.2;
    float baseThreshold = 0.6; // higher = less stars
    
    starShape = clamp(starShape - baseThreshold + falloffRadius, 0.0, 1.0);
    //starShape = 0.002;
    float weight = starShape / (2.0 * falloffRadius);
    return weight * vec3(noise1 * 0.55, noise2 * 0.4, noise3 * 1.0) * 6.0; // artificial scale just makes the stars brighter
}


vec4 drawGrid(vec3 color, vec3 lineColor, float spacing, float width ){
    vec2 center = v_uv -0.5;
    vec2 cells = abs(fract(center* U_resolution/spacing)-0.5);
    float distToEdge = (0.5 - max(cells.x, cells.y))*spacing;
    float lines = smoothstep(0.0, width, distToEdge);
    

    //float dist = 1.0/(lines);
    //dist *= 1.5;
    //dist = pow(abs(sin(U_time*0.75)*dist), 0.8);
    //lineColor = dist*lineColor;

    float pFactor = abs(sin(U_time * 0.6));
    pFactor = pow(pFactor, 0.6) * 3.0;
    vec3 pLineColor = clamp(pFactor * lineColor, 0.8, 5.0);

    //vec3 rslt = mix(lineColor, color, lines);
    vec3 rslt = mix(pLineColor, color, lines);

    return vec4(rslt, 1.0);
}


void main(  )
{
	vec2 uv = v_uv;
    vec2 scrPt = uv * 2.0 - 1.0;
    
    vec4 finalColor;
    
    #ifdef GALAXY
    
    vec2 samplePt = scrPt;
    
    // Warp noise domain
    float swirlStrength = 2.5;
    float dist = length(samplePt);
    float theta = dist * swirlStrength - U_time * 0.225;
    mat2 rot;
    
    // cache calls to sin/cos
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    
    rot[0][0] = cosTheta;
    rot[0][1] = -sinTheta;
    rot[1][0] = sinTheta;
    rot[1][1] = cosTheta;
    
    samplePt *= rot;
    samplePt *= 3.0;
    
    float noiseVal = ComputeFBM(samplePt + sin(U_time * 0.03125));
    float maxIntensity = 1.65; // kinda is the galaxy radius/size?
    noiseVal *= clamp(pow(maxIntensity - dist, 5.0) * (1.0 / maxIntensity), 0.0, 1.0);
    
    // Lighting
    PointLight l1;
    l1.pos = vec2(0);
    l1.col = mix(vec3(0.75, 0.5, 0.3), vec3(0.55, 0.4, 0.95), clamp(dist * 0.5, 0.0, 1.0) + (sin(U_time * 0.5) * 0.5 + 0.5) * 0.5);
    l1.intensity = 4.0;
    
    vec3 l1Col = l1.col * l1.intensity * 1.0 / pow(length(l1.pos - samplePt), 0.5);
    //vec4 finalColor = vec4(BackgroundColor(fragCoord.xy * 0.25), 1.0);
    //vec4 finalColor = vec4(l1Col * noiseVal, 1.0);
    finalColor = vec4(mix(BackgroundColor(uv.xy * 0.125), l1Col * noiseVal, pow(noiseVal, 1.0)), 1.0);
    
    #else // Milky Way    
    
	// Define density for some shape representing the milky way galaxy
    
    float milkywayShape;
    
    // Distort input screen pos slightly so the galaxy isnt perfectly axis aligned
    float galaxyOffset = (cos(scrPt.x * 5.0) * sin(scrPt.x * 2.0) * 0.5 + 0.5) * 0.0;
    
    // Apply a slight rotation to the screen point, similar to the galaxy
    float theta = length(scrPt) * 0.25; // Visualy tweaked until it looked natural
    mat2 rot;
    
    // cache calls to sin/cos(theta)
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    
    rot[0][0] = cosTheta;
    rot[0][1] = -sinTheta;
    rot[1][0] = sinTheta;
    rot[1][1] = cosTheta;
    
    vec2 rotatedScrPt = scrPt * rot;
    
    float noiseVal = ComputeFBM(rotatedScrPt * 5.0 + 50.0 + U_time * 0.015625 * 1.5);
    
    rotatedScrPt += vec2(noiseVal) * 0.3;
    
    float centralFalloff = clamp(1.0 - length(scrPt.y + galaxyOffset), 0.0, 1.0);
    float xDirFalloff = (cos(scrPt.x * 2.0) * 0.5 + 0.5);
    
    float centralFalloff_rot = 1.0 - length(rotatedScrPt.y + galaxyOffset);
    float xDirFalloff_rot = (cos(rotatedScrPt.x * 2.0) * 0.5 + 0.5);
    
    // Falloff in y dir and x-dir fade
    float lowFreqNoiseForFalloff = ComputeFBM(rotatedScrPt * 4.0 - U_time * 0.015625 * 1.5); // 1/64
    //float lowFreqNoiseForFalloff_offset = ComputeFBM(rotatedScrPt * 1.5 + 0.005 * lowFreqNoiseForFalloff);
    milkywayShape = clamp(pow(centralFalloff_rot, 3.0) - lowFreqNoiseForFalloff * 0.5, 0.0, 1.0) * xDirFalloff_rot;
    
    // Lighting
    vec3 color;
    
    // desired brown color
    //vec3 brown = vec3(0.35, 0.175, 0.15) * 17.0;
    //vec3 mainColor = vec3(0.925, 1.0, 0.8) * 10.0;
    //color = mix(brown, mainColor, pow(milkywayShape, 1.0)) * 2.0 * milkywayShape;
    
    // Cosine-based pallette: http://dev.thi.ng/gradients/
    // there is also a famous IQ article on this and a less famous shader on my profile
    color.r = palette(0.5, -1.081592653589793, 0.798407346410207, 0.0, pow(milkywayShape, 1.0));
    color.g = palette(0.5, 0.658407346410207, 0.908407346410207, 0.268407346410207, pow(milkywayShape, 1.0));
    color.b = palette(0.5, -0.201592653589793, 0.318407346410207, -0.001592653589793, pow(milkywayShape, 1.0));
    
    /* dont do this
    color.r += 0.5 * palette(0.5, -0.481592653589793, 0.798407346410207, 0.0, pow(noiseVal, 1.0));
    color.g += 0.5 * palette(0.5, 0.428407346410207, 0.908407346410207, 0.268407346410207, pow(noiseVal, 0.5));
    color.b += 0.5 * palette(0.5, -0.001592653589793, 0.318407346410207, -0.001592653589793, pow(noiseVal, 1.0));
    */
    
    // Experimented with removing color, worked out decently
    float removeColor = (pow(milkywayShape, 10.0) + lowFreqNoiseForFalloff * 0.1) * 5.0;
    color -= vec3(removeColor);
    
    // Add some blue to the background
    vec3 backgroundCol = BackgroundColor(uv.xy * 0.125) * pow(centralFalloff, 0.5) * pow(xDirFalloff, 0.5);
    vec3 blueish = vec3(0.2, 0.2, 0.4);
    backgroundCol += blueish * (5.0 - milkywayShape) * pow(centralFalloff_rot, 2.0) * lowFreqNoiseForFalloff * pow(xDirFalloff, 0.75);
    
    vec3 whiteish = vec3(0.5, 1.0, 0.85);
    backgroundCol += whiteish * 0.95 * pow(centralFalloff, 1.5) * lowFreqNoiseForFalloff * pow(xDirFalloff, 2.0);
    
    
    finalColor = vec4(mix(backgroundCol, color, milkywayShape), 1);
    
    #endif
    finalColor = drawGrid(finalColor.rgb, vec3(0.96,0.96,0.96), 200.0, 3.0);
	fragColor = finalColor;
}`;

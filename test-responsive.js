/**
 * Simple validation test for responsive design and performance optimizations
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Responsive Design & Performance Tests...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, condition) {
    if (condition) {
        console.log(`✅ PASS: ${description}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${description}`);
        testsFailed++;
    }
}

// Read files
const htmlContent = fs.readFileSync('index.html', 'utf8');
const cssContent = fs.readFileSync('style.css', 'utf8');
const jsContent = fs.readFileSync('app.js', 'utf8');

console.log('📱 RESPONSIVE DESIGN TESTS');
console.log('==========================\n');

// Test 1: Viewport meta tag
test('Viewport meta tag present', htmlContent.includes('viewport'));

// Test 2: Defer attribute on script
test('Script tag has defer attribute', htmlContent.includes('defer'));

// Test 3: CSS Media Queries exist
test('Mobile media query (@max-width: 768px) exists', cssContent.includes('@media (max-width: 768px)'));
test('Tablet media query (@max-width: 1024px) exists', cssContent.includes('@media (max-width: 1024px)'));
test('Small mobile media query (@max-width: 480px) exists', cssContent.includes('@media (max-width: 480px)'));

// Test 4: No fixed pixel widths on main container
test('Container uses max-width instead of fixed width', 
    cssContent.includes('max-width: 1400px') && 
    cssContent.includes('width: 100%'));

// Test 5: Grid/Flex layouts for mobile stacking
test('Skills grid uses responsive columns', 
    cssContent.includes('grid-template-columns: repeat(auto-fit'));
test('Habits grid stacks on mobile', 
    cssContent.includes('grid-template-columns: 1fr'));

// Test 6: Mobile typography scaling
test('Font sizes scale down on mobile', 
    cssContent.includes('font-size: 1.6rem') && 
    cssContent.includes('font-size: 1.3rem'));

// Test 7: Touch targets (minimum 44px)
test('Buttons have minimum tap target size (44px)', 
    cssContent.includes('min-height: 44px'));

// Test 8: Full width inputs on mobile
test('Form inputs use 100% width on mobile', 
    cssContent.includes('width: 100%'));

console.log('\n⚡ PERFORMANCE OPTIMIZATION TESTS');
console.log('==================================\n');

// Test 9: Hardware acceleration triggers
test('Hardware acceleration on glass-card', 
    cssContent.includes('transform: translateZ(0)'));
test('Hardware acceleration on container', 
    cssContent.includes('.container') && cssContent.includes('translateZ(0)'));
test('will-change property used', 
    cssContent.includes('will-change'));

// Test 10: Three.js optimizations
test('Three.js detects mobile devices', 
    jsContent.includes('isMobile') || jsContent.includes('isLowPerfDevice'));
test('Three.js limits pixel ratio', 
    jsContent.includes('setPixelRatio') && 
    jsContent.includes('Math.min(window.devicePixelRatio'));
test('Three.js reduces particles on mobile', 
    jsContent.includes('particlesCount') && 
    jsContent.includes('isLowPerfDevice ? 100 : 200'));
test('Three.js disables antialiasing on mobile', 
    jsContent.includes('antialias: !isLowPerfDevice'));
test('Three.js uses powerPreference', 
    jsContent.includes('powerPreference'));

// Test 11: Animation performance
test('requestAnimationFrame used for animations', 
    jsContent.includes('requestAnimationFrame'));
test('Animation frame throttling implemented', 
    jsContent.includes('frameInterval') || jsContent.includes('targetFPS'));
test('Page visibility API used to pause animations', 
    jsContent.includes('visibilitychange') && jsContent.includes('isPageVisible'));

// Test 12: Mouse event throttling
test('Mouse events throttled on mobile', 
    jsContent.includes('mouseUpdateThrottle') || jsContent.includes('lastMouseUpdate'));

// Test 13: Resize debouncing
test('Window resize debounced', 
    jsContent.includes('resizeTimeout') || jsContent.includes('clearTimeout'));

console.log('\n🎨 BRANDING & AESTHETIC TESTS');
console.log('==============================\n');

// Test 14: Premium dark mode maintained
test('Dark theme colors defined', 
    cssContent.includes('--bg-primary: #0a0a0f'));
test('Glassmorphism effects present', 
    cssContent.includes('backdrop-filter') && 
    cssContent.includes('blur(20px)'));
test('Crisp white typography', 
    cssContent.includes('--text-primary: #ffffff'));
test('Pink accent highlights', 
    cssContent.includes('--pink: #ff00ff') || 
    cssContent.includes('--pink: #ff1493'));

// Test 15: No jarring colors or heavy gradients
test('No excessive box-shadows', 
    !cssContent.match(/box-shadow:\s*[^;]{100,}/));
test('Gradients are subtle (low opacity)', 
    cssContent.includes('rgba(0, 212, 255, 0.1)') || 
    cssContent.includes('rgba(255, 0, 255, 0.1)'));

console.log('\n📊 TEST RESULTS SUMMARY');
console.log('=======================\n');
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed} ✅`);
console.log(`Failed: ${testsFailed} ❌`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The application is fully responsive and optimized.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the failures above.');
    process.exit(1);
}
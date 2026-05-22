/**
 * 🎯 Automated Visual Difference & Parity Checker
 *
 * Scans the cross-platform ecosystem (Web Tailwind theme config, desktop config, and React Native screen files)
 * and audits them against the central @chatty/shared-core Design Tokens.
 *
 * Run using: node visual-diff-checker.js
 */

const fs = require('fs');
const path = require('path');

// Colors extracted from our compiled shared-core Design Tokens
const CentralTokens = {
  colors: {
    primary: '#00A884',
    primaryDark: '#005C4B',
    background: '#111B21',
    sidebar: '#0B141A',
    header: '#202D35',
    input: '#2A3942',
    border: '#222E35',
    sentBubble: '#005C4B',
    receivedBubble: '#1F2C34',
    textMain: '#E9EDEF',
    textMuted: '#8696A0',
    textLight: '#E9EDEF',
    activeBadge: '#00A884',
    error: '#F87171',
    success: '#4ADE80',
    online: '#00A884',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    bubble: 16,
    avatar: 9999,
  }
};

const WebTailwindPath = path.normalize('d:/Code/Realtime-chat-App-main/frontend/tailwind.config.js');
const DesktopTailwindPath = path.normalize('d:/Code/Realtime-chat-App-main/native-apps/desktop-electron/tailwind.config.js');
const MobileScreensDir = path.normalize('d:/Code/Realtime-chat-App-main/native-apps/mobile-react-native/src/screens');

let issuesFound = 0;

function logSection(title) {
  console.log(`\n======================================================================`);
  console.log(`🔍 AUDITING: ${title}`);
  console.log(`======================================================================`);
}

function auditTailwindConfig(configPath, platformName) {
  try {
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️  Configuration not found at: ${configPath}`);
      return;
    }
    const content = fs.readFileSync(configPath, 'utf8');

    // Basic regex audit of the whatsapp custom theme
    const whatsappThemeMatch = content.match(/whatsapp\s*:\s*\{([^}]+)\}/);
    if (!whatsappThemeMatch) {
      console.error(`❌ ${platformName} config lacks 'whatsapp' theme configurations!`);
      issuesFound++;
      return;
    }

    const themeBlock = whatsappThemeMatch[1];
    
    // Check key colors
    const keyColorsToCheck = {
      primary: CentralTokens.colors.primary,
      "base-100": CentralTokens.colors.background,
      "base-200": "#202C33", // Secondary background / AppLayout
      "base-300": CentralTokens.colors.input,
      "base-content": CentralTokens.colors.textMain,
    };

    console.log(`✔ Checking ${platformName} custom Tailwind theme alignment...`);
    for (const [key, expectedHex] of Object.entries(keyColorsToCheck)) {
      const regex = new RegExp(`"?${key}"?\\s*:\\s*"([^"]+)"`);
      const match = themeBlock.match(regex);
      if (match) {
        const hex = match[1].toLowerCase();
        if (hex !== expectedHex.toLowerCase()) {
          console.warn(`  ❌ Mismatch for '${key}'! Expected '${expectedHex}', found '${hex}'`);
          issuesFound++;
        } else {
          console.log(`  ✔ [Parity] '${key}' matches '${expectedHex}'`);
        }
      } else {
        console.warn(`  ❌ Missing key '${key}' in theme config!`);
        issuesFound++;
      }
    }
  } catch (e) {
    console.error(`Error auditing Tailwind config ${configPath}:`, e.message);
  }
}

function auditMobileScreens(screensDir) {
  try {
    if (!fs.existsSync(screensDir)) {
      console.warn(`⚠️  Mobile screens directory not found at: ${screensDir}`);
      return;
    }

    const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx'));
    console.log(`✔ Auditing ${files.length} React Native mobile screens for design tokens compliance...`);

    files.forEach(file => {
      const filePath = path.join(screensDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for hardcoded colors that should be drawing from theme
      const hardcodedColors = [
        '#00A884', '#005C4B', '#111B21', '#0B141A', '#202D35', '#2A3942', '#222E35', '#1F2C34', '#E9EDEF', '#8696A0'
      ];

      hardcodedColors.forEach(color => {
        // Look for hardcoded color values inside style sheets or layouts, ignoring single/double-line comment lines
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
          if (line.includes(color) || line.includes(color.toLowerCase())) {
            console.warn(`  ❌ [Hardcoded Style] ${file}:${index + 1} - Found hardcoded color '${color}'. Use 'theme.colors' tokens instead.`);
            issuesFound++;
          }
        });
      });

      // Check import of theme
      if (!content.includes("from '@chatty/shared-core'") && !content.includes("theme.colors")) {
        console.warn(`  ⚠️  ${file} does not import or consume '@chatty/shared-core' design tokens!`);
        issuesFound++;
      }
    });
  } catch (e) {
    console.error(`Error auditing mobile screens:`, e.message);
  }
}

// Execute Audit
logSection("Web Frontend Tailwind Config Parity");
auditTailwindConfig(WebTailwindPath, "Web Frontend");

logSection("Desktop Electron Tailwind Config Parity");
auditTailwindConfig(DesktopTailwindPath, "Desktop Electron");

logSection("React Native Mobile Screen Style Sheets Parity");
auditMobileScreens(MobileScreensDir);

console.log(`\n======================================================================`);
console.log(`📊 AUDIT COMPLETED. Issues/Discrepancies found: ${issuesFound}`);
console.log(`======================================================================`);
if (issuesFound === 0) {
  console.log(`✨ 100% PERFECT ECOSYSTEM DESIGN SYSTEM PARITY VALIDATED!`);
} else {
  console.log(`⚠️  Parity discrepancies detected. Please resolve them to ensure visual visual-alignment.`);
}

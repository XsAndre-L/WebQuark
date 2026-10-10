/**
 * @fileoverview Script to align and format all component region headers to a single line.
 * Automatically scans all .tsx files, parses and sorts class members into their correct
 * categories ([1] API to [6] Render) while preserving decorators, and inserts consistent-width
 * single-line dividers.
 *
 * This acts as an automated visual organizer for ADHD accessibility, allowing developers
 * to write members in any order, and automatically formatting/sorting them safely.
 *
 * Runs natively with Bun.
 */

import * as fs from 'fs';
import * as path from 'path';

const TARGET_DIR = path.join(__dirname, '../src/browser');

// Regex to match existing dividers (to strip them before re-sorting)
const regexDivider = /^[ \t]*\/\/ =+[ \t]*$/;
const regexHeaderComment3Line = /^[ \t]*\/\/ (?:PURE UTILITY HELPERS|\[\d\]|RENDER).*$/;
const regexSingleLineDivider = /^[ \t]*\/\/ =+ (?:PURE UTILITY HELPERS|\[\d\]|RENDER).* =+[ \t]*$/;

// Find all .tsx files recursively
function getTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function formatHeader(text: string, width: number): string {
  const cleanText = text.trim();
  const prefix = '// ';
  const spacing = 2; // space on left and right of text
  const totalEquals = width - prefix.length - spacing - cleanText.length;
  
  if (totalEquals <= 0) {
    return `${prefix}=== ${cleanText} ===`;
  }
  
  const leftEquals = Math.floor(totalEquals / 2);
  const rightEquals = totalEquals - leftEquals;
  
  return `${prefix}${'='.repeat(leftEquals)} ${cleanText} ${'='.repeat(rightEquals)}`;
}

interface Member {
  lines: string[];
  category: number;
}

const SECTION_HEADERS: Record<number, string> = {
  1: '[1] STENCIL API (Props, Events, AttachInternals, Elements)',
  2: '[2] INTERNAL STATE & REFS',
  3: '[3] LIFECYCLE & WATCHERS',
  4: '[4] EXPOSED METHODS',
  5: '[5] EVENT HANDLERS & INTERNAL METHODS',
  6: '[6] RENDER (Visual Template Only)'
};

function parseAndSortClass(content: string, targetWidth: number): string {
  const lines = content.split(/\r?\n/);
  const classStartIdx = lines.findIndex(l => /export class \w+ \{/.test(l));
  if (classStartIdx === -1) {
    return content;
  }

  // Find the closing brace of the class
  let classEndIdx = -1;
  let braceCount = 0;
  for (let i = classStartIdx; i < lines.length; i++) {
    const line = lines[i];
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    
    if (i === classStartIdx) {
      braceCount = 1; // start of class export class X { has one open brace
    } else {
      braceCount += openBraces - closeBraces;
    }
    
    if (braceCount === 0) {
      classEndIdx = i;
      break;
    }
  }

  if (classEndIdx === -1) {
    return content;
  }

  // Get class indentation (default 2 spaces)
  const firstMemberLine = lines[classStartIdx + 1];
  const indentMatch = firstMemberLine ? firstMemberLine.match(/^([ \t]+)/) : null;
  const indent = indentMatch ? indentMatch[1] : '  ';

  // Parse lines inside the class body, stripping out old dividers
  const bodyLines: string[] = [];
  for (let i = classStartIdx + 1; i < classEndIdx; i++) {
    const line = lines[i];

    // Skip old divider comments
    if (regexDivider.test(line) || regexHeaderComment3Line.test(line) || regexSingleLineDivider.test(line)) {
      continue;
    }
    bodyLines.push(line);
  }

  // Group body lines into discrete member blocks, preserving decorators correctly
  const members: Member[] = [];
  let preMemberLines: string[] = [];
  let currentMemberLines: string[] = [];
  let blockBraceCount = 0;
  let inMember = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      if (inMember) {
        currentMemberLines.push(line);
      } else {
        preMemberLines.push(line);
      }
      continue;
    }

    if (blockBraceCount > 0) {
      // Inside a method/nested braces, just accumulate
      currentMemberLines.push(line);
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      blockBraceCount += openBraces - closeBraces;
      
      if (blockBraceCount === 0) {
        // Finished the method block!
        members.push(createMember(currentMemberLines));
        currentMemberLines = [];
        inMember = false;
      }
      continue;
    }

    // We are at the base indentation level (blockBraceCount === 0)
    const isDecorator = trimmed.startsWith('@');
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('/*');
    
    // Declaration matches public/private modifiers, async keywords, constructors, methods, or property definitions
    const isDeclaration = (
      line.startsWith(indent + 'private ') ||
      line.startsWith(indent + 'public ') ||
      line.startsWith(indent + 'async ') ||
      line.startsWith(indent + 'constructor') ||
      /^[ \t]+[a-zA-Z0-9_]+\(/.test(line) ||
      /^[ \t]+[a-zA-Z0-9_]+\s*(!|\?|:|=)/.test(line)
    );

    if (isComment || isDecorator) {
      preMemberLines.push(line);
    } else if (isDeclaration) {
      // Start a member with all preceding decorators and comments
      currentMemberLines = [...preMemberLines, line];
      preMemberLines = [];
      inMember = true;
      
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      blockBraceCount = openBraces - closeBraces;
      
      if (blockBraceCount === 0) {
        // It's a single-line property declaration or expression
        members.push(createMember(currentMemberLines));
        currentMemberLines = [];
        inMember = false;
      }
    } else {
      // Some other line (e.g. static block or initializer), just group as preMemberLines for now
      preMemberLines.push(line);
    }
  }

  // Push any trailing member that was not finished
  if (currentMemberLines.length > 0) {
    members.push(createMember(currentMemberLines));
  }

  // Group members by category
  const categories: Record<number, Member[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  
  for (const member of members) {
    categories[member.category].push(member);
  }

  // Re-assemble the class body
  const newBodyLines: string[] = [];
  
  for (let cat = 1; cat <= 6; cat++) {
    const catMembers = categories[cat];
    if (catMembers.length === 0) continue;

    // Add section header
    const headerText = SECTION_HEADERS[cat];
    const divider = `${indent}${formatHeader(headerText, targetWidth)}`;
    
    if (newBodyLines.length > 0) {
      newBodyLines.push(''); // spacing line between sections
    }
    newBodyLines.push(divider);

    // Add members of this section
    for (const member of catMembers) {
      const formattedLines = member.lines.map(l => l.trim() === '' ? '' : l);
      newBodyLines.push(...formattedLines);
    }
  }

  // Build the complete file content
  const headerPart = lines.slice(0, classStartIdx + 1).join('\n');
  const footerPart = lines.slice(classEndIdx).join('\n');
  
  // Format body lines to ensure clean vertical spacing (no double empty lines)
  const cleanedBody: string[] = [];
  let prevWasEmpty = true; // start with true to avoid leading empty line inside class
  
  for (const line of newBodyLines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && prevWasEmpty) {
      continue;
    }
    cleanedBody.push(line);
    prevWasEmpty = isEmpty;
  }

  // Ensure there's a spacing line at the end before the closing class brace
  if (cleanedBody.length > 0 && cleanedBody[cleanedBody.length - 1].trim() !== '') {
    cleanedBody.push('');
  }

  return `${headerPart}\n${cleanedBody.join('\n')}${footerPart}`;
}

function createMember(memberLines: string[]): Member {
  const code = memberLines.join('\n');
  let category = 5; // default: internal methods & handlers

  if (code.includes('@Prop') || code.includes('@Event') || code.includes('@Element') || code.includes('@AttachInternals')) {
    category = 1;
  } else if (code.includes('@State')) {
    category = 2;
  } else if (code.includes('@Watch') || 
             code.includes('componentWillLoad') || 
             code.includes('componentDidLoad') || 
             code.includes('componentWillUpdate') || 
             code.includes('componentDidUpdate') || 
             code.includes('connectedCallback') || 
             code.includes('disconnectedCallback') || 
             code.includes('formResetCallback')) {
    category = 3;
  } else if (code.includes('@Method')) {
    category = 4;
  } else if (code.includes('render(') || code.includes('render()')) {
    category = 6;
  } else {
    // Determine if it is a method or a property variable
    const isMethod = code.includes('(') && (code.includes('{') || code.includes('=>'));
    if (!isMethod) {
      category = 2; // undecorated class properties belong in State & Refs
    }
  }

  return {
    lines: memberLines,
    category
  };
}

function main() {
  const files = getTsxFiles(TARGET_DIR);
  console.log(`Found ${files.length} TSX files.`);

  // Longest header text from default list
  const longestHeader = '[1] STENCIL API (Props, Events, AttachInternals, Elements)';
  const targetWidth = Math.max(80, longestHeader.length + 12);
  console.log(`Target divider width configured to: ${targetWidth} characters`);

  let modifiedCount = 0;

  for (const file of files) {
    const originalContent = fs.readFileSync(file, 'utf8');
    
    // Parse, sort class members, and generate dividers
    const content = parseAndSortClass(originalContent, targetWidth);

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Sorted & Aligned: ${path.relative(TARGET_DIR, file)}`);
      modifiedCount++;
    }
  }

  console.log(`Successfully organized and aligned headers in ${modifiedCount} files.`);
}

main();

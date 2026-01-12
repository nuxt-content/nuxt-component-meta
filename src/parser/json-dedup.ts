/**
 * JSON Deduplication - Single File TypeScript Implementation
 * Deduplicates JSON by extracting duplicate objects/arrays into const variables
 */

// ============================================================================
// TYPES
// ============================================================================

interface HashEntry {
  value: any;
  count: number;
  locations: Array<Array<string | number>>;
  dependencies: Set<string>;
  refName: string | null;
}

// ============================================================================
// HASHER - Compute stable hashes for deduplication
// ============================================================================

function fnv1aHash(str: string): string {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function computeHash(value: any): string {
  const type = typeof value;

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (type === 'boolean') return `bool:${value}`;
  if (type === 'number') return `num:${value}`;
  if (type === 'string') return `str:${fnv1aHash(value)}`;

  if (Array.isArray(value)) {
    const elemHashes = value.map(item => computeHash(item));
    return `arr:[${elemHashes.join(',')}]`;
  }

  if (type === 'object') {
    const keys = Object.keys(value).sort();
    const pairs = keys.map(key => `${key}:${computeHash(value[key])}`);
    return `obj:{${pairs.join(',')}}`;
  }

  throw new Error(`Cannot hash type: ${type}`);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;

  if (isArrayA) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  const keysSetB = new Set(keysB);
  for (const key of keysA) {
    if (!keysSetB.has(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

// ============================================================================
// TRAVERSER - Traverse JSON and build hash registry
// ============================================================================

function traverse(rootValue: any): {
  hashRegistry: Map<string, HashEntry>;
  valueToHash: WeakMap<any, string>;
} {
  const hashRegistry = new Map<string, HashEntry>();
  const visited = new WeakMap<any, boolean>();
  const valueToHash = new WeakMap<any, string>();

  function visit(value: any, path: Array<string | number>): void {
    if (value === null || typeof value !== 'object') {
      return;
    }

    if (visited.has(value)) {
      return; // Circular reference
    }
    visited.set(value, true);

    const hash = computeHash(value);

    if (!hashRegistry.has(hash)) {
      hashRegistry.set(hash, {
        value,
        count: 0,
        locations: [],
        dependencies: new Set(),
        refName: null
      });
    }

    const entry = hashRegistry.get(hash)!;

    // Check for hash collision
    if (!deepEqual(entry.value, value)) {
      let collisionIndex = 1;
      let newHash = `${hash}_c${collisionIndex}`;
      while (hashRegistry.has(newHash) && !deepEqual(hashRegistry.get(newHash)!.value, value)) {
        collisionIndex++;
        newHash = `${hash}_c${collisionIndex}`;
      }

      if (!hashRegistry.has(newHash)) {
        hashRegistry.set(newHash, {
          value,
          count: 0,
          locations: [],
          dependencies: new Set(),
          refName: null
        });
      }

      const collisionEntry = hashRegistry.get(newHash)!;
      collisionEntry.count++;
      collisionEntry.locations.push([...path]);
      valueToHash.set(value, newHash);
    } else {
      entry.count++;
      entry.locations.push([...path]);
      valueToHash.set(value, hash);
    }

    // Recurse
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        visit(item, [...path, index]);
      });
    } else {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          visit(value[key], [...path, key]);
        }
      }
    }
  }

  visit(rootValue, []);
  return { hashRegistry, valueToHash };
}

function analyzeDependencies(
  hashRegistry: Map<string, HashEntry>,
  valueToHash: WeakMap<any, string>
): void {
  for (const [hash, entry] of hashRegistry.entries()) {
    if (entry.count < 2) continue;

    const containedHashes = new Set<string>();

    function findContained(value: any): void {
      if (value === null || typeof value !== 'object') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== null && typeof item === 'object') {
            const itemHash = valueToHash.get(item);
            if (itemHash) {
              containedHashes.add(itemHash);
            }
            findContained(item);
          }
        });
      } else {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const child = value[key];
            if (child !== null && typeof child === 'object') {
              const childHash = valueToHash.get(child);
              if (childHash) {
                containedHashes.add(childHash);
              }
              findContained(child);
            }
          }
        }
      }
    }

    findContained(entry.value);

    for (const containedHash of containedHashes) {
      if (containedHash === hash) continue;
      const containedEntry = hashRegistry.get(containedHash);
      if (containedEntry && containedEntry.count >= 2) {
        entry.dependencies.add(containedHash);
      }
    }
  }
}

// ============================================================================
// DEPENDENCY RESOLVER - Topological sort
// ============================================================================

function topologicalSort(hashRegistry: Map<string, HashEntry>): Array<[string, HashEntry]> {
  const duplicates = Array.from(hashRegistry.entries())
    .filter(([_, entry]) => entry.count >= 2);

  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const [hash, _] of duplicates) {
    graph.set(hash, []);
    inDegree.set(hash, 0);
  }

  for (const [hash, entry] of duplicates) {
    for (const depHash of entry.dependencies) {
      if (inDegree.has(depHash)) {
        graph.get(depHash)!.push(hash);
        inDegree.set(hash, inDegree.get(hash)! + 1);
      }
    }
  }

  const queue: string[] = [];
  const result: Array<[string, HashEntry]> = [];

  for (const [hash, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(hash);
    }
  }

  while (queue.length > 0) {
    const hash = queue.shift()!;
    const entry = hashRegistry.get(hash)!;
    result.push([hash, entry]);

    for (const dependent of graph.get(hash)!) {
      inDegree.set(dependent, inDegree.get(dependent)! - 1);
      if (inDegree.get(dependent) === 0) {
        queue.push(dependent);
      }
    }
  }

  if (result.length !== duplicates.length) {
    console.warn('Circular dependency detected, using fallback ordering');
    return duplicates;
  }

  return result;
}

function _deepMatchPattern(value: any, pattern: any): boolean {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value) !== Array.isArray(pattern)) return false;

  const patternKeys = Object.keys(pattern);
  if (Object.keys(value).length !== patternKeys.length) return false;

  for (const key of patternKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return false;

    const valueItem = value[key];
    const patternItem = pattern[key];

    if (typeof patternItem === 'object' && patternItem !== null) {
      if (!_deepMatchPattern(valueItem, patternItem)) return false;
    } else if (valueItem !== patternItem) {
      return false;
    }
  }

  return true;
}

function assignRefNames(sortedDuplicates: Array<[string, HashEntry]>): void {
  const usedNames = new Set<string>();
  let refCounter = 0;

  const semanticPatterns = [
    { test: (v: any) => Array.isArray(v) && v.length === 0, name: '_emptyArray' },
    { test: (v: any) => !Array.isArray(v) && Object.keys(v).length === 0, name: '_emptyObject' },
  ];

  for (const [_, entry] of sortedDuplicates) {
    let refName: string | null = null;

    for (const pattern of semanticPatterns) {
      if (pattern.test(entry.value) && !usedNames.has(pattern.name)) {
        refName = pattern.name;
        break;
      }
    }

    if (!refName) {
      refName = `_ref${refCounter}`;
      refCounter++;
    }

    while (usedNames.has(refName)) {
      refName = `_ref${refCounter}`;
      refCounter++;
    }

    usedNames.add(refName);
    entry.refName = refName;
  }
}

// ============================================================================
// CODE GENERATOR - Generate ES6 module code
// ============================================================================

const serializingValues = new WeakSet<any>();

function serializeValue(
  value: any,
  valueToHash: WeakMap<any, string>,
  hashRegistry: Map<string, HashEntry>
): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;
  if (type === 'boolean' || type === 'number') {
    return String(value);
  }
  if (type === 'string') {
    return JSON.stringify(value);
  }

  if (type === 'object') {
    const hash = valueToHash.get(value);

    if (hash && hashRegistry.has(hash)) {
      const entry = hashRegistry.get(hash)!;
      if (entry.refName && entry.count >= 2) {
        if (!serializingValues.has(value)) {
          return entry.refName;
        }
      }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      const elements = value.map(item => serializeValue(item, valueToHash, hashRegistry));
      return '[' + elements.join(', ') + ']';
    } else {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return '{}';
      }

      const pairs = keys.map(key => {
        const serializedValue = serializeValue(value[key], valueToHash, hashRegistry);
        const serializedKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
        return `${serializedKey}: ${serializedValue}`;
      });

      return '{' + pairs.join(', ') + '}';
    }
  }

  throw new Error(`Cannot serialize type: ${type}`);
}

function generateCode(
  rootValue: any,
  valueToHash: WeakMap<any, string>,
  hashRegistry: Map<string, HashEntry>,
  sortedDuplicates: Array<[string, HashEntry]>
): string {
  const lines: string[] = [];

  lines.push('// Auto-generated deduplicated module');
  lines.push('// Original values extracted into const declarations to reduce duplication');
  lines.push('');

  for (const [_, entry] of sortedDuplicates) {
    serializingValues.add(entry.value);
    const code = serializeValue(entry.value, valueToHash, hashRegistry);
    serializingValues.delete(entry.value);
    lines.push(`const ${entry.refName} = ${code};`);
  }

  if (sortedDuplicates.length > 0) {
    lines.push('');
  }

  const rootCode = serializeValue(rootValue, valueToHash, hashRegistry);
  lines.push(`export default ${rootCode};`);

  return lines.join('\n');
}

// ============================================================================
// MAIN FUNCTION - Public API
// ============================================================================

/**
 * Deduplicate JSON string by extracting duplicate objects/arrays into const variables
 * @param jsonString - JSON string or JavaScript object (will be parsed if string)
 * @returns Deduplicated ES6 module code as string
 */
export function deduplicateJSON(jsonString: string | object): string {
  // Parse input
  let rootValue: any;
  if (typeof jsonString === 'string') {
    try {
      rootValue = JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON: ${(error as Error).message}`);
    }
  } else {
    rootValue = jsonString;
  }

  // Traverse and build hash registry
  const { hashRegistry, valueToHash } = traverse(rootValue);

  // Analyze dependencies
  analyzeDependencies(hashRegistry, valueToHash);

  // Topological sort and assign names
  const sortedDuplicates = topologicalSort(hashRegistry);
  assignRefNames(sortedDuplicates);

  // Generate code
  const code = generateCode(rootValue, valueToHash, hashRegistry, sortedDuplicates);

  return code;
}

/**
 * Get deduplication statistics
 * @param jsonString - JSON string or JavaScript object
 * @returns Statistics about deduplication potential
 */
export function getDeduplicationStats(jsonString: string | object): {
  uniqueValues: number;
  deduplicatedValues: number;
  totalOccurrences: number;
  estimatedSavings: string;
} {
  let rootValue: any;
  if (typeof jsonString === 'string') {
    rootValue = JSON.parse(jsonString);
  } else {
    rootValue = jsonString;
  }

  const { hashRegistry } = traverse(rootValue);

  const duplicates = Array.from(hashRegistry.values()).filter(entry => entry.count >= 2);
  const totalOccurrences = duplicates.reduce((sum, entry) => sum + entry.count, 0);

  return {
    uniqueValues: hashRegistry.size,
    deduplicatedValues: duplicates.length,
    totalOccurrences,
    estimatedSavings: `${duplicates.length} variables, ${totalOccurrences} references`
  };
}

// ============================================================================
// EXAMPLE USAGE (commented out, for reference)
// ============================================================================

/*
// Example 1: Simple usage
const json = {
  items: [
    { id: 1, tags: [], meta: { enabled: true } },
    { id: 2, tags: [], meta: { enabled: true } },
    { id: 3, tags: [], meta: { enabled: false } }
  ]
};

const dedupCode = deduplicateJSON(json);
console.log(dedupCode);

// Example 2: From JSON string
const jsonString = JSON.stringify(json);
const dedupCode2 = deduplicateJSON(jsonString);

// Example 3: Get stats
const stats = getDeduplicationStats(json);
console.log(stats);
*/

/**
 * JSON Deduplication with String Array Optimization
 * Stores frequently-used strings in a separate array
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

interface StringEntry {
  value: string;
  count: number;
  index: number | null;
}

// ============================================================================
// HASHER
// ============================================================================

function fnv1aHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

// Cache for hash computations
const hashCache = new WeakMap<any, string>();

function computeHash(value: any): string {
  const type = typeof value;

  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (type === 'boolean') return `bool:${value}`;
  if (type === 'number') return `num:${value}`;
  if (type === 'string') return `str:${fnv1aHash(value)}`;

  // Check cache for objects/arrays
  if (type === 'object') {
    const cached = hashCache.get(value);
    if (cached) return cached;
  }

  let hash: string;

  if (Array.isArray(value)) {
    const elemHashes: string[] = [];
    for (let i = 0; i < value.length; i++) {
      elemHashes.push(computeHash(value[i]));
    }
    hash = `arr:[${elemHashes.join(',')}]`;
  } else {
    const keys = Object.keys(value).sort();
    const pairs: string[] = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      pairs.push(`${key}:${computeHash(value[key])}`);
    }
    hash = `obj:{${pairs.join(',')}}`;
  }

  hashCache.set(value, hash);
  return hash;
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
// TRAVERSER - Collect strings and objects/arrays
// ============================================================================

function traverse(rootValue: any): {
  hashRegistry: Map<string, HashEntry>;
  valueToHash: WeakMap<any, string>;
  stringRegistry: Map<string, StringEntry>;
} {
  const hashRegistry = new Map<string, HashEntry>();
  const visited = new WeakMap<any, boolean>();
  const valueToHash = new WeakMap<any, string>();
  const stringRegistry = new Map<string, StringEntry>();

  function visit(value: any, path: Array<string | number>): void {
    // Track strings
    if (typeof value === 'string') {
      if (!stringRegistry.has(value)) {
        stringRegistry.set(value, { value, count: 0, index: null });
      }
      stringRegistry.get(value)!.count++;
      return;
    }

    if (value === null || typeof value !== 'object') {
      return;
    }

    if (visited.has(value)) {
      return;
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
  return { hashRegistry, valueToHash, stringRegistry };
}

function analyzeDependencies(
  hashRegistry: Map<string, HashEntry>,
  valueToHash: WeakMap<any, string>
): void {
  for (const [hash, entry] of hashRegistry.entries()) {
    if (entry.count < 3) continue;

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
      if (containedEntry && containedEntry.count >= 3) {
        entry.dependencies.add(containedHash);
      }
    }
  }
}

// ============================================================================
// DEPENDENCY RESOLVER
// ============================================================================

function topologicalSort(hashRegistry: Map<string, HashEntry>): Array<[string, HashEntry]> {
  const duplicates = Array.from(hashRegistry.entries())
    .filter(([_, entry]) => entry.count >= 3);

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
    return duplicates;
  }

  return result;
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
// CODE GENERATOR with String Array
// ============================================================================

const serializingValues = new WeakSet<any>();

function serializeValue(
  value: any,
  valueToHash: WeakMap<any, string>,
  hashRegistry: Map<string, HashEntry>,
  stringRegistry: Map<string, StringEntry>
): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;
  if (type === 'boolean' || type === 'number') {
    return String(value);
  }

  if (type === 'string') {
    const stringEntry = stringRegistry.get(value);
    if (stringEntry && stringEntry.index !== null && stringEntry.count >= 3) {
      // Use string array reference
      return `_s[${stringEntry.index}]`;
    }
    return JSON.stringify(value);
  }

  if (type === 'object') {
    const hash = valueToHash.get(value);

    if (hash && hashRegistry.has(hash)) {
      const entry = hashRegistry.get(hash)!;
      if (entry.refName && entry.count >= 3) {
        if (!serializingValues.has(value)) {
          return entry.refName;
        }
      }
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }

      const elements = value.map(item => serializeValue(item, valueToHash, hashRegistry, stringRegistry));
      return '[' + elements.join(', ') + ']';
    } else {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return '{}';
      }

      const pairs = keys.map(key => {
        const serializedValue = serializeValue(value[key], valueToHash, hashRegistry, stringRegistry);
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
  sortedDuplicates: Array<[string, HashEntry]>,
  stringRegistry: Map<string, StringEntry>
): string {
  const lines: string[] = [];

  lines.push('// Auto-generated deduplicated module');
  lines.push('// Strings and objects extracted for memory efficiency');
  lines.push('');

  // Generate string array if there are deduplicated strings
  const deduplicatedStrings = Array.from(stringRegistry.values())
    .filter(entry => entry.count >= 3)
    .sort((a, b) => b.count - a.count); // Sort by frequency

  if (deduplicatedStrings.length > 0) {
    deduplicatedStrings.forEach((entry, index) => {
      entry.index = index;
    });

    lines.push('const _s = [');
    deduplicatedStrings.forEach((entry, index) => {
      const comma = index < deduplicatedStrings.length - 1 ? ',' : '';
      lines.push(`  ${JSON.stringify(entry.value)}${comma}`);
    });
    lines.push('];');
    lines.push('');
  }

  // Generate object/array const declarations
  for (const [_, entry] of sortedDuplicates) {
    serializingValues.add(entry.value);
    const code = serializeValue(entry.value, valueToHash, hashRegistry, stringRegistry);
    serializingValues.delete(entry.value);
    lines.push(`const ${entry.refName} = ${code};`);
  }

  if (sortedDuplicates.length > 0) {
    lines.push('');
  }

  const rootCode = serializeValue(rootValue, valueToHash, hashRegistry, stringRegistry);
  lines.push(`export default ${rootCode};`);

  return lines.join('\n');
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

export function deduplicateJSON(jsonString: string | object): string {
  const debug = typeof process !== 'undefined' && process.env.DEBUG_TIMING;
  const t0 = debug ? Date.now() : 0;

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

  const t1 = debug ? Date.now() : 0;
  const { hashRegistry, valueToHash, stringRegistry } = traverse(rootValue);
  const t2 = debug ? Date.now() : 0;

  analyzeDependencies(hashRegistry, valueToHash);
  const t3 = debug ? Date.now() : 0;

  const sortedDuplicates = topologicalSort(hashRegistry);
  const t4 = debug ? Date.now() : 0;

  assignRefNames(sortedDuplicates);
  const t5 = debug ? Date.now() : 0;

  const code = generateCode(rootValue, valueToHash, hashRegistry, sortedDuplicates, stringRegistry);
  const t6 = debug ? Date.now() : 0;

  if (debug) {
    console.log('\nTiming breakdown:');
    console.log(`  Parse: ${t1 - t0}ms`);
    console.log(`  Traverse: ${t2 - t1}ms`);
    console.log(`  Analyze deps: ${t3 - t2}ms`);
    console.log(`  Topo sort: ${t4 - t3}ms`);
    console.log(`  Assign names: ${t5 - t4}ms`);
    console.log(`  Generate code: ${t6 - t5}ms`);
    console.log(`  Total: ${t6 - t0}ms`);
  }

  return code;
}

export function getDeduplicationStats(jsonString: string | object): {
  uniqueValues: number;
  deduplicatedValues: number;
  totalOccurrences: number;
  uniqueStrings: number;
  deduplicatedStrings: number;
  totalStringOccurrences: number;
  estimatedSavings: string;
} {
  let rootValue: any;
  if (typeof jsonString === 'string') {
    rootValue = JSON.parse(jsonString);
  } else {
    rootValue = jsonString;
  }

  const { hashRegistry, stringRegistry } = traverse(rootValue);

  const duplicates = Array.from(hashRegistry.values()).filter(entry => entry.count >= 3);
  const totalOccurrences = duplicates.reduce((sum, entry) => sum + entry.count, 0);

  const stringDuplicates = Array.from(stringRegistry.values()).filter(entry => entry.count >= 3);
  const totalStringOccurrences = stringDuplicates.reduce((sum, entry) => sum + entry.count, 0);

  return {
    uniqueValues: hashRegistry.size,
    deduplicatedValues: duplicates.length,
    totalOccurrences,
    uniqueStrings: stringRegistry.size,
    deduplicatedStrings: stringDuplicates.length,
    totalStringOccurrences,
    estimatedSavings: `${duplicates.length} object/array variables + ${stringDuplicates.length} strings, ${totalOccurrences + totalStringOccurrences} total references`
  };
}

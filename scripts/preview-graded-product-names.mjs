/**
 * Preview graded export inventory names — Option A vs Option B.
 * Run: node scripts/preview-graded-product-names.mjs
 */

const SINGLES = [
  "Clean New Red",
  "Clean New Black",
  "Clean Old Red",
  "Clean Old Black",
];

function parseSingle(label) {
  const match = /^Clean (New|Old) (Red|Black)$/.exec(label);
  if (!match) return null;
  return { age: match[1], color: match[2], label };
}

function parseInputs(productTypes) {
  const singles = new Map();
  const fixed = new Set();

  for (const type of productTypes) {
    const parsed = parseSingle(type);
    if (parsed) {
      singles.set(`${parsed.age}|${parsed.color}`, parsed);
    } else {
      fixed.add(type);
    }
  }

  return { singles: [...singles.values()], fixed: [...fixed] };
}

function agesFrom(singles) {
  return new Set(singles.map((s) => s.age));
}

function colorsFrom(singles) {
  return new Set(singles.map((s) => s.color));
}

function shortName(singles) {
  const ages = agesFrom(singles);
  const colors = colorsFrom(singles);

  const agePhrase =
    ages.size === 2 ? "New & Old" : ages.has("New") ? "New" : "Old";
  const colorPhrase =
    colors.size === 2 ? "Red & Black" : colors.has("Red") ? "Red" : "Black";

  if (ages.size === 1 && colors.size === 1) {
    return singles[0].label;
  }

  if (ages.size === 1) {
    return `Clean ${agePhrase} ${colorPhrase}`;
  }

  if (colors.size === 1) {
    return `Clean ${agePhrase} ${colorPhrase}`;
  }

  if (ages.size === 2 && colors.size === 2) {
    return "Clean Combined Mix";
  }

  return null;
}

function crossPairName(singles) {
  if (singles.length !== 2) return null;
  const ages = agesFrom(singles);
  const colors = colorsFrom(singles);
  if (ages.size !== 2 || colors.size !== 2) return null;

  const sorted = [...singles].sort(
    (a, b) =>
      (a.age === "New" ? 0 : 1) - (b.age === "New" ? 0 : 1) ||
      (a.color === "Red" ? 0 : 1) - (b.color === "Red" ? 0 : 1),
  );

  return `Clean ${sorted[0].age} ${sorted[0].color} & ${sorted[1].age} ${sorted[1].color}`;
}

function listName(singles) {
  const order = { New: 0, Old: 1, Red: 0, Black: 1 };
  const sorted = [...singles].sort(
    (a, b) =>
      order[a.age] - order[b.age] || order[a.color] - order[b.color],
  );
  const parts = sorted.map((s) => `${s.age} ${s.color}`);
  return `Clean Mix — ${parts.join(" + ")}`;
}

/** Option A — precise: short patterns when possible, explicit list for awkward 3+ mixes */
function optionA(productTypes) {
  const unique = [...new Set(productTypes)];
  if (unique.length === 1) return unique[0];

  const { singles, fixed } = parseInputs(unique);
  if (fixed.length > 0 && singles.length === 0) {
    return fixed.length === 1 ? fixed[0] : `Clean Mix — ${fixed.join(" + ")}`;
  }
  if (fixed.length > 0) {
    const singleLabels = singles.map((s) => s.label);
    return `Clean Mix — ${[...singleLabels, ...fixed].join(" + ")}`;
  }

  if (singles.length === 1) return singles[0].label;

  const cross = crossPairName(singles);
  if (cross) return cross;

  const short = shortName(singles);
  if (short && singles.length === 2) return short;

  if (singles.length >= 3) {
    const ages = agesFrom(singles);
    const colors = colorsFrom(singles);
    if (ages.size === 2 && colors.size === 2 && singles.length === 4) {
      return "Clean Combined Mix";
    }
    return listName(singles);
  }

  return short ?? listName(singles);
}

/** Option B — simple: 3+ distinct clean singles always become Combined Mix */
function optionB(productTypes) {
  const unique = [...new Set(productTypes)];
  if (unique.length === 1) return unique[0];

  const { singles, fixed } = parseInputs(unique);
  if (fixed.length > 0 && singles.length === 0) {
    return fixed.length === 1 ? fixed[0] : "Clean Combined Mix";
  }
  if (fixed.length > 0) {
    return "Clean Combined Mix";
  }

  if (singles.length === 1) return singles[0].label;
  if (singles.length >= 3) return "Clean Combined Mix";

  const cross = crossPairName(singles);
  if (cross) return cross;

  return shortName(singles) ?? "Clean Combined Mix";
}

const scenarios = [
  {
    title: "Single type (no mix)",
    mixes: [["Clean Old Red"], ["Clean New Black"]],
  },
  {
    title: "Two bags — same age, both colors",
    mixes: [["Clean Old Red", "Clean Old Black"], ["Clean New Red", "Clean New Black"]],
  },
  {
    title: "Two bags — same color, both ages",
    mixes: [["Clean New Red", "Clean Old Red"], ["Clean New Black", "Clean Old Black"]],
  },
  {
    title: "Two bags — cross (your examples)",
    mixes: [
      ["Clean New Red", "Clean Old Black"],
      ["Clean New Black", "Clean Old Red"],
      ["Clean Old Red", "Clean New Black"],
    ],
  },
  {
    title: "Three distinct singles",
    mixes: [
      ["Clean New Red", "Clean New Black", "Clean Old Red"],
      ["Clean New Red", "Clean Old Red", "Clean Old Black"],
      ["Clean New Red", "Clean New Black", "Clean Old Black"],
    ],
  },
  {
    title: "All four corners (full grid)",
    mixes: [
      [
        "Clean New Red",
        "Clean New Black",
        "Clean Old Red",
        "Clean Old Black",
      ],
    ],
  },
  {
    title: "Partial grading same session (same name logic)",
    mixes: [
      ["Clean Old Red", "Clean Old Red"],
    ],
    note: "Duplicate source type = still one label",
  },
];

console.log("");
console.log("GRADED EXPORT NAME PREVIEW");
console.log("=".repeat(72));
console.log("");
console.log(
  "Option A = precise list when 3+ types don't fit a short pattern",
);
console.log(
  "Option B = any 3+ distinct singles → always 'Clean Combined Mix'",
);
console.log("");

for (const group of scenarios) {
  console.log(`── ${group.title} ${"─".repeat(Math.max(0, 50 - group.title.length))}`);
  if (group.note) console.log(`   (${group.note})`);
  console.log("");

  for (const mix of group.mixes) {
    const input = mix.join("  +  ");
    const a = optionA(mix);
    const b = optionB(mix);
    const same = a === b ? "  ✓ same" : "  ← different";

    console.log(`  Input:    ${input}`);
    console.log(`  Option A: ${a}`);
    console.log(`  Option B: ${b}${same}`);
    console.log("");
  }
}

console.log("=".repeat(72));
console.log("PARTIAL GRADING EXAMPLE (bags in room vs graded batch)");
console.log("=".repeat(72));
console.log("");

const partialExample = [
  {
    preStock: "PSK-001 · Clean Old Red",
    received: 20,
    take: 5,
  },
  {
    preStock: "PSK-002 · Clean Old Black",
    received: 15,
    take: 6,
  },
];

let totalBags = 0;
for (const row of partialExample) {
  const left = row.received - row.take;
  console.log(
    `  ${row.preStock}: ${row.received} in room → grade ${row.take} → ${left} left`,
  );
  totalBags += row.take;
}

const mixTypes = ["Clean Old Red", "Clean Old Black"];
console.log("");
console.log(`  Export batch: ${totalBags} bags from mix above`);
console.log(`  Option A name: ${optionA(mixTypes)}`);
console.log(`  Option B name: ${optionB(mixTypes)}`);
console.log("");

const cliMix = process.argv.slice(2);
if (cliMix.length > 0) {
  console.log("=".repeat(72));
  console.log("YOUR CUSTOM MIX");
  console.log("=".repeat(72));
  console.log("");
  console.log(`  Input:    ${cliMix.join("  +  ")}`);
  console.log(`  Option A: ${optionA(cliMix)}`);
  console.log(`  Option B: ${optionB(cliMix)}`);
  console.log("");
  console.log("Try more: node scripts/preview-graded-product-names.mjs Clean New Red Clean Old Black");
  console.log("");
}

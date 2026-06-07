/**
 * Run: node scripts/test-graded-product-type.mjs
 * Self-contained — mirrors graded-product-type.ts naming rules.
 */

const GRADED = {
  redMixed: "Red Mixed",
  blackMixed: "Black Mixed",
  combinedMixed: "Combined Mixed",
  newCombinedMixed: "New Combined Mixed",
  oldCombinedMixed: "Old Combined Mixed",
};

const CLEAN_SINGLE = /^Clean (New|Old) (Red|Black)$/;

function parseCleanSingle(productType) {
  const match = CLEAN_SINGLE.exec(productType);
  if (!match) {
    return null;
  }
  return { age: match[1], color: match[2], label: productType };
}

function colorFlagsForLabel(productType) {
  const single = parseCleanSingle(productType);
  if (single) {
    return single.color === "Red"
      ? { red: true, black: false }
      : { red: false, black: true };
  }

  switch (productType) {
    case "Red Mixed":
      return { red: true, black: false };
    case "Black Mixed":
      return { red: false, black: true };
    case "Combined Mixed":
    case "New Combined Mixed":
    case "Old Combined Mixed":
    case "Mixed":
      return { red: true, black: true };
    default:
      return { red: false, black: false };
  }
}

function mergeFlags(types) {
  return types.reduce(
    (acc, type) => {
      const flags = colorFlagsForLabel(type);
      return {
        red: acc.red || flags.red,
        black: acc.black || flags.black,
      };
    },
    { red: false, black: false },
  );
}

function agesFromTypes(types) {
  let hasNew = false;
  let hasOld = false;

  for (const type of types) {
    const single = parseCleanSingle(type);
    if (single) {
      if (single.age === "New") {
        hasNew = true;
      } else {
        hasOld = true;
      }
      continue;
    }

    if (
      type === "Red Mixed" ||
      type === "Black Mixed" ||
      type === "Combined Mixed" ||
      type === "Mixed"
    ) {
      hasNew = true;
      hasOld = true;
      continue;
    }

    if (type === "New Combined Mixed") {
      hasNew = true;
      continue;
    }

    if (type === "Old Combined Mixed") {
      hasOld = true;
    }
  }

  return { hasNew, hasOld };
}

function buildGradedProductType(sourceProductTypes) {
  const unique = [
    ...new Set(sourceProductTypes.map((t) => t.trim()).filter(Boolean)),
  ];

  if (unique.length === 0) {
    return GRADED.combinedMixed;
  }

  if (unique.length === 1) {
    return unique[0];
  }

  const flags = mergeFlags(unique);

  if (flags.red && flags.black) {
    const { hasNew, hasOld } = agesFromTypes(unique);
    if (hasNew && !hasOld) {
      return GRADED.newCombinedMixed;
    }
    if (hasOld && !hasNew) {
      return GRADED.oldCombinedMixed;
    }
    return GRADED.combinedMixed;
  }

  if (flags.red) {
    return GRADED.redMixed;
  }

  if (flags.black) {
    return GRADED.blackMixed;
  }

  return GRADED.combinedMixed;
}

function proportionalKg(bagsTaken, bagsAvailable, kgAvailable) {
  if (bagsTaken <= 0 || bagsAvailable <= 0 || kgAvailable <= 0) {
    return 0;
  }

  if (bagsTaken >= bagsAvailable) {
    return Math.round(kgAvailable * 1000) / 1000;
  }

  return Math.round(((kgAvailable * bagsTaken) / bagsAvailable) * 1000) / 1000;
}

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

console.log("buildGradedProductType");
assert("single", buildGradedProductType(["Clean Old Red"]) === "Clean Old Red");
assert(
  "new + old red",
  buildGradedProductType(["Clean New Red", "Clean Old Red"]) === "Red Mixed",
);
assert(
  "new + old black",
  buildGradedProductType(["Clean New Black", "Clean Old Black"]) === "Black Mixed",
);
assert(
  "new red + new black",
  buildGradedProductType(["Clean New Red", "Clean New Black"]) === "New Combined Mixed",
);
assert(
  "old red + old black",
  buildGradedProductType(["Clean Old Red", "Clean Old Black"]) === "Old Combined Mixed",
);
assert(
  "new red + old black",
  buildGradedProductType(["Clean New Red", "Clean Old Black"]) === "Combined Mixed",
);
assert(
  "all four",
  buildGradedProductType([
    "Clean New Red",
    "Clean New Black",
    "Clean Old Red",
    "Clean Old Black",
  ]) === "Combined Mixed",
);
assert(
  "three with both colors",
  buildGradedProductType([
    "Clean New Red",
    "Clean New Black",
    "Clean Old Red",
  ]) === "Combined Mixed",
);

console.log("");
console.log("proportionalKg");
assert("half bags", proportionalKg(5, 20, 100) === 25);
assert("all bags", proportionalKg(20, 20, 100) === 100);

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

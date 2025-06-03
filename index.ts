import fs from "fs";
import { buildPoseidon } from "circomlibjs";

(async () => {
  const poseidon = await buildPoseidon();

  // Sample credentials
  const credentials = [
    { id: "cred1", data: "some data 1" },
    { id: "cred2", data: "some data 2" },
    { id: "cred3", data: "some data 3" },
    { id: "cred4", data: "some data 4" },
  ];

  // Target credential to generate the proof for
  const targetIndex = 0;
  const credentialString = JSON.stringify(credentials[targetIndex]);
  const credentialHex = Buffer.from(credentialString).toString("hex");
  const credentialBigInt = BigInt("0x" + credentialHex);
  console.log("Credential BigInt:", credentialBigInt.toString());

  // Hash each credential as a leaf using Poseidon(2) [consistent with Circom]
  const leaves = credentials.map((cred) => {
    const credStr = JSON.stringify(cred);
    const credHex = Buffer.from(credStr).toString("hex");
    const credBigIntLeaf = BigInt("0x" + credHex);
    const leafHash = poseidon.F.toObject(poseidon([credBigIntLeaf, BigInt(0)]));
    console.log("Poseidon leaf hash:", leafHash.toString());
    return leafHash;
  });

  // Define target depth
  const targetDepth = 20;

  // Pad leaves to nearest power of two
  const padLeavesToPowerOfTwo = (arr: bigint[]): bigint[] => {
    const nextPowerOfTwo = 1 << Math.ceil(Math.log2(arr.length));
    const padValue = arr[arr.length - 1]; // Repeat last leaf
    while (arr.length < nextPowerOfTwo) {
      arr.push(padValue);
    }
    return arr;
  };

  const paddedLeaves = padLeavesToPowerOfTwo([...leaves]);

  // Build Merkle tree to match target depth
  const buildMerkleTree = (leaves: bigint[], targetDepth: number): bigint[][] => {
    let currentLevel = leaves;
    const tree: bigint[][] = [];
    while (true) {
      tree.unshift(currentLevel);
      if (currentLevel.length === 1 && tree.length >= targetDepth + 1) {
        break;
      }

      const nextLevel: bigint[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push(poseidon.F.toObject(poseidon([left, right])));
      }

      currentLevel = nextLevel;
    }

    // Pad to target depth with self-hashing
    while (tree.length < targetDepth + 1) {
      const lastLevel = tree[0];
      const nextLevel = [];
      for (let i = 0; i < lastLevel.length; i += 2) {
        const left = lastLevel[i];
        const right = lastLevel[i + 1] || left;
        nextLevel.push(poseidon.F.toObject(poseidon([left, right])));
      }
      tree.unshift(nextLevel);
    }

    return tree;
  };

  const merkleTree = buildMerkleTree(paddedLeaves, targetDepth);
  const root = merkleTree[0][0];

  console.log("Merkle Root:", root.toString());

  // Generate Merkle proof
  const getMerkleProof = (
    tree: bigint[][],
    index: number,
    targetDepth: number
  ): { pathElements: string[]; pathIndices: number[] } => {
    const pathElements: string[] = [];
    const pathIndices: number[] = [];
    let idx = index;

    for (let level = tree.length - 1; level > 0; level--) {
      const levelNodes = tree[level];
      const isRightNode = idx % 2;
      const siblingIndex = isRightNode ? idx - 1 : idx + 1;
      const siblingValue = levelNodes[siblingIndex] ?? levelNodes[idx];
      pathElements.push(siblingValue.toString());
      pathIndices.push(isRightNode);
      idx = Math.floor(idx / 2);
    }

    // Pad path to target depth with last sibling
    while (pathElements.length < targetDepth) {
      const lastSibling = pathElements[pathElements.length - 1];
      pathElements.push(lastSibling);
      pathIndices.push(0);
    }

    return { pathElements, pathIndices };
  };

  // For this example, use targetIndex = 0
  const proof = getMerkleProof(merkleTree, targetIndex, targetDepth);

  // Build input.json
  const inputJson = {
    root: root.toString(),
    credential: credentialBigInt.toString(),
    pathElements: proof.pathElements,
    pathIndices: proof.pathIndices
  };

  // Save input.json
  fs.writeFileSync("input.json", JSON.stringify(inputJson, null, 2));
  console.log("Generated input.json:");
  console.log(JSON.stringify(inputJson, null, 2));
})();

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

  // Hash each credential to create leaves
  const leaves = credentials.map((cred) => {
    const credString = JSON.stringify(cred);
    const credHex = Buffer.from(credString).toString("hex");
    const credBigInt = BigInt("0x" + credHex);
    return poseidon.F.toObject(poseidon([credBigInt]));
  });

  // Build the Merkle tree
  const buildMerkleTree = (leaves: bigint[]): bigint[][] => {
    const tree: bigint[][] = [leaves];
    let currentLevel = leaves;
    while (currentLevel.length > 1) {
      const nextLevel: bigint[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || currentLevel[i]; // Duplicate last element if odd number
        nextLevel.push(poseidon.F.toObject(poseidon([left, right])));
      }
      tree.unshift(nextLevel); // Add to the beginning to have root at index 0
      currentLevel = nextLevel;
    }
    return tree;
  };

  const merkleTree = buildMerkleTree(leaves);
  const root = merkleTree[0][0];

  console.log("Merkle Root:", root.toString());

  const getMerkleProof = (
    tree: bigint[][],
    index: number
  ): { pathElements: bigint[]; pathIndices: number[] } => {
    const pathElements: bigint[] = [];
    const pathIndices: number[] = [];
    let idx = index;
    for (let level = tree.length - 1; level > 0; level--) {
      const levelNodes = tree[level];
      const isRightNode = idx % 2;
      const siblingIndex = isRightNode ? idx - 1 : idx + 1;
      pathElements.push(levelNodes[siblingIndex] || levelNodes[idx]); // Handle edge case
      pathIndices.push(isRightNode);
      idx = Math.floor(idx / 2);
    }
    return { pathElements, pathIndices };
  };

  // Example: Generate proof for the first credential
  const proof = getMerkleProof(merkleTree, 0);
  console.log(
    "Path Elements:",
    proof.pathElements.map((e) => e.toString())
  );
  console.log("Path Indices:", proof.pathIndices);
})();

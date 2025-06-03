import { buildPoseidon } from "circomlibjs";
// import { MerkleTree } from "circomlibjs";

(async () => {
  const poseidon = await buildPoseidon();
  const leaf = poseidon.F.toString(poseidon([123]));
  console.log("Hashed leaf:", leaf);
})();

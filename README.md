# keynoir-algorithm

The algorithm along with its testing for the keynoir system. This uses merkle trees to combine various credentials into one master credential, verified through NIZKP algorithm. The libraries used are circom (as a binary), circomjs (for circom dependencies), and snarkjs. The following are the the expected components for the algorithm to function correctly.

1. Input sample credentials within `index.ts`.
2. Generate a .zkey to be used as the base foundation for all transaction.
`snarkjs groth16 setup merkleproof.r1cs pot20_final.ptau merkleproof.zkey`
3. Export a verification key based on the generated .zkey.
`snarkjs zkey export verificationkey merkleproof.zkey verification_key.json`
4. Run the index.ts file to generate an input.json file.
5. Generate the proof to be used as the basis for verification.
`snarkjs groth16 prove merkleproof.zkey witness.wtns proof.json public.json`
6. Verify the proof.
`snarkjs groth16 verify verification_key.json public.json proof.json`

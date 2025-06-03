pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template Mux1() {
    signal input in0;
    signal input in1;
    signal input sel; // 0 or 1
    signal output out;

    signal notSel;
    signal selIn1;
    signal notSelIn0;

    notSel <== 1 - sel;
    selIn1 <== sel * in1;
    notSelIn0 <== notSel * in0;
    out <== selIn1 + notSelIn0;
}

template MerkleProof(depth) {
    signal input root;
    signal input credential; // RAW credential, not pre-hashed
    signal input pathElements[depth];
    signal input pathIndices[depth];

    component leafHasher = Poseidon(2);
    leafHasher.inputs[0] <== credential;
    leafHasher.inputs[1] <== 0;
    signal leaf;
    leaf <== leafHasher.out;

    signal currentHash[depth + 1];
    signal left[depth];
    signal right[depth];

    component muxLeft[depth];
    component muxRight[depth];
    component hashNode[depth];

    currentHash[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        muxLeft[i] = Mux1();
        muxLeft[i].in0 <== currentHash[i];
        muxLeft[i].in1 <== pathElements[i];
        muxLeft[i].sel <== pathIndices[i];
        left[i] <== muxLeft[i].out;

        muxRight[i] = Mux1();
        muxRight[i].in0 <== pathElements[i];
        muxRight[i].in1 <== currentHash[i];
        muxRight[i].sel <== pathIndices[i];
        right[i] <== muxRight[i].out;

        hashNode[i] = Poseidon(2);
        hashNode[i].inputs[0] <== left[i];
        hashNode[i].inputs[1] <== right[i];

        currentHash[i + 1] <== hashNode[i].out;
    }

    root === currentHash[depth];
}

component main = MerkleProof(20);

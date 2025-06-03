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
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];

    signal currentHash[depth + 1];
    signal left[depth];
    signal right[depth];

    component muxLeft[depth];
    component muxRight[depth];
    component hashNode[depth];

    currentHash[0] <== leaf;

    for (var i = 0; i < depth; i++) {
        // Instantiate Mux1 components
        muxLeft[i] = Mux1();
        muxRight[i] = Mux1();

        // Set inputs for muxLeft
        muxLeft[i].in0 <== currentHash[i];
        muxLeft[i].in1 <== pathElements[i];
        muxLeft[i].sel <== pathIndices[i];
        left[i] <== muxLeft[i].out;

        // Set inputs for muxRight
        muxRight[i].in0 <== pathElements[i];
        muxRight[i].in1 <== currentHash[i];
        muxRight[i].sel <== pathIndices[i];
        right[i] <== muxRight[i].out;

        // Hash the pair
        hashNode[i] = Poseidon(2);
        hashNode[i].inputs[0] <== left[i];
        hashNode[i].inputs[1] <== right[i];

        currentHash[i + 1] <== hashNode[i].out;
    }

    // Ensure the computed root matches the provided root
    root === currentHash[depth];
}

component main = MerkleProof(20);

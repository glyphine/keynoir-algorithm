pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template LeafHasher() {
    signal input credential;
    signal output leaf;
    component hash = Poseidon(2);
    hash.inputs[0] <== credential;
    hash.inputs[1] <== 0;
    leaf <== hash.out;
}

component main = LeafHasher();

import seedrandom from "seedrandom";

for (let i = 0; i < 2; i++) {
    const x = seedrandom('hello')
    console.log(x)
    console.log(x.int32())
    console.log(x.quick())
    console.log(x.double())
}

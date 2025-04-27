# Example Nitrox Equivalent air depth calculation

## Formulas

nitrogen fraction = 1 - oxygen fraction in the mix
equivalent air depth pressure = (pressure at depth * oxygen fraction) / 0.79
(0.79 is the oxygen fraction in air)
equivalent air depth = convert equivalent air depth pressure to depth


## Example

What is the equivalent air depth of nitrox mix with 32 % oxygen at 30 m?

nitrogen fraction of 32 % oxygen => 0.32 => 1 - 0.32 = 0.68
pressure at depth = 30 m => (30 * 10) + 1 = 4 bar
equivalent air depth pressure = (4 * 0.68) / 0.79 = 3.44 bar
equivalent air dept = (3.44 - 1) / 10 = 24.4 m

# Gas blender

This calculator helps to create gas mixes using the partial pressures method for source tank (even with remaining gas in it) using top mix, oxygen and helium.
Results are shown in a separate table. This calculator uses real gas law (gas compressibility), so the results slightly differ from the simplified ideal gas examples below.
The expected procedure is to empty, release or start with remaining gas.
Then add helium and oxygen and finally top with top mix up to the required pressure.

```text
Simplified Example: 
Use air and oxygen only to mix 200 b of Ean32 to tank with 50 b of air.
Nitrogen in Ean32 = 1 - 0.32 = 0.68
Required nitrogen content = 200 * 0.68 = 136 b nitrogen
Nitrogen in Air = 1 - 0.21 = 0.79
Current nitrogen content = 50 * 0.79 = 39.5 b nitrogen
We need to add = 136 - 39.5 = 96.5 b nitrogen
i.e. We need to add = 96.5 / 0.79 = 122 b air
But first we add = 200 - 50 - 122 = 28 b oxygen
```

## Identify mix

Use the `Identify mix` toggle in the calculator header to switch from `Blend` mode to identify mode.
This mode answers the opposite question: what mix will I get, when I only top up the remaining gas in the tank with top mix (without adding oxygen or helium)?

* Enter the source tank mix and its current pressure
* Enter the top mix
* Enter the `Final pressure` you will fill the tank to. It needs to be higher or equal to the source pressure.

The target O2 and He fields become read-only and show the resulting mix.
Results table shows the resulting O2, He and N2 content and the pressure added by the top mix.

```text
Simplified Example (ideal gas):
Tank contains 50 b of air, topped with Ean32 to 200 b.
Added top mix = 200 - 50 = 150 b
Oxygen = (50 * 0.21 + 150 * 0.32) / 200 = 0.2925 i.e. 29 %
Real gas calculation in this case results in 29.1 % of oxygen.
```

# Comparison with other planners

This page describes how the algorithm was verified. The selected dives are based on the verification done by [Dive Tools](https://divetools.app/validation). The numbers show that the decompression is comparable; the main difference between the tools is in CNS. Our implementation is closer to Subsurface because it shares most of its design decisions, although there are still differences. None of these tools gives the correct answer; they only present the results of the mathematical models they implement. The profiles used are listed at the [end of this page](./planner_comparison.md#dugong-reference-dives).

## Settings

All the tools used the following settings for every dive. A setting not listed here was left at the tool's default value. Unless the profile name states otherwise, the gradient factors were 30/70.

| Parameter    | Value                        |
|--------------|------------------------------|
| Water        | fresh, 1000 kg/m³            |
| Ascent       | 10 m/min                     |
| Descent      | 20 m/min                     |
| Stop every   | 3 m                          |
| Last stop    | 6 m (round stops to minutes) |
| GF           | 30/70 %                      |
| Altitude     | 0 m a.s.l.                   |
| CCR setpoint | 1.3                          |

DT = Dive Tools, SS = Subsurface, MD = MultiDeco, SW = Shearwater. Gas switch depths are in metres. A dash (-) means the value is not available. Bottom gas precedes the deco/bailout list.

## Runtime

Total dive time in minutes.

| Profile | DT | SS | MD | SW | Dugong |
|---|---:|---:|---:|---:|---:|
| GF 100/100 · Air 18 m / 30 min (NDL) | 32 | 32 | 31 | 32 | 32 |
| Air 30 m / 25 min | 48 | 48 | 50 | 53 | 48 |
| Air 40 m / 30 min · deco EAN50@21m | 66 | 67 | 68 | 71 | 68 |
| TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 52 | 51 | 53 | 54 | 52 |
| TMX 18/45 60 m / 25 min · deco EAN50@21m, O₂@6m | 82 | 81 | 81 | 82 | 82 |
| TMX 10/70 90 m / 20 min · deco TMX 21/35@42m, EAN50@21m, O₂@6m | 140 | 147 | 144 | 132 | 147 |
| Multi-level Air 30→18 m / 18 min, 25 min | 70 | 69 | 75 | - | 69 |
| GF 50/85 · Air 30 m / 20 min · last stop 6 m | 27 | 27 | - | - | 27 |
| CCR EAN32 30 m / 60 min | 81 | 81 | 81 | 82 | 82 |
| CCR TMX 21/35 45 m / 45 min | 100 | 99 | 101 | 101 | 99 |
| CCR TMX 18/45 70 m / 30 min | 128 | 127 | 129 | 128 | 124 |
| CCR TMX 10/70 100 m / 25 min | 224 | 230 | 233 | 224 | 231 |
| CCR bailout 70 m / 30 min · bailout TMX 15/55@70m, EAN50@21m, O₂@6m | 146 | 147 | 145 | 147 | 148 |
| GF 30/70 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 52 | 51 | 53 | 54 | 52 |
| GF 40/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 47 | 46 | 47 | 48 | 47 |
| GF 50/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 47 | 46 | 46 | 47 | 46 |

## First stop

Depth of the first decompression stop in metres.

| Profile | DT | SS | MD | SW | Dugong |
|---|---:|---:|---:|---:|---:|
| GF 100/100 · Air 18 m / 30 min (NDL) | none | none | none | none | none |
| Air 30 m / 25 min | 12 | 12 | 12 | 12 | 12 |
| Air 40 m / 30 min · deco EAN50@21m | 18 | 18 | 21 | 21 | 21 |
| TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 21 | 21 | 24 | 21 | 21 |
| TMX 18/45 60 m / 25 min · deco EAN50@21m, O₂@6m | 33 | 30 | 33 | 30 | 30 |
| TMX 10/70 90 m / 20 min · deco TMX 21/35@42m, EAN50@21m, O₂@6m | 54 | 54 | 60 | 51 | 54 |
| Multi-level Air 30→18 m / 18 min, 25 min | 6 | 6 | 9 | - | 6 |
| GF 50/85 · Air 30 m / 20 min · last stop 6 m | 6 | 6 | - | - | 6 |
| CCR EAN32 30 m / 60 min | 9 | 9 | 12 | 9 | 12 |
| CCR TMX 21/35 45 m / 45 min | 21 | 21 | 24 | 21 | 21 |
| CCR TMX 18/45 70 m / 30 min | 39 | 39 | 42 | 39 | 36 |
| CCR TMX 10/70 100 m / 25 min | 60 | 60 | 66 | 60 | 60 |
| CCR bailout 70 m / 30 min · bailout TMX 15/55@70m, EAN50@21m, O₂@6m | 42 | 39 | 42 | 39 | 39 |
| GF 30/70 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 21 | 21 | 24 | 21 | 21 |
| GF 40/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 18 | 18 | 21 | 18 | 21 |
| GF 50/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 15 | 15 | 18 | 15 | 21 |

## CNS

Central nervous system oxygen toxicity in %.

| Profile | DT | SS | MD | SW | Dugong |
|---|---:|---:|---:|---:|---:|
| GF 100/100 · Air 18 m / 30 min (NDL) | 4 | 4 | 4 | - | 4 |
| Air 30 m / 25 min | 6 | 6 | 6 | 6 | 6 |
| Air 40 m / 30 min · deco EAN50@21m | 20 | 20 | 21 | 21 | 21 |
| TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 47 | 43 | 38 | 29 | 46 |
| TMX 18/45 60 m / 25 min · deco EAN50@21m, O₂@6m | 82 | 77 | 62 | 47 | 80 |
| TMX 10/70 90 m / 20 min · deco TMX 21/35@42m, EAN50@21m, O₂@6m | 148 | 149 | 111 | 74 | 135 |
| Multi-level Air 30→18 m / 18 min, 25 min | 8 | 8 | 8 | - | 8 |
| GF 50/85 · Air 30 m / 20 min · last stop 6 m | 5 | 5 | - | - | 5 |
| CCR EAN32 30 m / 60 min | 45 | 45 | 45 | 46 | 46 |
| CCR TMX 21/35 45 m / 45 min | 55 | 55 | 56 | 56 | 56 |
| CCR TMX 18/45 70 m / 30 min | 71 | 71 | 71 | 71 | 74 |
| CCR TMX 10/70 100 m / 25 min | 124 | 129 | 129 | 124 | 131 |
| CCR bailout 70 m / 30 min · bailout TMX 15/55@70m, EAN50@21m, O₂@6m | 152 | 145 | 112 | 83 | - |
| GF 30/70 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 47 | 43 | 38 | 29 | 46 |
| GF 40/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 39 | 35 | 33 | 25 | 39 |
| GF 50/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 39 | 36 | 31 | 24 | 38 |

## OTU

Pulmonary oxygen toxicity in oxygen tolerance units.

| Profile | DT | SS | MD | SW | Dugong |
|---|---:|---:|---:|---:|---:|
| GF 100/100 · Air 18 m / 30 min (NDL) | 7 | 7 | 6 | - | 6 |
| Air 30 m / 25 min | 17 | 18 | 17 | - | 17 |
| Air 40 m / 30 min · deco EAN50@21m | 59 | 60 | 60 | - | 61 |
| TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 70 | 68 | 72 | - | 71 |
| TMX 18/45 60 m / 25 min · deco EAN50@21m, O₂@6m | 112 | 110 | 112 | - | 113 |
| TMX 10/70 90 m / 20 min · deco TMX 21/35@42m, EAN50@21m, O₂@6m | 182 | 189 | 187 | - | 176 |
| Multi-level Air 30→18 m / 18 min, 25 min | 18 | 18 | 17 | - | 18 |
| GF 50/85 · Air 30 m / 20 min · last stop 6 m | 14 | 15 | - | - | 14 |
| CCR EAN32 30 m / 60 min | 119 | 119 | 119 | - | 119 |
| CCR TMX 21/35 45 m / 45 min | 147 | 145 | 147 | - | 145 |
| CCR TMX 18/45 70 m / 30 min | 188 | 186 | 188 | - | 187 |
| CCR TMX 10/70 100 m / 25 min | 330 | 338 | 340 | - | 340 |
| CCR bailout 70 m / 30 min · bailout TMX 15/55@70m, EAN50@21m, O₂@6m | 195 | 193 | 191 | - | - |
| GF 30/70 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 70 | 68 | 72 | - | 71 |
| GF 40/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 61 | 59 | 64 | - | 63 |
| GF 50/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m | 61 | 60 | 61 | - | 62 |

## Dugong reference dives

- [GF 100/100 · Air 18 m / 30 min (NDL)](https://dugong.online/?t=1-24-0-200-0.209-0&de=0-18-120-1,18-18-1680-1&di=20,30&o=0,10,10,10,3,20,2,1,1,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [Air 30 m / 25 min](https://dugong.online/?t=1-24-0-200-0.209-0&de=0-30-90-1,30-30-1410-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [Air 40 m / 30 min · deco EAN50@21m](https://dugong.online/?t=1-24-0-200-0.209-0,2-11.1-0-200-0.5-0&de=0-40-120-1,40-40-1680-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.21-0.35,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0&de=0-45-135-1,45-45-1365-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [TMX 18/45 60 m / 25 min · deco EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.18-0.45,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0&de=0-60-180-1,60-60-1320-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [TMX 10/70 90 m / 20 min · deco TMX 21/35@42m, EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.1-0.7,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0,4-11.1-0-200-0.21-0.35&de=0-90-300-1,90-90-900-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [Multi-level Air 30→18 m / 18 min, 25 min](https://dugong.online/?t=1-15-0-200-0.209-0&de=0-30-90-1,30-30-990-1,30-18-60-1,18-18-1440-1&di=20,30&o=0,9,3,3,3,18,2,0.85,0.4,3,1.6,30,1.4,10,1,1,0,2,1,0,20,5&ao=1,0)
- [GF 50/85 · Air 30 m / 20 min · last stop 6 m](https://dugong.online/?t=1-24-0-200-0.209-0&de=0-30-90-1,30-30-1110-1&di=20,30&o=0,10,10,10,3,20,2,0.85,0.5,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [CCR EAN32 30 m / 60 min](https://dugong.online/?t=1-24-0-200-0.32-0,2-3-0-200-1-0&de=0-30-90-1,30-30-3510-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&r=4,8,1,0.8,6,1.3,1.3,1.3,1.3,20&ao=1,0)
- [CCR TMX 21/35 45 m / 45 min](https://dugong.online/?t=1-24-0-200-0.21-0.35,2-3-0-200-1-0&de=0-45-135-1,45-45-2565-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&r=4,8,1,0.8,6,1.3,1.3,1.3,1.3,20&ao=1,0)
- [CCR TMX 18/45 70 m / 30 min](https://dugong.online/?t=1-24-0-200-0.18-0.45,2-3-0-200-1-0&de=0-70-240-1,70-70-1560-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&r=4,8,1,0.8,6,1.3,1.3,1.3,1.3,20&ao=1,0)
- [CCR TMX 10/70 100 m / 25 min](https://dugong.online/?t=1-24-0-200-0.1-0.7,2-3-0-200-1-0&de=0-100-300-1,100-100-1200-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&r=4,8,1,0.8,6,1.3,1.3,1.3,1.3,20&ao=1,0)
- [CCR bailout 70 m / 30 min · bailout TMX 15/55@70m, EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.15-0.55,2-3-0-200-1-0,3-11.1-0-200-1-0,4-11.1-0-200-0.5-0,5-11.1-0-200-0.15-0.55&de=0-70-300-1,70-70-1500-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&r=4,8,1,0.8,6,1.3,1.3,1.3,1.3,20&ao=1,0)
- [GF 30/70 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.21-0.35,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0&de=0-45-135-1,45-45-1365-1&di=20,30&o=0,10,10,10,3,20,2,0.7,0.3,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [GF 40/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.21-0.35,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0&de=0-45-135-1,45-45-1365-1&di=20,30&o=0,10,10,10,3,20,2,0.85,0.4,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)
- [GF 50/85 · TMX 21/35 45 m / 25 min · deco EAN50@21m, O₂@6m](https://dugong.online/?t=1-24-0-200-0.21-0.35,2-11.1-0-200-0.5-0,3-11.1-0-200-1-0&de=0-45-138-1,45-45-1362-1&di=20,30&o=0,10,10,10,3,20,2,0.85,0.5,6,1.6,30,1.4,10,1,1,1,1,1,0,20,5&ao=1,0)

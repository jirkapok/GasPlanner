export class TestDataJsonProvider {
    private diveProfiles: string[] = [
        `{
          "options": {
            "gfLow": 0.4,
            "gfHigh": 0.85,
            "maxPpO2": 1.4,
            "maxDecoPpO2": 1.6,
            "salinity": 1,
            "altitude": 0,
            "roundStopsToMinutes": false,
            "gasSwitchDuration": 2,
            "safetyStop": 2,
            "lastStopDepth": 3,
            "decoStopDistance": 3,
            "minimumAutoStopDepth": 10,
            "maxEND": 30,
            "oxygenNarcotic": true,
            "ascentSpeed6m": 3,
            "ascentSpeed50percTo6m": 6,
            "ascentSpeed50perc": 9,
            "descentSpeed": 18,
            "problemSolvingDuration": 1
          },
          "diver": {
            "rmv": 20
          },
          "tanks": [
            {
              "id": 1,
              "size": 15,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ],
          "plan": []
        }`,
        `{
          "options": {
            "gfLow": 0.4,
            "gfHigh": 0.85,
            "maxPpO2": 1.4,
            "maxDecoPpO2": 1.6,
            "salinity": 1,
            "altitude": 0,
            "roundStopsToMinutes": false,
            "gasSwitchDuration": 2,
            "safetyStop": 2,
            "lastStopDepth": 3,
            "decoStopDistance": 3,
            "minimumAutoStopDepth": 10,
            "maxEND": 30,
            "oxygenNarcotic": true,
            "ascentSpeed6m": 3,
            "ascentSpeed50percTo6m": 6,
            "ascentSpeed50perc": 9,
            "descentSpeed": 18,
            "problemSolvingDuration": 1
          },
          "diver": {
            "rmv": 20
          },
          "tanks": [
            {
              "id": 1,
              "size": 15,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ],
          "plan": [
            {
              "startDepth": 0,
              "endDepth": 10,
              "duration": 36,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 10,
              "endDepth": 10,
              "duration": 3564,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ]
        }`,
        `{
            "options": {
              "gfLow": 0.4,
              "gfHigh": 0.85,
              "maxPpO2": 1.4,
              "maxDecoPpO2": 1.6,
              "salinity": 1,
              "altitude": 0,
              "roundStopsToMinutes": false,
              "gasSwitchDuration": 2,
              "safetyStop": 2,
              "lastStopDepth": 3,
              "decoStopDistance": 3,
              "minimumAutoStopDepth": 10,
              "maxEND": 30,
              "oxygenNarcotic": true,
              "ascentSpeed6m": 3,
              "ascentSpeed50percTo6m": 6,
              "ascentSpeed50perc": 9,
              "descentSpeed": 18,
              "problemSolvingDuration": 1
            },
            "diver": {
              "rmv": 20
            },
            "tanks": [
              {
                "id": 1,
                "size": 24,
                "workPressure": 0,
                "startPressure": 200,
                "gas": {
                  "fO2": 0.209,
                  "fHe": 0
                }
              },
              {
                "id": 2,
                "size": 11,
                "workPressure": 0,
                "startPressure": 200,
                "gas": {
                  "fO2": 0.5,
                  "fHe": 0
                }
              },
              {
                "id": 3,
                "size": 11,
                "workPressure": 0,
                "startPressure": 150,
                "gas": {
                  "fO2": 1,
                  "fHe": 0
                }
              }
            ],
            "plan": [
              {
                "startDepth": 0,
                "endDepth": 40,
                "duration": 120,
                "tankId": 1,
                "gas": {
                  "fO2": 0.209,
                  "fHe": 0
                }
              },
              {
                "startDepth": 40,
                "endDepth": 40,
                "duration": 600,
                "tankId": 1,
                "gas": {
                  "fO2": 0.209,
                  "fHe": 0
                }
              },
              {
                "startDepth": 40,
                "endDepth": 21,
                "duration": 120,
                "tankId": 1,
                "gas": {
                  "fO2": 0.209,
                  "fHe": 0
                }
              },
              {
                "startDepth": 21,
                "endDepth": 21,
                "duration": 60,
                "tankId": 2,
                "gas": {
                  "fO2": 0.5,
                  "fHe": 0
                }
              },
              {
                "startDepth": 21,
                "endDepth": 3,
                "duration": 180,
                "tankId": 2,
                "gas": {
                  "fO2": 0.5,
                  "fHe": 0
                }
              },
                {
                "startDepth": 3,
                "endDepth": 3,
                "duration": 360,
                "tankId": 3,
                "gas": {
                  "fO2": 1,
                  "fHe": 0
                }
              },
              {
                "startDepth": 3,
                "endDepth": 0,
                "duration": 60,
                "tankId": 3,
                "gas": {
                  "fO2": 1,
                  "fHe": 0
                }
              }
            ]
          }`,
        `{
            "options": {
              "gfLow": 0.4,
              "gfHigh": 0.85,
              "maxPpO2": 1.4,
              "maxDecoPpO2": 1.6,
              "salinity": 1,
              "altitude": 0,
              "roundStopsToMinutes": false,
              "gasSwitchDuration": 2,
              "safetyStop": 2,
              "lastStopDepth": 3,
              "decoStopDistance": 3,
              "minimumAutoStopDepth": 10,
              "maxEND": 30,
              "oxygenNarcotic": true,
              "ascentSpeed6m": 3,
              "ascentSpeed50percTo6m": 6,
              "ascentSpeed50perc": 9,
              "descentSpeed": 18,
              "problemSolvingDuration": 1
            },
            "diver": {
              "rmv": 20
            },
            "tanks": [
              {
                "id": 1,
                "size": 24,
                "workPressure": 0,
                "startPressure": 200,
                "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "id": 2,
              "size": 11.1,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 1,
                "fHe": 0
              }
            }
          ],
          "plan": [
            {
              "startDepth": 0,
              "endDepth": 40,
              "duration": 180,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 40,
              "endDepth": 40,
              "duration": 1020,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ]
        }`,
        `
        {
          "options": {
            "gfLow": 0.4,
            "gfHigh": 0.85,
            "maxPpO2": 1.4,
            "maxDecoPpO2": 1.6,
            "salinity": 1,
            "altitude": 0,
            "roundStopsToMinutes": false,
            "gasSwitchDuration": 2,
            "safetyStop": 2,
            "lastStopDepth": 3,
            "decoStopDistance": 3,
            "minimumAutoStopDepth": 10,
            "maxEND": 30,
            "oxygenNarcotic": true,
            "ascentSpeed6m": 3,
            "ascentSpeed50percTo6m": 6,
            "ascentSpeed50perc": 9,
            "descentSpeed": 18,
            "problemSolvingDuration": 1
          },
          "diver": {
            "rmv": 20
          },
          "tanks": [
            {
              "id": 1,
              "size": 24,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 0.18,
                "fHe": 0.45
              }
            },
            {
              "id": 2,
              "size": 11.1,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 1,
                "fHe": 0
              }
            },
            {
              "id": 3,
              "size": 11.1,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 0.5,
                "fHe": 0
              }
            }
          ],
          "plan": [
            {
              "startDepth": 0,
              "endDepth": 60,
              "duration": 180,
              "tankId": 1,
              "gas": {
                "fO2": 0.18,
                "fHe": 0.45
              }
            },
            {
              "startDepth": 60,
              "endDepth": 60,
              "duration": 900,
              "tankId": 1,
              "gas": {
                "fO2": 0.18,
                "fHe": 0.45
              }
            }
          ]
        }`,
        `{
          "options": {
            "gfLow": 0.4,
            "gfHigh": 0.85,
            "maxPpO2": 1.4,
            "maxDecoPpO2": 1.6,
            "salinity": 1,
            "altitude": 0,
            "roundStopsToMinutes": false,
            "gasSwitchDuration": 2,
            "safetyStop": 2,
            "lastStopDepth": 3,
            "decoStopDistance": 3,
            "minimumAutoStopDepth": 10,
            "maxEND": 30,
            "oxygenNarcotic": true,
            "ascentSpeed6m": 3,
            "ascentSpeed50percTo6m": 6,
            "ascentSpeed50perc": 9,
            "descentSpeed": 18,
            "problemSolvingDuration": 1
          },
          "diver": {
            "rmv": 20
          },
          "tanks": [
            {
              "id": 1,
              "size": 15,
              "workPressure": 0,
              "startPressure": 200,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ],
          "plan": [
            {
              "startDepth": 0,
              "endDepth": 40,
              "duration": 180,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 40,
              "endDepth": 40,
              "duration": 300,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 40,
              "endDepth": 30,
              "duration": 300,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 30,
              "endDepth": 30,
              "duration": 300,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 30,
              "endDepth": 40,
              "duration": 300,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            },
            {
              "startDepth": 40,
              "endDepth": 40,
              "duration": 300,
              "tankId": 1,
              "gas": {
                "fO2": 0.209,
                "fHe": 0
              }
            }
          ]
        }`
    ];
    private preferencesPrefix = `
        {
          "options": {
            "imperialUnits": false,
            "isComplex": true,
            "language": "en"
          },
          "dives": [`;
    private preferencesSuffix = `
                  ]
        }
        `;
    public get(profileAIndex: number, profileBIndex: number): string {

        return this.preferencesPrefix +
            this.diveProfiles[profileAIndex] +
            ',' + this.diveProfiles[profileBIndex] +
            this.preferencesSuffix;
    }

    public getAll(): string{
        return this.preferencesPrefix +
            this.diveProfiles[0] +
            ',' + this.diveProfiles[1] +
            ',' + this.diveProfiles[2] +
            ',' + this.diveProfiles[3] +
            ',' + this.diveProfiles[4] +
            ',' + this.diveProfiles[5] +
            this.preferencesSuffix;
    }

    public numberOfProfiles(): number {
        return this.diveProfiles.length;
    }
}

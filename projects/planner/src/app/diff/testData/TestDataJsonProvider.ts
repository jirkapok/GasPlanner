export class TestDataJsonProvider {
    private profileOneJson = `
            {
              "options": {
                "imperialUnits": false,
                "isComplex": false,
                "language": "en"
              },
              "dives": [
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
                }
              ]
            }`;
    public get(num: number): string{
        switch (num) {
            case 1:
                return this.profileOneJson;
            default:
                throw new RangeError('Requested profile index is out of range!');
        }
    }
}

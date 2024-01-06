import {Component} from '@angular/core';
import {WayPointsService} from '../shared/waypoints.service';
import {UnitConversion} from '../shared/UnitConversion';
import {Segments, StandardGases, Tank, Time} from 'scuba-physics';
import {WayPoint} from '../shared/models';
import {PreferencesStore} from '../shared/preferencesStore';
import {PlannerService} from '../shared/planner.service';

export class TestData {
    public readonly wayPointsA: WayPoint[];
    public readonly tanksA: Tank[];

    public readonly wayPointsB: WayPoint[];
    public readonly tanksB: Tank[];

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
    constructor(private preferencesStore: PreferencesStore, private plannerService: PlannerService) {
        const units = new UnitConversion();
        const waypointService = new WayPointsService(units);

        this.tanksA = [
            new Tank(24, 200, 21),
            new Tank(11, 200, 50),
            new Tank(11, 150, 100),
        ];
        this.tanksA[0].consumed = 120;
        this.tanksA[1].consumed = 80;
        this.tanksA[2].consumed = 60;

        const segmentsA = new Segments();
        segmentsA.add(0, 40, StandardGases.air, Time.oneMinute * 2);
        segmentsA.add(40, 40, StandardGases.air, Time.oneMinute * 10);
        segmentsA.add(40, 21, StandardGases.air, Time.oneMinute * 2);
        segmentsA.add(21, 21, StandardGases.ean50, Time.oneMinute);
        segmentsA.add(21, 3, StandardGases.ean50, Time.oneMinute * 3);
        segmentsA.add(3, 3, StandardGases.oxygen, Time.oneMinute * 6);
        segmentsA.add(3, 0, StandardGases.oxygen, Time.oneMinute);
        this.wayPointsA = waypointService.calculateWayPoints(segmentsA.items);

        this.tanksB = [
            new Tank(24, 200, 21),
            new Tank(11, 200, 50)
        ];
        this.tanksB[0].consumed = 90;
        this.tanksB[1].consumed = 40;

        const segmentsB = new Segments();
        segmentsB.add(0, 30, StandardGases.air, Time.oneMinute * 4);
        segmentsB.add(30, 30, StandardGases.air, Time.oneMinute * 10);
        segmentsB.add(30, 15, StandardGases.air, Time.oneMinute * 3);
        segmentsB.add(15, 15, StandardGases.ean50, Time.oneMinute);
        segmentsB.add(15, 0, StandardGases.ean50, Time.oneMinute * 2);
        this.wayPointsB = waypointService.calculateWayPoints(segmentsB.items);
    }

    public loadProfile(){
        localStorage.setItem('preferences', this.profileOneJson);
        this.preferencesStore.load();
        this.plannerService.calculate();
    }
}

@Component({
    selector: 'app-diff',
    templateUrl: './diff.component.html',
    styleUrls: ['./diff.component.scss']
})
export class DiffComponent {
    public testData = new TestData(this.preferencesStore, this.plannerService);
    constructor(private preferencesStore: PreferencesStore, private plannerService: PlannerService) {
    }
}

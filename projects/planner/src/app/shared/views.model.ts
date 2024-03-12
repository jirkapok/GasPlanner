import { Salinity } from 'scuba-physics';

export interface DashBoardViewState extends ViewState {
    selectedDiveIndex: number;
}

export interface GasViewState extends ViewState {
    o2: number;
    he: number;
    maxPO2: number;
    depth: number;
    mndLimit: number;
    oxygenNarcotic: boolean;
}

export interface AltitudeViewState extends ViewState {
    /** pressure is calculated from altitude */
    altitude: number;
    actualDepth: number;
}

export interface RedundanciesViewState extends ViewState {
    firstTank: TankFillState;
    secondTank: TankFillState;
}

export interface BlenderViewState extends ViewState {
    source: TankMix;
    target: TankMix;
    topMix: Mix;
}

export interface TankMix extends Mix {
    /** current pressure in bars */
    pressure: number;
}

export interface Mix {
    o2: number;
    he: number;
}

export interface TankFillState {
    startPressure: number;
    workingPressure: number;
    size: number;
}

/** We don\'t need mod, since it is calculated */
export interface NitroxViewState extends ViewState {
    fO2: number;
    pO2: number;
}

/** rmv is calculated */
export interface SacViewState extends ViewState {
    avgDepth: number;
    tankSize: number;
    workPressure: number;
    used: number;
    duration: number;
}

export interface NdlViewState extends ViewState {
    fO2: number;
    pO2: number;
    altitude: number;
    salinity: Salinity;
    gfLow: number;
    gfHigh: number;
}

export interface WeightViewState extends ViewState {
    tankSize: number;
    workPressure: number;
    consumed: number;
}

/** all data are stored in metric */
export interface ViewState {
    /** case sensitive id as view key */
    id: string;
}

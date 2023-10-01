import { Salinity } from 'scuba-physics';

export interface AltitudeViewState extends ViewState {
    /** pressure is calculated from altitude */
    altitude: number;
    actualDepth: number;
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

/** all data are stored in metric */
export interface ViewState {
    /** case sensitive id as view key */
    id: string;
}

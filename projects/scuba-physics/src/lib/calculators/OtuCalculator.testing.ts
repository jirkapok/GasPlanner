import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { StandardGases } from '../gases/StandardGases';

/**
 *  fresh water, sea level altitude, 1032 bar surface, 1000 density
 *  values obtained from SubSurface for comparison
 */
export class ToxicityProfiles {
    /* cns 25 %, otu 64, this is high ppO2 test */
    public static ean32At36m: Segment[] = [
        new Segment(0, 36, StandardGases.ean32, Time.oneMinute * 3),
        new Segment(36, 36, StandardGases.ean32, Time.oneMinute * 22),
        new Segment(36, 0, StandardGases.ean32, Time.oneMinute * 30)
    ];

    /* cns 127 %, otu 115 */
    public static oxygenAt6m: Segment[] = [
        new Segment(0, 6, StandardGases.oxygen, Time.oneMinute * 1),
        new Segment(6, 6, StandardGases.oxygen, Time.oneMinute * 58),
        new Segment(6, 0, StandardGases.oxygen, Time.oneMinute * 1)
    ];


    /* cns 7 %, otu 21 */
    public static airAt40m: Segment[] = [
        new Segment(0, 40, StandardGases.air, Time.oneMinute * 3),
        new Segment(40, 40, StandardGases.air, Time.oneMinute * 17),
        new Segment(40, 15, StandardGases.air, Time.oneMinute * 3),
        new Segment(15, 15, StandardGases.air, Time.oneMinute * 1),
        new Segment(15, 12, StandardGases.air, Time.oneMinute * 1),
        new Segment(12, 12, StandardGases.air, Time.oneMinute * 1),
        new Segment(12, 9, StandardGases.air, Time.oneMinute * 1),
        new Segment(9, 9, StandardGases.air, Time.oneMinute * 5),
        new Segment(9, 6, StandardGases.air, Time.oneMinute * 1),
        new Segment(6, 6, StandardGases.air, Time.oneMinute * 23),
        new Segment(6, 0, StandardGases.air, Time.oneMinute * 2),
    ];

    /* cns 41 %, otu 62 */
    public static trimixAt50m: Segment[] = [
        new Segment(0, 50, StandardGases.trimix1845, Time.oneMinute * 3),
        new Segment(50, 50, StandardGases.trimix1845, Time.oneMinute * 17),
        new Segment(50, 24, StandardGases.trimix1845, Time.oneMinute * 3),
        new Segment(24, 24, StandardGases.trimix1845, Time.oneMinute * 1),
        new Segment(24, 21, StandardGases.trimix1845, Time.oneMinute * 1),
        new Segment(21, 21, StandardGases.ean50, Time.oneMinute * 3),
        new Segment(21, 9, StandardGases.ean50, Time.oneMinute * 4),
        new Segment(9, 9, StandardGases.ean50, Time.oneMinute * 2),
        new Segment(9, 6, StandardGases.ean50, Time.oneMinute * 1),

        new Segment(6, 6, StandardGases.oxygen, Time.oneMinute * 12),
        new Segment(6, 0, StandardGases.oxygen, Time.oneMinute * 2),
    ];
}

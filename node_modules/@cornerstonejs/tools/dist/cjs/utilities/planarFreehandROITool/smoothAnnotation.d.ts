import { PlanarFreehandROIAnnotation } from '../../types/ToolSpecificAnnotationTypes';
export declare type SmoothOptions = {
    knotsRatioPercentage: number;
    loop: number;
};
export default function smoothAnnotation(annotation: PlanarFreehandROIAnnotation, options?: SmoothOptions): boolean;

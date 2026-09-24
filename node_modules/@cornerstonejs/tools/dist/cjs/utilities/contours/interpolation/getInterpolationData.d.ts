import type { InterpolationViewportData, Annotation } from '../../../types';
export declare type FilterParam = {
    parentKey?: (annotation: any) => any;
    key: string;
    value: unknown;
};
export default function getInterpolationData(viewportData: InterpolationViewportData, filterParams?: any[]): Map<number, Annotation[]>;

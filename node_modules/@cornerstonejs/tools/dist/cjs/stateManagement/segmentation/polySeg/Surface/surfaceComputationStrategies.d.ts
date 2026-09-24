import type { Types } from '@cornerstonejs/core';
import { PolySegConversionOptions } from '../../../../types';
export declare type RawSurfacesData = {
    segmentIndex: number;
    data: Types.SurfaceData;
}[];
export declare function computeSurfaceData(segmentationId: string, options?: PolySegConversionOptions): Promise<{
    geometryIds: Map<number, string>;
}>;
declare function computeSurfaceFromLabelmapSegmentation(segmentationId: any, options?: PolySegConversionOptions): Promise<RawSurfacesData>;
declare function computeSurfaceFromContourSegmentation(segmentationId: string, options?: PolySegConversionOptions): Promise<RawSurfacesData>;
export { computeSurfaceFromContourSegmentation, computeSurfaceFromLabelmapSegmentation, };

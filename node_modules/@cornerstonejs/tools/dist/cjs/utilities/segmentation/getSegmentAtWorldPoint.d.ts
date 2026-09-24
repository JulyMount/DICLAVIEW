import type { Types } from '@cornerstonejs/core';
import { SegmentationRepresentations } from '../../enums';
import { Segmentation } from '../../types';
declare type Options = {
    representationType?: SegmentationRepresentations;
    viewport?: Types.IViewport;
};
export declare function getSegmentAtWorldPoint(segmentationId: string, worldPoint: Types.Point3, options?: Options): number;
export declare function getSegmentAtWorldForLabelmap(segmentation: Segmentation, worldPoint: Types.Point3, { viewport }: Options): number | undefined;
export declare function getSegmentAtWorldForContour(segmentation: Segmentation, worldPoint: Types.Point3, { viewport }: Options): number;
export {};

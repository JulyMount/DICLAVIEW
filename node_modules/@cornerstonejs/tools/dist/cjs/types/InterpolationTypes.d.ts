import { Types } from '@cornerstonejs/core';
import { Annotation } from './AnnotationTypes';
import { InterpolationROIAnnotation } from './ToolSpecificAnnotationTypes';
export declare type InterpolationViewportData = {
    annotation: InterpolationROIAnnotation;
    interpolationUID: string;
    viewport: Types.IViewport;
    sliceData: Types.ImageSliceData;
    isInterpolationUpdate?: boolean;
};
export declare type ImageInterpolationData = {
    sliceIndex: number;
    annotations?: Annotation[];
};
export declare type AcceptInterpolationSelector = {
    toolNames?: string[];
    segmentationId?: string;
    segmentIndex?: number;
    sliceIndex?: number;
};
